"""Success criteria, the seven quality dimensions, coverage, trace comparison and the dry run."""

from __future__ import annotations

from datetime import UTC, date, datetime, timedelta

import pytest

pytest.importorskip("homeassistant")

from homeassistant.core import HomeAssistant  # noqa: E402
from homeassistant.util import dt as dt_util  # noqa: E402
from pytest_homeassistant_custom_component.common import async_fire_time_changed  # noqa: E402

from custom_components.ha_housekeeper.criteria import (  # noqa: E402
    CriteriaStore,
    async_listen,
    validate,
)
from custom_components.ha_housekeeper.quality import build  # noqa: E402

TODAY = date(2026, 10, 9)
AUTO = "automation.hall"


def _criterion(**extra):
    return {"targets": [{"entity_id": "light.hall", "state": "on"}], "within": 5, **extra}


def test_criteria_are_validated_and_limited() -> None:
    clean = validate([_criterion(hold=2)])
    assert clean[0]["id"] and clean[0]["hold"] == 2
    for bad in (
        [{"targets": [], "within": 5}],
        [_criterion(within=0)],
        [_criterion(within=301)],
        [_criterion(hold=-1)],
        [{"targets": [{"entity_id": "nope", "state": "on"}], "within": 5}],
        "x",
    ):
        with pytest.raises(ValueError):
            validate(bad)


async def test_a_fired_automation_is_checked_after_the_time_limit(hass: HomeAssistant) -> None:
    store = CriteriaStore(hass)
    unsub = async_listen(hass, store)
    store.set(AUTO, [_criterion(), _criterion(hold=10)])
    hass.states.async_set("light.hall", "off")
    hass.bus.async_fire("automation_triggered", {"entity_id": AUTO})
    await hass.async_block_till_done()
    hass.states.async_set("light.hall", "on")  # reached after the automation fired
    async_fire_time_changed(hass, dt_util.utcnow() + timedelta(seconds=6))
    await hass.async_block_till_done()
    assert store.stats(AUTO, dt_util.utcnow().date()) == {"ok": 1, "missed": 0}, "hold still waits"
    hass.states.async_set("light.hall", "off")  # does not hold
    async_fire_time_changed(hass, dt_util.utcnow() + timedelta(seconds=20))
    await hass.async_block_till_done()
    assert store.stats(AUTO, dt_util.utcnow().date()) == {"ok": 1, "missed": 1}
    assert [r["ok"] for r in store.recent[AUTO]] == [True, False]
    store.cancel_all()
    unsub()


def _snapshot():
    objects = [
        {
            "object_type": "automation",
            "object_id": AUTO,
            "name": "Hall",
            "status": "active",
            "description": "",
            "action_count": 2,
            "trigger_count": 1,
            "source": "yaml",
        },
        {
            "object_type": "automation",
            "object_id": "automation.quiet",
            "name": "Quiet",
            "status": "active",
            "description": "ok",
            "source": "yaml",
        },
        {"object_type": "entity", "object_id": "light.hall", "status": "unavailable"},
    ]
    edges = [{"source": f"automation:{AUTO}", "target": "entity:light.hall", "relation": "TARGETS"}]
    return {"objects": objects, "edges": edges, "findings": []}


def test_dimensions_stay_separate_and_unknown_is_not_ok(hass: HomeAssistant) -> None:
    store = CriteriaStore(hass)
    store.set(AUTO, [_criterion()])
    store.days[AUTO] = {TODAY.isoformat(): [1, 4]}
    runs = {
        "items": [
            {
                "entity_id": AUTO,
                "runs": 20,
                "findings": [
                    {"kind": "failing", "level": "red"},
                    {"kind": "long_wait", "level": "info"},
                ],
            }
        ]
    }
    conflicts = [{"stage": "observed", "automations": [{"entity_id": AUTO, "name": "Hall"}]}]
    result = build(_snapshot(), runs, conflicts, store, TODAY, lambda entity_id: [])
    hall, quiet = {r["entity_id"]: r["dimensions"] for r in result["items"]}.values()
    assert hall["integrity"]["level"] == "warn" and hall["reliability"]["level"] == "red"
    assert hall["effectiveness"]["level"] == "red" and hall["conflicts"]["level"] == "warn"
    assert hall["maintainability"]["level"] == "info" and hall["restart_safety"]["level"] == "warn"
    assert (
        quiet["reliability"]["level"] == "unknown" and quiet["effectiveness"]["level"] == "unknown"
    )
    assert result["items"][0]["entity_id"] == AUTO, "the worst automation comes first"
    assert store.alerts(TODAY) == [{"entity_id": AUTO, "ok": 1, "missed": 4}]


