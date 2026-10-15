"""Recorder database health: size, growth, duplicate and missing statistics, gaps in the states.

Only reads. Nothing is repaired and nothing is deleted. Only SQLite is measured (the size of the
files); the statistics and gap checks work on every database the recorder supports. The queries
share the lock of the reliability query and the result is kept for a few minutes.
"""

from __future__ import annotations

import os
import time
from datetime import UTC, date, datetime
from typing import Any

from homeassistant.core import HomeAssistant

from .meter import recorder_ready
from .payloads import DbHealthResult
from .queries import ReplyStore, cached_query, kept_reply

DAY = 86400
INTEGRITY_LINES = 5  # complaints of the full check that are kept
CACHE_SECONDS = 600
WAL_SHARE = 0.25
WAL_BYTES = 1024**3
GROWTH_FACTOR = 2.0
GROWTH_MIN_BYTES = 100 * 1024**2
GROWTH_RECENT_DAYS = 7
GROWTH_BASE_DAYS = 28
GAP_WINDOW_DAYS = 30
GAP_MIN_HOURS = 6  # missing hours in a statistics series before it is named
GAP_SERIES_LIMIT = 200
DUPLICATE_LIMIT = 5000
STATE_GAP_MINUTES = 10
STATE_GAP_WINDOW_DAYS = 7
RESTART_GRACE = 60  # seconds a gap may reach beyond the downtime and still count as the restart
LIST_LIMIT = 5
MISSING_SERIES_LIMIT = 60  # series with missing hours sent to the panel
MISSING_GAPS_LIMIT = 8  # gaps shared by all series that are named
# Findings of validate_statistics that mean "gone or not recorded" belong to the unused view.
THRESHOLDS = {
    "wal_share": WAL_SHARE,
    "wal_bytes": WAL_BYTES,
    "growth_factor": GROWTH_FACTOR,
    "growth_min_bytes": GROWTH_MIN_BYTES,
    "growth_recent_days": GROWTH_RECENT_DAYS,
    "growth_base_days": GROWTH_BASE_DAYS,
    "gap_window_days": GAP_WINDOW_DAYS,
    "gap_min_hours": GAP_MIN_HOURS,
    "state_gap_minutes": STATE_GAP_MINUTES,
    "state_gap_window_days": STATE_GAP_WINDOW_DAYS,
}
IGNORED_ISSUES = {"no_state", "entity_no_longer_recorded", "entity_not_recorded"}


def database_files(hass: HomeAssistant) -> dict[str, Any]:
    """Blocking: the size of the database and WAL file, for SQLite only."""
    from homeassistant.components.recorder import get_instance

    instance = get_instance(hass)
    dialect = str(
        getattr(getattr(instance, "dialect_name", None), "value", None)
        or getattr(instance, "dialect_name", "")
        or ""
    )
    result: dict[str, Any] = {"dialect": dialect, "db_bytes": None, "wal_bytes": None}
    if dialect != "sqlite":
        return result
    try:
        from sqlalchemy.engine import make_url

        name = make_url(instance.db_url).database
    except Exception:
        name = None
    if not name or name == ":memory:":
        return result
    path = name if os.path.isabs(name) else hass.config.path(name)
    for key, suffix in (("db_bytes", ""), ("wal_bytes", "-wal")):
        try:
            result[key] = os.stat(path + suffix).st_size
        except OSError:
            result[key] = 0 if suffix else None
    return result


def integrity_lines(hass: HomeAssistant, limit: int = INTEGRITY_LINES) -> list[str]:
    """Blocking: the first complaints of SQLite's full check, empty when it is fine or not SQLite.

    Reads only. The full ``integrity_check`` is used on purpose: the quick one does not compare
    the indexes with the tables, which is where a damaged recorder usually shows first. It takes
    minutes on a large database.
    """
    from homeassistant.components.recorder.util import session_scope
    from sqlalchemy import text

    if database_files(hass)["dialect"] != "sqlite":
        return []
    with session_scope(hass=hass, read_only=True) as session:
        lines = [
            str(line)
            for line in session.execute(text(f"PRAGMA integrity_check({int(limit)})")).scalars()
        ]
    return [] if not lines or lines == ["ok"] else lines


