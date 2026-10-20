# 这个 fork 是什么

`bertel2020/HA-Housekeeper` 的简体中文分支。只加语言资源，不改逻辑：

- `panel-src/88..89aa-i18n-zh-*.js`：面板词条（3132 条，全量）
- `custom_components/ha_housekeeper/translations/zh-Hans.json`：集成侧文案（151 条）
- `monitor.py` / `notify.py` / `audit_report.py` / `cleanup_exec.py` 里的 `"zh"` 表（58 条）
- `tests/test_zh_hans_*.py`：中文键与占位符一致性校验
- `scripts/check_terms.py`：占位符、术语、缺失词条的软校验

上游的 `de`/`en` 文案与代码逻辑保持原样。

## 跟随上游更新

上游比较与合并就是标准 git 操作，没有额外脚本：

```bash
git fetch upstream
git log --oneline HEAD..upstream/main          # 上游多了什么
git rebase upstream/main                       # 合并
node scripts/build_panel.mjs                   # 重建面板单文件
node --test tests/panel.test.mjs               # 上游测试必须全绿
python3 scripts/check_terms.py --limit 20      # 列出新增的未译词条
```

`upstream` 若未配置：`git remote add upstream https://github.com/bertel2020/HA-Housekeeper.git`。

rebase 冲突几乎只出现在三处单行改动：`90-panel.js` 的 `get lang()`、`11-theme.js` 的偏好白名单、`17-settings.js` 的语言选项。中文词条文件是独立新增的，正常不会冲突。

## 补译新词条

新版本新增的英文键会出现在 `check_terms.py` 的"未翻译"列表里。把它们加进任意 `89xx-i18n-zh-*.js`：

```js
TEXT.zh = TEXT.zh || {};
Object.assign(TEXT.zh, {
  "新键": "中文",
});
```

未译键会自动回落英文，界面不会空白或报错，所以补译可以分批进行。

## 刻意保留的英文

专有名词（HACS、Nabu Casa、Assist、Zigbee、AppArmor）、标识符（`state_changed`、`housekeeper_ignore`、`trusted_networks`）、以及引号内的示例名（`"New automation"`）。这些翻译后反而会对不上日志与文档。

## 发布

`manifest.json` 的版本必须等于 `CHANGELOG.md` 顶部小节标题（仓库自带测试会校验），HACS 认的是 tag 对应的 release。