ACTIONS = [
    {
        "choose": [
            {"conditions": [], "sequence": [{"if": [], "then": [], "else": []}]},
            {"conditions": [], "sequence": []},
        ],
        "default": [],
    }
]
TRIGGERS = [
    {"platform": "state", "entity_id": "binary_sensor.door"},
    {"platform": "time", "at": "07:00"},
]


def test_markers_keep_only_the_structure_and_expected_lists_every_branch() -> None:
    from custom_components.ha_housekeeper.coverage import expected, markers

    paths = [
        "trigger/1",
        "condition/0",
        "action/0",
        "action/0/choose/0/conditions/0",
        "action/0/choose/0/sequence/0",
        "action/0/choose/0/sequence/0/then/0",
    ]
    assert markers(paths) == {
        "trigger/1",
        "action/0/choose/0/sequence",
        "action/0/choose/0/sequence/0/then",
    }
    ids = [e["id"] for e in expected(TRIGGERS, ACTIONS)]
    assert ids == [
        "trigger/0",
        "trigger/1",
        "action/0/choose/0/sequence",
        "action/0/choose/0/sequence/0/then",
        "action/0/choose/0/sequence/0/else",
        "action/0/choose/1/sequence",
        "action/0/default",
    ]


async def test_coverage_counts_paths_only_when_switched_on_and_reports_what_never_ran(
    hass: HomeAssistant, monkeypatch: pytest.MonkeyPatch
) -> None:
    from custom_components.ha_housekeeper.coverage import CoverageStore

    start = dt_util.utcnow() - timedelta(days=10)
    heads = [
        {
            "item_id": f"x{n}",
            "run_id": f"r{n}",
            "state": "stopped",
            "timestamp": {"start": start, "finish": start + timedelta(seconds=2)},
        }
        for n in range(10)
    ]
    heads = [{**h, "item_id": "x"} for h in heads]

    async def listed(hass_, domain, item):
        return heads

    async def traced(hass_, key, run_id):
        return {
            "trace": {
                "trigger/0": [{"changed_variables": {"secret": "x"}}],
                "action/0/default/0": [],
            }
        }

    monkeypatch.setattr("homeassistant.components.trace.util.async_list_traces", listed)
    monkeypatch.setattr("homeassistant.components.trace.util.async_get_trace", traced)
    store = CoverageStore(hass)
    assert await store.async_collect() == 0, "off by default"
    store.set_enabled(True)
    assert await store.async_collect() == 10 and await store.async_collect() == 0, "each run once"
    item = store.items["automation.x"]
    item["since"] = start.isoformat()
    assert "secret" not in str(store._data()), "no variables are kept"
    view = store.view("automation.x", TRIGGERS, ACTIONS)
    counts = {r["id"]: r["count"] for r in view["rows"]}
    assert counts["trigger/0"] == 10 and counts["action/0/default"] == 10 and view["ready"]
    assert "trigger/1" in view["never"] and "action/0/choose/1/sequence" in view["never"]
    assert next(r for r in view["rows"] if r["id"] == "action/0/default")["mean_ms"] == 2000


