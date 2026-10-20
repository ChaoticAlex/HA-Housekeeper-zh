"""中文（zh-Hans）翻译必须与英文键完全一致，占位符不得增删。"""

from __future__ import annotations

import json
import re
from pathlib import Path

COMPONENT = Path(__file__).parent.parent / "custom_components" / "ha_housekeeper"


def _json(name: str) -> dict:
    return json.loads((COMPONENT / "translations" / name).read_text(encoding="utf-8"))


def _leaf_paths(node, prefix: str = "") -> set[str]:
    if isinstance(node, dict):
        out: set[str] = set()
        for key, value in node.items():
            out |= _leaf_paths(value, f"{prefix}.{key}" if prefix else key)
        return out
    return {prefix}


def _leaves(node, prefix: str = "") -> dict[str, str]:
    if isinstance(node, dict):
        out: dict[str, str] = {}
        for key, value in node.items():
            out |= _leaves(value, f"{prefix}.{key}" if prefix else key)
        return out
    return {prefix: node}


def test_chinese_and_english_translation_keys_match() -> None:
    assert _leaf_paths(_json("zh-Hans.json")) == _leaf_paths(_json("en.json"))


def test_chinese_placeholders_match_english() -> None:
    zh, en = _leaves(_json("zh-Hans.json")), _leaves(_json("en.json"))
    for key, english in en.items():
        assert set(re.findall(r"\{(\w+)\}", zh[key])) == set(
            re.findall(r"\{(\w+)\}", english)
        ), key
