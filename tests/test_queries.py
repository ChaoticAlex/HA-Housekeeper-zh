"""The shared runner of the recorder queries: one job at a time, not cut short by a client."""

from __future__ import annotations

import asyncio
import threading
from unittest.mock import patch

import pytest

pytest.importorskip("homeassistant")
pytest.importorskip("pytest_homeassistant_custom_component")

from homeassistant.core import HomeAssistant  # noqa: E402

from custom_components.ha_housekeeper.const import DOMAIN  # noqa: E402
from custom_components.ha_housekeeper.queries import (  # noqa: E402
    REFRESH_AGE,
    REFRESH_TICK,
    cached_query,
    next_reply,
)


class FakeRecorder:
    def __init__(self, hass: HomeAssistant) -> None:
        self._hass = hass

    def async_add_executor_job(self, job, *args):
        return self._hass.async_add_executor_job(job, *args)


@pytest.fixture
def recorder(hass: HomeAssistant):
    with patch("homeassistant.components.recorder.get_instance", return_value=FakeRecorder(hass)):
        yield


class Job:
    """A blocking job that waits until the test lets it finish and counts its starts."""

    def __init__(self) -> None:
        self.release = threading.Event()
        self.started = threading.Event()
        self.calls = 0

    def __call__(self):
        self.calls += 1
        self.started.set()
        assert self.release.wait(10)
        return {"n": self.calls}


async def test_a_client_that_gives_up_does_not_free_the_lock(hass: HomeAssistant, recorder) -> None:
    job = Job()
    waiter = asyncio.create_task(cached_query(hass, "q", 300, job))
    await hass.async_add_executor_job(job.started.wait, 10)
    waiter.cancel()  # the websocket timeout: the client stops waiting
    with pytest.raises(asyncio.CancelledError):
        await waiter
    lock = hass.data[DOMAIN]["reliability_lock"]
    assert lock.locked()  # the executor job is still reading the database
    other = await cached_query(hass, "other", 300, Job())  # another kind must not start now
    assert other.busy
    again = asyncio.create_task(cached_query(hass, "q", 300, job, refresh=True))
    await asyncio.sleep(0)
    job.release.set()
    result = await again
    assert job.calls == 1 and result.raw == {"n": 1} and not lock.locked()


async def test_parallel_calls_share_one_job(hass: HomeAssistant, recorder) -> None:
    job = Job()
    first = asyncio.create_task(cached_query(hass, "q", 300, job))
    await hass.async_add_executor_job(job.started.wait, 10)
    second = asyncio.create_task(cached_query(hass, "q", 300, job))
    await asyncio.sleep(0)
    job.release.set()
    a, b = await asyncio.gather(first, second)
    assert job.calls == 1 and a.raw is b.raw


async def test_cache_refresh_and_busy(hass: HomeAssistant, recorder) -> None:
    job = Job()
    job.release.set()
    first = await cached_query(hass, "q", 300, job)
    assert not first.cached and job.calls == 1
    second = await cached_query(hass, "q", 300, job)
    assert second.cached and job.calls == 1
    third = await cached_query(hass, "q", 300, job, refresh=True)
    assert not third.cached and job.calls == 2
    lock = hass.data[DOMAIN]["reliability_lock"]
    await lock.acquire()
    try:
        stale = await cached_query(
            hass, "q", 0, job, refresh=True
        )  # lock held elsewhere: last result
        assert stale.cached and not stale.busy and job.calls == 2
        fresh_name = await cached_query(hass, "never", 300, job)
        assert fresh_name.busy
    finally:
        lock.release()


async def test_a_failing_job_frees_the_lock_and_is_not_cached(
    hass: HomeAssistant, recorder
) -> None:
    def boom():
        raise RuntimeError("db gone")

    with pytest.raises(RuntimeError):
        await cached_query(hass, "q", 300, boom)
    await asyncio.sleep(0)
    assert not hass.data[DOMAIN]["reliability_lock"].locked()
    assert not hass.data[DOMAIN]["query_inflight"]
    ok = await cached_query(hass, "q", 300, lambda: {"fine": True})
    assert ok.raw == {"fine": True}


def test_next_reply_renews_the_most_overdue_view_once_it_is_due() -> None:
    now = 100_000.0
    fresh = now - (REFRESH_AGE["storms"] - REFRESH_TICK) + 1
    replies = {
        "storms:1": {"computed_at": fresh},
        "reliability:7:0": {"computed_at": now - REFRESH_AGE["reliability"]},
        "db_health": {"computed_at": now - 2 * REFRESH_AGE["db_health"]},
        "unknown": {"computed_at": 0},
    }
    assert next_reply(replies, now) == "db_health"
    del replies["db_health"]
    assert next_reply(replies, now) == "reliability:7:0"
    del replies["reliability:7:0"]
    assert next_reply(replies, now) is None
