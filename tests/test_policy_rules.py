"""The second set of quality rules: each at its edge, kept short."""

from __future__ import annotations

import pytest

pytest.importorskip("homeassistant")
pytest.importorskip("pytest_homeassistant_custom_component")

from custom_components.ha_housekeeper.policies import evaluate  # noqa: E402


def obj(kind: str, object_id: str, **fields) -> dict:
    return {
        "object_type": kind,
        "object_id": object_id,
        "name": object_id,
        "status": "active",
        **fields,
    }


def run(objects: list[dict], rule: str, edges=None, **extra) -> dict:
    snap = {"objects": objects, "edges": edges or []}
    result = evaluate(snap, {rule}, set(), set(), extra=extra, rates=extra.pop("rates", None))
    return next(r for r in result["rules"] if r["id"] == rule)


def ids(rule: dict) -> list[str]:
    return [i["object_id"] for i in rule["items"]]


def test_entity_id_suffix_only_when_the_name_does_not_carry_the_number() -> None:
    rule = run(
        [
            obj("entity", "sensor.temp_2", name="Temperatur"),
            obj("entity", "sensor.room_2", name="Room 2"),
            obj("entity", "sensor.temp_1", name="Temp"),
        ],
        "entity_id_suffix",
    )
    assert ids(rule) == ["sensor.temp_2"]


def test_an_address_in_the_id_is_its_own_rule_and_no_counter() -> None:
    objects = [
        obj("entity", "device_tracker.pc_192_168_79_138", name="Drucker"),
        obj("entity", "sensor.phone_aa_bb_cc_dd_ee_ff", name="Handy"),
        obj("entity", "sensor.tracker_a1b2c3d4e5f6", name="Tracker"),
        obj("entity", "sensor.room_172_20_1_5", name="Raum"),
        obj("entity", "light.eltako_gw1_ff_c2_4a_89", name="Licht"),
        obj("entity", "switch.schedule_878149", name="Zeitplan"),
        obj("entity", "sensor.energy_2_3_4_5_6", name="Energie"),
        obj("entity", "sensor.x_172_40_1_5", name="X"),
        obj("entity", "sensor.sensor_2024_01_15_08", name="Datum"),
        obj("entity", "sensor.temp_123456789012", name="Ziffern"),
    ]
    assert sorted(ids(run(objects, "entity_id_address"))) == [
        "device_tracker.pc_192_168_79_138",
        "light.eltako_gw1_ff_c2_4a_89",
        "sensor.phone_aa_bb_cc_dd_ee_ff",
        "sensor.room_172_20_1_5",
        "sensor.tracker_a1b2c3d4e5f6",
    ]
    suffix = ids(run(objects, "entity_id_suffix"))
    assert not {"device_tracker.pc_192_168_79_138", "light.eltako_gw1_ff_c2_4a_89"} & set(suffix)
    assert "switch.schedule_878149" not in suffix


def test_default_names_and_script_texts() -> None:
    objects = [
        obj("automation", "automation.a", name="Neue Automation", source="config"),
        obj("automation", "automation.b", name="Licht", source="config"),
        obj("script", "script.s", name="New script 3", description=""),
    ]
    assert ids(run(objects, "default_name")) == ["automation.a", "script.s"]
    assert ids(run(objects, "script_description")) == ["script.s"]


def test_device_model_area_and_label_rules() -> None:
    dev = obj("device", "d1", device_kind="device", entry_type=None, manufacturer="X", model=None)
    assert ids(run([dev], "device_model")) == ["d1"]
    area = obj("area", "kitchen")
    assert ids(run([area], "area_empty")) == ["kitchen"]
    assert ids(run([area, obj("entity", "light.a", area_id="kitchen")], "area_empty")) == []
    labels = [obj("label", "l1"), obj("label", "housekeeper_ignore")]
    assert ids(run(labels, "label_unused", used_labels=set())) == ["l1"]


def test_automation_habits() -> None:
    many = obj("automation", "automation.m", source="config", trigger_count=11)
    assert ids(run([many], "automation_triggers")) == ["automation.m"]
    plain = obj(
        "automation",
        "automation.p",
        source="config",
        conditions=[],
        actions=[{"action": "a.b"}, {"action": "c.d"}],
    )
    safe = obj(
        "automation",
        "automation.s",
        source="config",
        conditions=[],
        actions=[{"action": "a.b", "continue_on_error": True}, {"action": "c.d"}],
    )
    assert ids(run([plain, safe], "automation_error_handling")) == ["automation.p"]
    tpl = obj(
        "automation",
        "automation.t",
        source="config",
        actions=[{"data": {"m": "{{ states('sensor.x') }}"}}],
    )
    assert ids(run([tpl], "automation_literal_ids")) == ["automation.t"]
    loop = obj(
        "automation",
        "automation.l",
        source="config",
        triggers=[{"platform": "state", "entity_id": "light.a"}],
        actions=[{"action": "light.turn_on", "target": {"entity_id": "light.a"}}],
    )
    assert ids(run([loop], "automation_self_trigger")) == ["automation.l"]


def test_turn_on_only_needs_an_entity_nothing_turns_off() -> None:
    light = obj("entity", "light.a")
    on = obj(
        "automation",
        "automation.on",
        source="config",
        actions=[{"action": "light.turn_on", "target": {"entity_id": "light.a"}}],
    )
    off = obj(
        "script",
        "script.off",
        actions=[{"action": "light.turn_off", "target": {"entity_id": "light.a"}}],
    )
    assert ids(run([light, on], "turn_on_only")) == ["light.a"]
    assert ids(run([light, on, off], "turn_on_only")) == []


