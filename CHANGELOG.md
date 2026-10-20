## 1.10.5 - 2026-10-20

### 简体中文（zh-Hans）

- 后端自写文案中文化（各表新增 `"zh"`，`texts.py` 的 `pick()` 自动按 `hass.config.language` 取用）：
  - `monitor.py`：家居功能 18 个原因短语 + 4 条状态句
  - `notify.py`：失效引用通知的标题与正文
  - `audit_report.py`：审计报告 34 个小标题与句子
  - `cleanup_exec.py`：设备被移除/忽略的日志条目
- 未改动任何逻辑；`de`/`en` 文案原样保留。

