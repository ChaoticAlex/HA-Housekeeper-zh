#!/usr/bin/env python3
"""中文面板词条的软校验：占位符、缺失词条、术语一致性。

用法:
    python3 scripts/check_terms.py            # 报告，永远返回 0
    python3 scripts/check_terms.py --strict   # 占位符/禁用译法违规时返回 1
    python3 scripts/check_terms.py --limit 20 # 每个列表最多显示多少条
"""
from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PANEL = ROOT / "panel-src"

# 术语表：英文词 -> 必须出现的中文词。仅在英文原文出现该词时检查。
TERMS = [
    ("entity", "实体"), ("entities", "实体"), ("device", "设备"), ("area", "区域"),
    ("automation", "自动化"), ("script", "脚本"), ("scene", "场景"), ("dashboard", "仪表盘"),
    ("integration", "集成"), ("recorder", "记录器"), ("quarantine", "隔离"),
    ("backup", "备份"), ("statistics", "统计"), ("battery", "电量"),
]
# 禁用译法：出现即视为术语漂移。
FORBIDDEN = {
    "实体": ["实体对象", "条目对象"],
    "隔离": ["检疫"],
    "记录器": ["录音机", "录音器"],
}
# 语境豁免：这些键里的英文词不是 Home Assistant 的术语含义，不该按术语表强制。
# updColGroup/updAllGroups 的 "area" 指更新分组（系统/应用/HACS/设备），不是 HA 的"区域"。
EXEMPT_TERMS = {
    "updColGroup": {"area"},
    "updAllGroups": {"area"},
    # 系统页的 "Area" 指文件/目录所在位置，不是 HA 的区域
    "sysColPlace": {"area"},
}
NODE_DUMP = """
const fs=require('fs'),d=process.argv[1];let s='';
for(const f of fs.readdirSync(d).filter(f=>f.includes('i18n')).sort()) s+=fs.readFileSync(d+'/'+f,'utf8')+'\\n';
s+='TEXT;';const T=eval(s);
console.log(JSON.stringify({de:T.de,en:T.en,zh:T.zh||{}}));
"""


def load() -> dict:
    out = subprocess.run(["node", "-e", NODE_DUMP, str(PANEL)],
                         capture_output=True, text=True, check=True)
    return json.loads(out.stdout)


def placeholders(text: str) -> set[str]:
    return set(re.findall(r"\{(\w+)\}", text))


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--strict", action="store_true")
    ap.add_argument("--limit", type=int, default=15)
    args = ap.parse_args()

    data = load()
    en, zh = data["en"], data["zh"]
    missing = [k for k in en if k not in zh]
    unknown = [k for k in zh if k not in en]
    bad_ph = [(k, sorted(placeholders(en[k]) ^ placeholders(zh[k])))
              for k in zh if k in en and placeholders(en[k]) != placeholders(zh[k])]
    term_miss = []
    # 引号内的示例（如 “New automation”）保持原样，不参与术语匹配
    quoted = re.compile(r"[“\"\'`][^”\"\'`]*[”\"\'`]")
    for k, value in zh.items():
        english = re.sub(r"\{\w+\}", " ", quoted.sub(" ", en.get(k, ""))).lower()
        skip = EXEMPT_TERMS.get(k, set())
        for word, wanted in TERMS:
            if word in skip:
                continue
            if re.search(rf"\b{word}\b", english) and wanted not in value:
                term_miss.append((k, word, wanted))
                break
    forbidden = [(k, bad) for k, value in zh.items()
                 for _good, bads in FORBIDDEN.items() for bad in bads if bad in value]

    total = len(en)
    print(f"英文词条 {total} · 中文 {len(zh)} · 覆盖率 {len(zh) / total * 100:.1f}%")
    print(f"缺失 {len(missing)} · 多余 {len(unknown)} · 占位符不一致 {len(bad_ph)}"
          f" · 术语未命中 {len(term_miss)} · 禁用译法 {len(forbidden)}")
    for title, rows in (
        ("占位符不一致", [f"{k}: {v}" for k, v in bad_ph]),
        ("禁用译法", [f"{k}: {v}" for k, v in forbidden]),
        ("术语未命中", [f"{k}: 含 '{w}' 但缺少 '{z}'" for k, w, z in term_miss]),
    ):
        if rows:
            print(f"\n[{title}] 前 {min(len(rows), args.limit)} 条")
            for row in rows[: args.limit]:
                print("  " + row)
    if missing:
        print(f"\n[未翻译] 前 {min(len(missing), args.limit)} 条")
        for key in missing[: args.limit]:
            print(f"  {key} = {en[key][:90]}")

    hard = bool(bad_ph or forbidden)
    return 1 if (args.strict and hard) else 0


if __name__ == "__main__":
    sys.exit(main())