def test_two_runs_differ_by_trigger_branch_end_and_duration() -> None:
    from custom_components.ha_housekeeper.trace_compare import differences, summarize

    def run(trigger, branch, execution, last, seconds):
        start = dt_util.utcnow()
        return summarize(
            {
                "trace": {trigger: [], branch: []},
                "script_execution": execution,
                "last_step": last,
                "timestamp": {"start": start, "finish": start + timedelta(seconds=seconds)},
            }
        )

    older = run("trigger/0", "action/0/default/0", "finished", "action/0", 1)
    newer = run(
        "trigger/1", "action/0/choose/0/sequence/0", "error", "action/0/choose/0/sequence/0", 5
    )
    kinds = [d["kind"] for d in differences(older, newer)]
    assert kinds == ["trigger", "branch", "execution", "last_step", "duration"]
    assert differences(older, older) == []


def _ctx(states, overrides=None, hour=10, weekday_offset=0):
    from custom_components.ha_housekeeper.dry_run import Context

    now = datetime(2026, 10, 12, hour, 0, tzinfo=UTC) + timedelta(days=weekday_offset)  # a Monday
    return Context(
        state=lambda e: (overrides or {}).get(e, states.get(e)),
        attrs=lambda e: {"device_class": "garage"} if e == "cover.garage" else {},
        exists=lambda e: e not in ("light.gone",),
        disabled=lambda e: e == "light.off",
        now=now,
        overrides=overrides or {},
    )


def test_the_dry_run_judges_known_values_and_calls_the_rest_unknown() -> None:
    from custom_components.ha_housekeeper.dry_run import dry_run

    triggers = [
        {"trigger": "state", "entity_id": "binary_sensor.door", "to": "on"},
        {"trigger": "time", "at": "07:00"},
    ]
    conditions = [
        {"condition": "state", "entity_id": "input_boolean.home", "state": "on"},
        {"condition": "time", "after": "08:00", "before": "20:00", "weekday": ["mon"]},
    ]
    actions = [
        {
            "choose": [
                {
                    "conditions": [
                        {"condition": "numeric_state", "entity_id": "sensor.lux", "below": 20}
                    ],
                    "sequence": [
                        {"action": "light.turn_on", "target": {"entity_id": "light.hall"}}
                    ],
                },
                {
                    "conditions": [{"condition": "template", "value_template": "{{ true }}"}],
                    "sequence": [{"action": "lock.unlock", "target": {"entity_id": "lock.front"}}],
                },
            ],
            "default": [
                {"action": "light.turn_off", "target": {"entity_id": ["light.gone", "light.off"]}}
            ],
        }
    ]
    states = {"input_boolean.home": "on", "sensor.lux": "50"}
    result = dry_run(triggers, conditions, actions, _ctx(states, {"binary_sensor.door": "on"}))
    assert result["executes"] is False
    assert [t["result"] for t in result["triggers"]] == [True, None]
    assert result["conditions"] is True and result["uncertain"], "the template cannot be judged"
    by_service = {c["service"]: c for c in result["calls"]}
    assert by_service["lock.unlock"]["critical"] and not by_service["lock.unlock"]["certain"]
    assert by_service["light.turn_off"]["missing"] == ["light.gone"] and by_service[
        "light.turn_off"
    ]["disabled"] == ["light.off"]
    assert "light.turn_on" not in by_service, "the first option is false with 50 lux"
    dark = dry_run(triggers, conditions, actions, _ctx({**states, "sensor.lux": "5"}))
    assert dark["branches"] == ["action/0/choose/0/sequence"] and [
        c["service"] for c in dark["calls"]
    ] == ["light.turn_on"]
    assert dark["calls"][0]["certain"] and not dark["uncertain"]
    away = dry_run(triggers, conditions, actions, _ctx({**states, "input_boolean.home": "off"}))
    assert away["conditions"] is False and away["calls"] == []
    night = dry_run(triggers, conditions, actions, _ctx(states, hour=23))
    assert night["conditions"] is False