def integrity_problem(hass: HomeAssistant) -> str | None:
    """Blocking: the first complaint of the full check, ``None`` when it is fine or not SQLite.

    Run before rows are deleted: a damaged index shows up as "database disk image is malformed"
    in the middle of a purge, long after the cause.
    """
    lines = integrity_lines(hass, 1)
    return lines[0] if lines else None


def is_corruption_error(err: BaseException) -> bool:
    """Whether an error means a damaged SQLite file (also when SQLAlchemy wraps it)."""
    return "malformed" in str(err).lower()


def query_db(hass: HomeAssistant, now: float) -> dict[str, Any]:
    """Blocking: statistics duplicates and gaps, validation issues and gaps in the states."""
    from homeassistant.components.recorder.db_schema import (
        States,
        Statistics,
        StatisticsMeta,
    )
    from homeassistant.components.recorder.statistics import validate_statistics
    from homeassistant.components.recorder.util import session_scope
    from sqlalchemy import Integer, cast, func, select

    started = time.monotonic()
    result: dict[str, Any] = {"now": now, **database_files(hass)}
    with session_scope(hass=hass, read_only=True) as session:
        names = {
            metadata_id: (statistic_id, source)
            for metadata_id, statistic_id, source in session.execute(
                select(StatisticsMeta.id, StatisticsMeta.statistic_id, StatisticsMeta.source)
            ).all()
        }
        duplicates = session.execute(
            select(Statistics.metadata_id, Statistics.start_ts, func.count().label("n"))
            .group_by(Statistics.metadata_id, Statistics.start_ts)
            .having(func.count() > 1)
            .limit(DUPLICATE_LIMIT)
        ).all()
        result["duplicates"] = [
            {"statistic_id": names.get(mid, ("?", ""))[0], "start": float(ts), "count": int(n)}
            for mid, ts, n in duplicates
        ]
        since = now - GAP_WINDOW_DAYS * DAY
        result["series"] = [
            {
                "statistic_id": names[mid][0],
                "rows": int(rows),
                "first": float(first),
                "last": float(last),
            }
            for mid, rows, first, last in session.execute(
                select(
                    Statistics.metadata_id,
                    func.count(func.distinct(Statistics.start_ts)),
                    func.min(Statistics.start_ts),
                    func.max(Statistics.start_ts),
                )
                .where(Statistics.start_ts >= since)
                .group_by(Statistics.metadata_id)
            ).all()
            if mid in names and names[mid][1] == "recorder"
        ]
        hour = cast(Statistics.start_ts / 3600, Integer)
        result["hours"] = sorted(
            int(h)
            for (h,) in session.execute(
                select(hour).where(Statistics.start_ts >= since).group_by(hour)
            ).all()
            if h is not None
        )
        bucket = cast(States.last_updated_ts / 60, Integer)
        window = now - STATE_GAP_WINDOW_DAYS * DAY
        result["state_minutes"] = sorted(
            int(minute)
            for (minute,) in session.execute(
                select(bucket).where(States.last_updated_ts >= window).group_by(bucket)
            ).all()
            if minute is not None
        )
    issues: dict[str, list[str]] = {}
    for statistic_id, found in validate_statistics(hass).items():
        types = sorted({str(issue.type) for issue in found} - IGNORED_ISSUES)
        if types:
            issues[statistic_id] = types
    result["issues"] = issues
    result["took_ms"] = round((time.monotonic() - started) * 1000)
    return result


def growth(sizes: dict[str, int], today: date) -> dict[str, Any]:
    """Growth of the last week against the weeks before, from the daily sizes."""

    def at(offset: int) -> int | None:
        """The latest sample on or before ``today - offset`` days within three days of it."""
        for step in range(offset, offset + 4):
            value = sizes.get((today.fromordinal(today.toordinal() - step)).isoformat())
            if value is not None:
                return value
        return None

    latest, week_ago = at(0), at(GROWTH_RECENT_DAYS)
    base_start = at(GROWTH_RECENT_DAYS + GROWTH_BASE_DAYS)
    if latest is None or week_ago is None:
        return {"known": False, "samples": len(sizes)}
    recent = latest - week_ago
    result: dict[str, Any] = {
        "known": True,
        "samples": len(sizes),
        "recent_bytes": recent,
        "per_day": round(recent / GROWTH_RECENT_DAYS),
    }
    if base_start is not None:
        base = (week_ago - base_start) / (GROWTH_BASE_DAYS / GROWTH_RECENT_DAYS)
        result["base_bytes"] = round(base)
    return result


