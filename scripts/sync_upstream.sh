#!/usr/bin/env bash
# 把上游新版本合进中文 fork，并跑完构建/测试/词条校验。
#   scripts/sync_upstream.sh            交互确认
#   scripts/sync_upstream.sh -y         不询问
#   scripts/sync_upstream.sh --dry-run  只看上游有什么新东西
set -euo pipefail
cd "$(dirname "$0")/.."

UPSTREAM_URL="https://github.com/bertel2020/HA-Housekeeper.git"
BRANCH="main"
ASSUME_YES=0
DRY_RUN=0
for arg in "$@"; do
  case "$arg" in
    -y|--yes) ASSUME_YES=1 ;;
    --dry-run) DRY_RUN=1 ;;
    *) echo "未知参数: $arg" >&2; exit 2 ;;
  esac
done

if [ -n "$(git status --porcelain)" ]; then
  echo "工作区不干净，先提交或 stash。" >&2
  git status --short >&2
  exit 1
fi

git remote get-url upstream >/dev/null 2>&1 || git remote add upstream "$UPSTREAM_URL"
git fetch --tags --quiet upstream

echo "== 本地 =="; git log --oneline -1
echo "== 上游 =="; git log --oneline -1 "upstream/$BRANCH"
NEW=$(git rev-list --count "HEAD..upstream/$BRANCH" 2>/dev/null || echo 0)
echo "== 上游新增 $NEW 个提交 =="
if [ "$NEW" = "0" ]; then echo "已是最新，无需追更。"; exit 0; fi
git log --oneline "HEAD..upstream/$BRANCH" | head -20
if [ "$DRY_RUN" = "1" ]; then echo; echo "--dry-run：不执行 rebase。"; exit 0; fi

if [ "$ASSUME_YES" != "1" ]; then
  printf '继续 rebase 到 upstream/%s? [y/N] ' "$BRANCH"
  read -r answer
  case "$answer" in y|Y|yes|YES) ;; *) echo "已取消。"; exit 1 ;; esac
fi

echo "== rebase =="
if ! git rebase "upstream/$BRANCH"; then
  echo
  echo "有冲突。中文词条文件（88/89-i18n-zh*.js）通常不该冲突；"
  echo "冲突多出现在 90-panel.js / 11-theme.js / 17-settings.js 的三处单行改动。"
  echo "处理后执行: git rebase --continue   放弃: git rebase --abort"
  exit 1
fi

echo "== 重建面板 =="; node scripts/build_panel.mjs
echo "== 上游测试 =="; node --test tests/panel.test.mjs | tail -5
echo "== 词条校验 =="; python3 scripts/check_terms.py --limit 10 || true
echo
echo "下一步："
echo "  1) 补译上面列出的未翻译词条"
echo "  2) 抬 manifest.json 版本 + 在 CHANGELOG.md 顶部加同名小节"
echo "  3) python3 -m pytest tests -q -k zh_hans"
echo "  4) git tag -a v<版本> -m '<版本>' && git push origin $BRANCH v<版本>"
