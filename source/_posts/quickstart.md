---
title: 快速上手指南
date: 2026-04-21 13:00:00
tags:
  - guide
  - hexo
categories:
  - 默认
---

如果你想在本博客添加新文章，按以下步骤：

## 新建文章

```bash
cd /web/hexo-site
cat > source/_posts/my-new-post.md <<'MD'
---
title: 标题
date: YYYY-MM-DD HH:MM:SS
---

正文……
MD
```

## 重新构建

```bash
bash /web/hexo-site/bin/build.sh
```

脚本会自动完成停服 → 构建 → 切换 → 重启。