def test_dry_run_calls_after_an_unknown_condition_or_a_stop_are_not_certain() -> None:
    from custom_components.ha_housekeeper.dry_run import Context, dry_run

    ctx = Context(
        state=lambda e: "on",
        attrs=lambda e: {},
        exists=lambda e: True,
        disabled=lambda e: False,
        now=datetime(2026, 1, 1, 12, tzinfo=UTC),
        overrides={},
    )
    call = {"action": "light.turn_on", "target": {"entity_id": "light.a"}}
    unknown = {"condition": "template", "value_template": "{{ x }}"}
    attribute = {
        "condition": "numeric_state",
        "entity_id": "climate.a",
        "attribute": "t",
        "above": 1,
    }
    result = dry_run([], [], [call, unknown, call, attribute, call], ctx)
    assert [c["certain"] for c in result["calls"]] == [True, False, False]
    result = dry_run([], [], [call, {"stop": "x"}, call], ctx)
    assert len(result["calls"]) == 1


def test_call_criteria_are_validated_and_old_ones_stay_state_criteria() -> None:
    clean = validate([{"type": "call", "service": "notify.phone", "within": 5}, _criterion()])
    assert clean[0]["type"] == "call" and clean[0]["service"] == "notify.phone"
    assert clean[0]["hold"] == 0 and clean[1]["type"] == "state"
    for bad in (
        {"type": "call", "within": 5},
        {"type": "call", "service": "phone", "within": 5},
        {"type": "other", "within": 5},
    ):
        with pytest.raises(ValueError):
            validate([bad])


async def test_a_call_criterion_counts_only_calls_of_its_own_run(hass: HomeAssistant) -> None:
    from homeassistant.core import Context

    store = CriteriaStore(hass)
    unsub = async_listen(hass, store)
    store.set(
        AUTO,
        [
            {"type": "call", "service": "notify.phone", "within": 5},
            {"type": "call", "service": "script.night", "within": 5},
        ],
    )
    run = Context()
    hass.bus.async_fire("automation_triggered", {"entity_id": AUTO}, context=run)
    await hass.async_block_till_done()
    assert store.watching
    foreign = {"domain": "notify", "service": "phone"}
    hass.bus.async_fire("call_service", foreign, context=Context())  # another source
    hass.bus.async_fire(
        "script_started", {"entity_id": "script.night"}, context=Context(parent_id=run.id)
    )
    await hass.async_block_till_done()
    async_fire_time_changed(hass, dt_util.utcnow() + timedelta(seconds=6))
    await hass.async_block_till_done()
    assert store.stats(AUTO, dt_util.utcnow().date()) == {"ok": 1, "missed": 1}
    assert not store.watching, "nothing stays open"
    hass.bus.async_fire("automation_triggered", {"entity_id": AUTO}, context=run)
    await hass.async_block_till_done()
    hass.bus.async_fire("call_service", foreign, context=Context(id=run.id))
    await hass.async_block_till_done()
    async_fire_time_changed(hass, dt_util.utcnow() + timedelta(seconds=12))
    await hass.async_block_till_done()
    assert store.stats(AUTO, dt_util.utcnow().date()) == {"ok": 2, "missed": 2}
    store.cancel_all()
    unsub()


def test_scripts_get_four_dimensions_and_count_their_callers(hass: HomeAssistant) -> None:
    snapshot = _snapshot()
    for name in ("used", "lonely"):
        snapshot["objects"].append(
            {
                "object_type": "script",
                "object_id": f"script.{name}",
                "name": name,
                "status": "active",
            }
        )
    snapshot["objects"].append(
        {"object_type": "script", "object_id": "script.boss", "name": "boss", "status": "active"}
    )
    snapshot["edges"].append(
        {"source": f"automation:{AUTO}", "target": "entity:script.used", "relation": "TARGETS"}
    )
    calls = {
        "script.boss": [{"sequence": [{"action": "script.used"}, {"service": "script.turn_on"}]}]
    }
    result = build(
        snapshot, {"items": []}, [], CriteriaStore(hass), TODAY, lambda entity_id: [], calls.get
    )
    scripts = {r["entity_id"]: r for r in result["scripts"]}
    assert list(scripts["script.used"]["dimensions"]) == result["script_dimensions"]
    assert scripts["script.used"]["callers"] == {"automation": 1, "script": 1}
    assert scripts["script.lonely"]["callers"] == {"automation": 0, "script": 0}
    assert len(result["items"]) == 2 and result["scripts_total"] == 3
