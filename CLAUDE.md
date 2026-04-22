# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

**RangerCui 的个人博客仓库**。这不是一个可分发的 Hexo 主题包，而是主题 + 站点内容的合并体：根目录就是 Hexo 站点根，主题代码位于 `themes/volantis/`。

从 <https://github.com/volantis-x/hexo-theme-volantis> 7.x 分支 fork 而来，经过大量个人化改造后与站点合并到一处。

## 目录结构

```
repo-root/
├── _config.yml            # 站点 Hexo 配置（title / author / url / theme: volantis）
├── package.json           # 站点依赖（hexo + generators + renderers）
├── scaffolds/             # hexo new 模板
├── source/                # 站点内容
│   ├── _posts/            # 博文（AI 技术文等）
│   ├── about/index.md     # 关于页
│   ├── categories/index.md
│   ├── tags/index.md
│   └── photography/index.md   # 摄影页（调用 {% photogallery %}）
└── themes/
    └── volantis/          # 主题本体（原 fork 的内容）
        ├── _config.yml    # 主题默认配置（cover / navbar / sidebar 等）
        ├── _cdn.yml       # 外部资源 CDN 映射
        ├── layout/        # EJS 模板
        ├── scripts/       # Hexo 扩展（events / filters / helpers / tags）
        ├── source/        # 主题静态资产（CSS/JS/photography 照片）
        └── languages/     # i18n
```

## 开发命令

从仓库根运行：

```bash
npm install             # 一次
npx hexo clean          # 清空 db.json / public/
npx hexo server         # http://localhost:4000
npx hexo generate       # 产出 public/
```

改动 `themes/volantis/scripts/**` 里的 tag plugin 后，必须 `rm db.json && npx hexo server` 才会重新执行 —— Hexo 会把 tag 渲染结果缓存进 db.json，只重启 server 不够。

本仓库没有测试 / lint / 构建脚本；改动后靠 `hexo s` + 浏览器自测。

## 关键定制点（相对于 Volantis 上游）

- **`themes/volantis/scripts/tags/photogallery.js`** —— 新增 `{% photogallery [col] [group] %}` tag。自动扫描 `themes/volantis/source/photography/{thumbs,originals}/`，配合 `captions.yml` 生成"hero + 最近更新 + 全部作品"三段布局。
- **`themes/volantis/scripts/events/lib/random-cover.js`** —— 每次 Hexo 构建时，从 `themes/volantis/source/photography/originals/` 随机挑一张覆盖 `cover.background`。`hexo s` 重启或文件变化触发 regenerate 时即换。
- **`themes/volantis/source/js/app.js`** 的 `VolantisFancyBox.Images.content` —— 修复 thumb/full 分离时 lightbox 误取 thumb URL 的问题，同时剥除 lazyload 注入的 `srcset="data:image/gif..."` 占位符。
- **Footer**（`themes/volantis/_config.yml:site_footer`）—— 许可证改为 CC BY 4.0；删除 `info` 行（Use Volantis as theme）；新增 `credits` 行一次性归属 Twemoji / Font Awesome / Fancybox / Volantis。
- **Nav**（`_config.yml` → `theme_config` 或 `themes/volantis/_config.yml:navbar.menu`）—— 博客 / 分类 / 标签 / 归档 / 关于 / 🌙 暗黑；首页 cover 坞是 博客 / 时间轴 / 摄影 / github。

## 坑点备忘

- **Hexo 架构约束**：markdown 页面必须放在站点 `source/`（即根 `source/`），放在 `themes/volantis/source/` 会被当静态资源只跑 md 渲染器、不走 EJS layout。摄影页 `index.md` 在 `source/photography/index.md`，照片文件本身在 `themes/volantis/source/photography/originals/`（随主题走）。
- **静态资源合并**：Hexo 构建时把 `themes/<name>/source/` 和站点 `source/` 的文件合并到同一个 URL 命名空间。所以 `/photography/originals/photo-01.jpeg` 来自主题、`/photography/index.html` 来自站点，二者并存不冲突。
- **post asset folder**：`_config.yml:post_asset_folder: true`。每篇 post 可挂同名子文件夹放图。但 markdown 里的相对图片路径 Hexo 默认不改写成完整 URL —— 必须手动写成绝对路径 `/2026/04/21/<post-slug>/image.svg`，否则会渲染成根路径 404。
- **TOC 锚点大小写**：`hexo-renderer-marked@7` 默认保留 heading 原文大小写（`1-AI-基础...`）；源 markdown 里 GitHub 风格小写锚点（`#1-ai-基础...`）会 404。已修过 4 篇 AI 文的锚点，后续新文注意保持一致。
- **db.json 是编译缓存**：改 tag plugin / Stylus 后，除了重启 server 还要 `rm db.json`，否则看不到变化。
