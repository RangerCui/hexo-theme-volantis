#!/usr/bin/env bash
set -u
pass() { echo "  [OK] $1"; }
fail() { echo "  [FAIL] $1"; exit 1; }

echo "== V1 swap 生效 =="
[[ $(swapon --show --bytes --noheadings 2>/dev/null | awk '{sum+=$3} END{print sum+0}') -ge 2000000000 ]] \
  && pass "swap >= 2GB" || fail "swap missing"

echo "== V2 主题就位 =="
test -f /web/hexo-site/themes/volantis/layout/layout.ejs \
  && pass "theme files" || fail "theme missing"

echo "== V3 产物完整 =="
test -s /web/hexo-site/public/index.html \
  && pass "index.html non-empty" || fail "index.html missing"

echo "== V4 首页含文章结构 =="
grep -qE "<article|<h2|post-title|class=\"post" /web/hexo-site/public/index.html \
  && pass "article structure" || fail "no article markers on index"

echo "== V4.1 至少一篇文章详情页 =="
find /web/hexo-site/public -name '*.html' -not -name 'index.html' -type f | head -1 | grep -q . \
  && pass "article html exists" || fail "no article detail page"

echo "== V5 nginx 符号链接 =="
[[ $(readlink /etc/nginx/sites-enabled/hexo-blog) == "../sites-available/hexo-blog" ]] \
  && pass "hexo-blog enabled" || fail "symlink wrong"
[[ ! -L /etc/nginx/sites-enabled/default ]] \
  && pass "default unlinked" || fail "default still linked"
[[ ! -L /etc/nginx/sites-enabled/rails-demo ]] \
  && pass "rails-demo unlinked" || fail "rails-demo still linked"

echo "== V6 本地 HTTP 200 =="
code=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1/)
[[ "$code" == "200" ]] && pass "GET / -> 200" || fail "GET / -> $code"

echo "== V7 基础硅化 =="
curl -sI http://127.0.0.1/ | grep -qi "x-content-type-options: nosniff" \
  && pass "X-Content-Type-Options" || fail "XCTO missing"
curl -sI http://127.0.0.1/ | grep -qi "x-frame-options: SAMEORIGIN" \
  && pass "X-Frame-Options" || fail "XFO missing"
! curl -sI http://127.0.0.1/ | grep -qiE "^Server: nginx/[0-9]" \
  && pass "nginx version hidden" || fail "nginx version leaked"
code=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1/.git/config)
[[ "$code" == "404" ]] && pass ".git denied (404)" || fail ".git -> $code"
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://127.0.0.1/)
[[ "$code" == "405" ]] && pass "POST denied (405)" || fail "POST -> $code"

echo
echo "ALL CHECKS PASSED"
