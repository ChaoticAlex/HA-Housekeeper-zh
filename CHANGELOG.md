## 1.10.7 - 2026-10-20

### 简体中文（zh-Hans）

- 新增 `scripts/check_terms.py`：中文词条软校验（占位符一致性、缺失词条、术语表命中、禁用译法），默认只报告不失败，`--strict` 才拦截。
- 新增 `scripts/sync_upstream.sh`：一条命令追更（fetch → 展示上游新增 → rebase → 重建面板 → 跑测试 → 词条校验），`--dry-run` 只看不动。
- 按校验脚本结果统一术语：`dashboard` 统一为「仪表盘」（HA 官方中文用词），修正 `quarantineHint` 漏译「隔离」、`reason_has_statistics` 漏译「实体」。

