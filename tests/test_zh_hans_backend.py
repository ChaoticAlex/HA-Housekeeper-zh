"""后端文案表必须带上 zh，且结构与 en 一致（静态检查，不依赖 Home Assistant）。"""

from __future__ import annotations

import ast
from pathlib import Path

COMPONENT = Path(__file__).parent.parent / "custom_components" / "ha_housekeeper"

# module -> {table: kind}; kind: "dict" = {"de": {...}, "en": {...}} 或比较两个平行表
TABLES = {
    "monitor.py": {"MONITOR_TEXTS": "dict"},
    "notify.py": {"TEXTS": "tuple"},
    "audit_report.py": {"TEXTS": "dict"},
    "cleanup_exec.py": {"LOGBOOK_DEVICE": "tuple"},
}
PARALLEL = [("monitor.py", "REASONS_EN", "REASONS_ZH")]


def _tables(module: str) -> dict[str, object]:
    tree = ast.parse((COMPONENT / module).read_text(encoding="utf-8"))
    found: dict[str, object] = {}
    for node in tree.body:
        names = []
        if isinstance(node, ast.Assign):
            names = [t.id for t in node.targets if isinstance(t, ast.Name)]
        elif isinstance(node, ast.AnnAssign) and isinstance(node.target, ast.Name):
            names = [node.target.id]
        for name in names:
            try:
                found[name] = ast.literal_eval(node.value)
            except ValueError:
                pass
    return found


def test_every_backend_table_carries_chinese() -> None:
    for module, tables in TABLES.items():
        found = _tables(module)
        for name, kind in tables.items():
            assert name in found, f"{module}: {name} not found"
            table = found[name]
            assert "zh" in table, f"{module}: {name} has no zh"
            if kind == "dict":
                assert set(table["en"]) == set(table["zh"]), f"{module}: {name} keys differ"
            else:
                assert len(table["en"]) == len(table["zh"]), f"{module}: {name} shape differs"


def test_parallel_reason_tables_match() -> None:
    for module, en_name, zh_name in PARALLEL:
        found = _tables(module)
        assert set(found[en_name]) == set(found[zh_name]), f"{module}: {en_name} vs {zh_name}"


def test_notification_and_logbook_are_translated() -> None:
    assert "失效引用" in _tables("notify.py")["TEXTS"]["zh"][0]
    assert _tables("cleanup_exec.py")["LOGBOOK_DEVICE"]["zh"][1] == ("已忽略", "已移除")