def test_exposure_and_battery_rules() -> None:
    lock = obj("entity", "lock.door")
    lamp = obj("entity", "light.a")
    exposed = {"lock.door": ["conversation"], "light.a": ["conversation"]}
    edges = [{"source": "automation:automation.x", "target": "entity:light.a"}]
    assert ids(run([lock, lamp], "exposure_sensitive", exposed=exposed)) == ["lock.door"]
    assert ids(run([lock, lamp], "exposure_unused", edges=edges, exposed=exposed)) == ["lock.door"]
    battery = obj("entity", "sensor.b", device_class="battery", state="5")
    assert ids(run([battery], "battery_no_automation", battery_percent=20)) == ["sensor.b"]
    assert ids(run([battery], "battery_no_automation", edges=[{"target": "entity:sensor.b"}])) == []


def test_recorder_rules_wait_for_numbers_and_judge_them() -> None:
    noisy = obj("entity", "sensor.n")
    assert run([noisy], "recorder_unused")["pending"] is True
    assert ids(run([noisy], "recorder_unused", rates={"sensor.n": 500})) == ["sensor.n"]
    assert ids(run([noisy], "recorder_unused", rates={"sensor.n": 50})) == []
    assert run([], "recorder_retention")["pending"] is True
    big = {"keep_days": 60, "db_bytes": 3 * 1024**3}
    assert ids(run([], "recorder_retention", db=big)) == ["recorder"]
    assert ids(run([], "recorder_retention", db={"keep_days": 10, "db_bytes": 3 * 1024**3})) == []


def test_statistics_and_dashboard_rules() -> None:
    from custom_components.ha_housekeeper.dashboard_analysis import dashboard_health
    from custom_components.ha_housekeeper.hygiene import statistic_continuity

    entities = [
        obj("entity", "sensor.e", status="active", unit="kWh", state_class="measurement"),
        obj("entity", "sensor.t", status="active", unit="°C", state_class="measurement"),
    ]
    stats = [
        {
            "statistic_id": "sensor.e",
            "statistics_unit_of_measurement": "m³",
            "unit_class": None,
            "has_sum": True,
        },
        {
            "statistic_id": "sensor.t",
            "statistics_unit_of_measurement": "°F",
            "unit_class": "temperature",
            "has_sum": False,
        },
    ]
    issues = statistic_continuity(stats, entities)
    assert [(i["object_id"], i["kind"]) for i in issues] == [
        ("sensor.e", "unit"),
        ("sensor.e", "class"),
    ]  # °F → °C converts

    config = {
        "views": [
            {
                "path": "home",
                "cards": [
                    {"type": "custom:fancy-card", "navigation_path": "/lovelace/missing"},
                    {"type": "custom:fancy-card", "navigation_path": "/lovelace/home"},
                    {"type": "custom:fancy-card", "navigation_path": "/lovelace/missing"},
                ],
            }
        ]
    }
    health = dashboard_health(config, {"lovelace": {"0", "home"}}, 0)
    assert health["cards"] == 3 and health["doubles"] == 1 and health["custom"] == ["fancy-card"]
    assert health["broken_navigation"] == ["/lovelace/missing"]
    dash = obj("dashboard", "lovelace", health=health, references=[{"object_id": "light.off"}])
    off = obj("entity", "light.off", status="disabled")
    for rule in (
        "dashboard_navigation",
        "dashboard_duplicate_cards",
        "dashboard_custom_cards",
        "dashboard_disabled_entities",
    ):
        assert ids(run([dash, off], rule)) == ["lovelace"], rule
    assert ids(run([dash], "dashboard_size")) == []
    snap = {"objects": entities, "edges": [], "statistic_issues": issues}
    unit = next(
        r
        for r in evaluate(snap, {"statistics_unit"}, set(), set())["rules"]
        if r["id"] == "statistics_unit"
    )
    assert ids(unit) == ["sensor.e"] and unit["items"][0]["also"] == ["m³ → kWh"]


def test_http_rules_report_only_public_networks_plain_http_and_the_login_bypass() -> None:
    private = {
        "trusted_networks": ["192.168.1.0/24", "10.0.0.0/8", "100.64.0.0/10", "fd00::/8"],
        "trusted_proxies": ["172.30.33.0/24"],
        "external_url": "http://homeassistant.local:8123",
    }
    for rule in ("http_trusted_networks", "http_external_url", "http_proxies"):
        assert ids(run([], rule, http=private)) == [], rule
        assert ids(run([], rule)) == [], rule  # nothing readable, nothing reported

    open_ = {
        "trusted_networks": ["192.168.1.0/24", "0.0.0.0/0", "8.8.8.0/24"],
        "bypass_login": True,
        "trusted_proxies": ["::/0", "172.30.33.0/24"],
        "external_url": "http://home.example.org",
    }
    nets = run([], "http_trusted_networks", http=open_)["items"][0]
    assert nets["also"] == ["0.0.0.0/0", "8.8.8.0/24", "allow_bypass_login"]
    assert run([], "http_proxies", http=open_)["items"][0]["also"] == ["::/0"]
    assert run([], "http_external_url", http=open_)["items"][0]["also"] == ["home.example.org"]
    assert (
        ids(run([], "http_external_url", http={"external_url": "https://home.example.org"})) == []
    )