def state_gaps(
    minutes: list[int], now: float, down: list[tuple[float, float]]
) -> list[dict[str, Any]]:
    """Stretches of STATE_GAP_MINUTES or more without any row, told apart from restarts."""
    gaps = []
    pairs = list(zip(minutes, minutes[1:], strict=False))
    if minutes:
        pairs.append((minutes[-1], int(now // 60)))
    for a, b in pairs:
        if b - a < STATE_GAP_MINUTES:
            continue
        start, end = a * 60.0 + 60, b * 60.0
        restart = any(lo - RESTART_GRACE <= end and start <= hi + RESTART_GRACE for lo, hi in down)
        gaps.append(
            {
                "start": start,
                "end": end,
                "seconds": round(end - start),
                "cause": "restart" if restart else "recorder",
            }
        )
    return gaps


def shared_gaps(hours: list[int], down: list[tuple[float, float]]) -> list[dict[str, Any]]:
    """Runs of hours that no series has a row for: the statistics were not compiled then.

    Told apart like the state gaps: while Home Assistant was down it is a restart, else the recorder
    was not working. ``hours`` are the hours (epoch seconds divided by 3600) that have any row.
    """
    if not hours:
        return []
    present, runs, start = set(hours), [], None
    for hour in range(hours[0], hours[-1] + 1):
        if hour not in present:
            start = hour if start is None else start
        elif start is not None:
            runs.append((start, hour))
            start = None
    gaps = []
    for first, end in runs:
        lo, hi = first * 3600.0, end * 3600.0
        restart = any(a - RESTART_GRACE <= hi and lo <= b + RESTART_GRACE for a, b in down)
        gaps.append(
            {
                "start": lo,
                "end": hi,
                "hours": end - first,
                "cause": "restart" if restart else "recorder",
            }
        )
    return gaps


def down_periods(events: list[dict[str, Any]]) -> list[tuple[float, float]]:
    """Intervals Home Assistant was down, from the start entries that carry ``down_seconds``."""
    periods = []
    for event in events:
        if event.get("kind") != "start" or not isinstance(event.get("down_seconds"), int):
            continue
        try:
            end = datetime.fromisoformat(event["at"]).timestamp()
        except (KeyError, ValueError):
            continue
        periods.append((end - event["down_seconds"], end))
    return periods


def evaluate(
    raw: dict[str, Any],
    names: dict[str, str],
    sizes: dict[str, int],
    events: list[dict[str, Any]],
    today: date,
) -> dict[str, Any]:
    """Judge the numbers; every finding carries the numbers it rests on."""
    findings: list[dict[str, Any]] = []
    db, wal = raw.get("db_bytes"), raw.get("wal_bytes")
    if db and wal is not None and (wal >= WAL_BYTES or wal >= WAL_SHARE * db):
        findings.append({"kind": "wal_large", "level": "hint", "wal_bytes": wal, "db_bytes": db})
    grown = growth(sizes, today)
    if (
        grown.get("known")
        and grown["recent_bytes"] >= GROWTH_MIN_BYTES
        and grown.get("base_bytes") is not None
        and grown["recent_bytes"] >= GROWTH_FACTOR * max(grown["base_bytes"], 1)
    ):
        findings.append(
            {
                "kind": "growth",
                "level": "hint",
                "recent_bytes": grown["recent_bytes"],
                "base_bytes": grown["base_bytes"],
            }
        )
    duplicates = raw.get("duplicates", [])
    if duplicates:
        by_series: dict[str, int] = {}
        for item in duplicates:
            by_series[item["statistic_id"]] = by_series.get(item["statistic_id"], 0) + 1
        top = sorted(by_series.items(), key=lambda kv: kv[1], reverse=True)[:LIST_LIMIT]
        findings.append(
            {
                "kind": "duplicates",
                "level": "problem",
                "groups": len(duplicates),
                "capped": len(duplicates) >= DUPLICATE_LIMIT,
                "series": [
                    {"statistic_id": sid, "name": names.get(sid), "groups": n} for sid, n in top
                ],
            }
        )
    holes = []
    gaps_all = shared_gaps(raw.get("hours", []), down_periods(events))
    for series in raw.get("series", []):
        if series["statistic_id"] not in names:
            continue
        missing = round((series["last"] - series["first"]) / 3600) + 1 - series["rows"]
        if missing >= GAP_MIN_HOURS:
            lo, hi = series["first"] // 3600, series["last"] // 3600
            shared = sum(
                max(0, min(hi + 1, g["end"] // 3600) - max(lo, g["start"] // 3600))
                for g in gaps_all
            )
            shared = int(min(shared, missing))
            holes.append(
                {
                    **series,
                    "name": names[series["statistic_id"]],
                    "missing": missing,
                    "shared": shared,
                }
            )
    holes.sort(key=lambda h: (h["missing"] - h["shared"], h["missing"]), reverse=True)
    if holes:
        biggest = sorted(gaps_all, key=lambda g: g["hours"], reverse=True)[:MISSING_GAPS_LIMIT]
        findings.append(
            {
                "kind": "missing_hours",
                "level": "hint",
                "series_total": len(holes),
                "own_series": sum(h["missing"] - h["shared"] >= GAP_MIN_HOURS for h in holes),
                "gap_hours": sum(g["hours"] for g in gaps_all),
                "gaps_total": len(gaps_all),
                "gaps": sorted(biggest, key=lambda g: g["start"], reverse=True),
                "series": [
                    {
                        "statistic_id": h["statistic_id"],
                        "name": h["name"],
                        "missing": h["missing"],
                        "shared": h["shared"],
                        "own": h["missing"] - h["shared"],
                    }
                    for h in holes[:MISSING_SERIES_LIMIT]
                ],
            }
        )
    issues = raw.get("issues", {})
    if issues:
        findings.append(
            {
                "kind": "statistics_issues",
                "level": "problem",
                "series_total": len(issues),
                "series": [
                    {"statistic_id": sid, "name": names.get(sid), "types": types}
                    for sid, types in sorted(issues.items())[: LIST_LIMIT * 4]
                ],
            }
        )
    gaps = state_gaps(raw.get("state_minutes", []), raw["now"], down_periods(events))
    recorder_gaps = [g for g in gaps if g["cause"] == "recorder"]
    if recorder_gaps:
        findings.append(
            {
                "kind": "recorder_gap",
                "level": "problem",
                "gaps": len(recorder_gaps),
                "longest_seconds": max(g["seconds"] for g in recorder_gaps),
                "latest": sorted(recorder_gaps, key=lambda g: g["start"], reverse=True)[
                    :LIST_LIMIT
                ],
            }
        )
    order = {"problem": 0, "hint": 1}
    findings.sort(key=lambda f: order[f["level"]])
    return {
        "supported": raw.get("dialect") == "sqlite",
        "dialect": raw.get("dialect"),
        "db_bytes": db,
        "wal_bytes": wal,
        "growth": grown,
        "restart_gaps": sum(1 for g in gaps if g["cause"] == "restart"),
        "findings": findings,
        "took_ms": raw.get("took_ms"),
    }


async def sample_size(hass: HomeAssistant, events: Any) -> None:
    """Remember today's database size; a number per day, nothing else."""
    if not recorder_ready(hass):
        return
    from homeassistant.components.recorder import get_instance

    files = await get_instance(hass).async_add_executor_job(database_files, hass)
    if files.get("db_bytes") is not None:
        events.record_size(
            datetime.now(UTC).date().isoformat(),
            int(files["db_bytes"]) + int(files.get("wal_bytes") or 0),
        )


def recorder_retention(hass: HomeAssistant) -> dict[str, Any]:
    """How long the recorder keeps states and whether it purges by itself; only read, never changed."""
    from homeassistant.components.recorder import get_instance

    instance = get_instance(hass)
    days = getattr(instance, "keep_days", None)
    purge = getattr(instance, "auto_purge", None)
    return {
        "keep_days": days if isinstance(days, int) and not isinstance(days, bool) else None,
        "auto_purge": purge if isinstance(purge, bool) else None,
    }


def query_first(hass: HomeAssistant) -> dict[str, float | None]:
    """Blocking: the oldest long-term statistic and the oldest state (epoch seconds); both columns are indexed."""
    from homeassistant.components.recorder.db_schema import States, Statistics
    from homeassistant.components.recorder.util import session_scope
    from sqlalchemy import func, select

    with session_scope(hass=hass, read_only=True) as session:
        statistics = session.execute(select(func.min(Statistics.start_ts))).scalar()
        states = session.execute(select(func.min(States.last_updated_ts))).scalar()
    return {
        "statistics": float(statistics) if statistics is not None else None,
        "states": float(states) if states is not None else None,
    }


async def database_first(hass: HomeAssistant) -> dict[str, Any]:
    """When the oldest data in the recorder starts, i.e. since when this installation has records."""
    if not recorder_ready(hass):
        return {"available": False, "busy": False, "first": None}
    found = await cached_query(hass, "database_first", 3600, lambda: query_first(hass))
    if found.busy:
        return {"available": True, "busy": True, "first": None}
    dates = [value for value in found.raw.values() if value is not None]
    return {"available": True, "busy": False, "first": min(dates) if dates else None}


async def database_summary(hass: HomeAssistant, events: Any) -> dict[str, Any] | None:
    """Size, WAL and growth per day for the overview: two file stats and the stored daily sizes.

    Never touches the recorder tables, so a scan can ask for it. ``None`` without a recorder.
    """
    if not recorder_ready(hass):
        return None
    from homeassistant.components.recorder import get_instance

    files = await get_instance(hass).async_add_executor_job(database_files, hass)
    grown = growth(events.sizes, datetime.now(UTC).date())
    return {
        "dialect": files.get("dialect") or None,
        "db_bytes": files.get("db_bytes"),
        "wal_bytes": files.get("wal_bytes"),
        "per_day": grown.get("per_day") if grown.get("known") else None,
        "samples": grown.get("samples", 0),
        **recorder_retention(hass),
    }


async def db_health(
    hass: HomeAssistant,
    snapshot: dict[str, Any],
    events: Any,
    *,
    refresh: bool = False,
    store: ReplyStore | None = None,
) -> DbHealthResult:
    """Database health: size and growth, statistics duplicates, gaps and issues, recorder gaps."""
    if not recorder_ready(hass):
        return {"available": False, "findings": []}
    now = time.time()
    kept = None if refresh else kept_reply(store, "db_health", now, CACHE_SECONDS)
    if kept is not None:
        return kept  # type: ignore[return-value]
    found = await cached_query(
        hass, "db_health", CACHE_SECONDS, lambda: query_db(hass, now), refresh=refresh
    )
    if found.busy:
        held = kept_reply(store, "db_health", now, CACHE_SECONDS, stale=True)
        if held is not None:
            return held  # type: ignore[return-value]
        return {"available": True, "busy": True, "findings": []}
    names = {
        item["object_id"]: item.get("name") or item["object_id"]
        for item in snapshot["objects"]
        if item["object_type"] == "entity"
    }
    raw = found.raw
    if raw.get("db_bytes") is not None:
        events.record_size(
            datetime.now(UTC).date().isoformat(),
            int(raw["db_bytes"]) + int(raw.get("wal_bytes") or 0),
        )
    result = evaluate(raw, names, events.sizes, events.events, datetime.now(UTC).date())
    reply = {
        "available": True,
        "busy": False,
        "cached": found.cached,
        "stale": False,
        "age_seconds": 0,
        "computed_at": now,
        "thresholds": THRESHOLDS,
        **recorder_retention(hass),
        **result,
    }
    if store is not None:
        store.keep("db_health", reply)
    return reply  # type: ignore[return-value]
