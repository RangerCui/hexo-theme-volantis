# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

This is **hexo-theme-volantis**, a theme for the [Hexo](https://hexo.io/) static site generator. It's not a standalone app — it's meant to be cloned/installed into the `themes/volantis` directory of a Hexo blog. The published artifact is the npm package `hexo-theme-volantis`. Current branch is `7.x`, which contains breaking changes (`7.0.0-alpha`).

There is no build step, no bundler, and no test suite. Development means editing EJS templates, Stylus files, and vanilla JS, and previewing with a Hexo site that loads this theme.

## Environment / commands

Required versions (see `README.md`):
```
Hexo: 5.4 ~ 6.x   (package.json depends on hexo ^8.1.1, 7.x branch targets newer)
hexo-cli: 4.3 ~ latest
node.js: 16.x LTS ~ latest LTS
```

There is no `npm test`, `npm run build`, or lint script — `package.json`'s only script is a placeholder (`"test": "echo test"`). Do not add commands assuming they exist.

To actually exercise the theme, you need a Hexo site that uses it. The CI workflow `.github/workflows/test-deploy.yml` demonstrates the pattern:
```bash
git clone https://github.com/volantis-x/volantis-x.github.io
cd volantis-x.github.io
git clone -b 7.x https://github.com/volantis-x/hexo-theme-volantis themes/volantis
npm i
npm install hexo-cli -g
npm run start   # usually `hexo clean && hexo s`
```

Release & publishing are automated via GitHub Actions — do not run `npm publish` manually:
- `.github/workflows/release-please.yml` — release-please drives version bumps & `CHANGELOG.md` from Conventional Commits against branch `7.x`.
- `.github/workflows/npm-publish.yml` — publishes to npm (uses OIDC, no NODE_AUTH_TOKEN).

Commits follow [Conventional Commits](https://www.conventionalcommits.org/) (enforced by release-please: `feat:`, `fix:`, `perf:`, `refactor:`, etc., optionally scoped like `fix(md): ...`).

## Big-picture architecture

### Configuration merging — this is the central concept

There are **three** sources of configuration that get merged at build time, and understanding this is required before touching almost anything:

1. `_config.yml` (theme root, ~56k lines of YAML) — the shipped defaults. Also `_cdn.yml` for CDN package manifests.
2. User's `source/_data/volantis.yml` in their Hexo site — full override or deep merge.
3. User's `theme_config:` block in their Hexo site's `_config.yml` — deep-merged if no `volantis.yml`.

The merge happens in `scripts/events/lib/config.js` on the `generateBefore` hook. Flow:
- If `data.volantis.override` is true → replace `hexo.theme.config` entirely.
- Else if `data.volantis` exists → deep-merge into both `hexo.config` and `hexo.theme.config`.
- Else → deep-merge `hexo.config.theme_config` into `hexo.theme.config`.

After this, read everything from `hexo.theme.config` (accessible as `theme` in EJS). Also: `hexo.config.meta_generator = false` and caching may force `relative_link = false` to avoid broken relative links when HTML is cached.

### CDN System

`_cdn.yml` lists every external asset (JS/CSS) with per-provider metadata. At runtime, `scripts/events/lib/cdn.js` rewrites any URL starting with `volantis-local/`, `volantis-npm/`, `volantis-static/`, or `volantis-cdnjs/` to the corresponding provider's prefix according to `cdn_system.priority` in `_config.yml`. When you add a new external dependency, add an entry to `_cdn.yml`, reference it by its `volantis-<provider>/...` alias, and expose it via `hexo.theme.config.cdn.<name>` for tags/helpers.

### Hexo extension surface — where things live

Everything this theme adds to Hexo is registered through `scripts/`:

- `scripts/events/index.js` — entry point. On `generateBefore`, runs config merge + `stellar-tag-utils` (arg parser for tag plugins, originally from hexo-theme-stellar) + `render-stylus` (attaches `hexo.renderStylus`, `hexo.createUuid`, `hexo.merge`, `hexo.getType` to the hexo instance) + optional environment check when `debug: env`.
- `scripts/filters/` — post/page HTML transforms:
  - `img.js`: wraps `<p><img></p>` with caption markup.
  - `replace.js`: runs user-defined `theme.replace` regex list (priority `999999999999`, after everything).
  - `z-lazyload.js`, `content-visibility.js`: perf-oriented rewrites.
- `scripts/helpers/` — EJS helpers (`FirstCSS()`, `getList`, `volantis_inject`, SEO/title/description/canonical generators, related posts, structured data).
- `scripts/tags/` — Hexo tag plugins (`{% note %}`, `{% md %}`, `{% btn %}`, `{% tabs %}`, `{% friends %}`, `{% timeline %}`, `{% swiper %}`, …). Many use `hexo.args.map(...)` from `stellar-tag-utils.js` to parse `key:value` positional arguments.

### Layout (EJS templates)

Entry is `layout/layout.ejs`; `layout/_pre.ejs` is rendered inside each page-type template (`index.ejs`, `post.ejs`, `page.ejs`, `category.ejs`, `tag.ejs`, `archive.ejs`, `list.ejs`, `friends.ejs`, `docs.ejs`, `404.ejs`) to normalize `page.cover` and `page.sidebar` from `theme.cover.display.*` and `theme.sidebar.for_page/for_post`.

Structure:
- `layout/_partial/` — header, footer, cover, side, post, article, meta, scripts/…
- `layout/_widget/` — sidebar widgets (blogger, category, tagcloud, toc, music, grid, …). User picks widgets via `sidebar.for_page` / `sidebar.for_post`.
- `layout/_meta/` — post metadata fragments (author, date, wordcount, share, category, tags, counter variants).
- `layout/_plugins/` — one folder per optional integration (comments: artalk/valine/waline/disqus/…; search: algolia/hexo/meilisearch; analytics; aplayer; chat; darkmode; highlight; lazyload; scrollreveal; share; toc; tianligpt; etc.). The `scripts/` partials pick which to include based on config.

### Styles (Stylus) — two-phase loading

Read `source/css/Readme.md`. The two-phase pattern is deliberate and based on <https://blog.skk.moe/post/improve-fcp-for-my-blog/>:

- `source/css/first.styl` → rendered via `hexo.renderStylus` by `scripts/helpers/first-style.js` and **inlined** into HTML by the `FirstCSS()` helper. Contains only first-paint-critical rules (base, navbar, cover, first-screen search, first-screen dark mode, font faces).
- `source/css/style.styl` → compiled to `/css/style.css` by `hexo-renderer-stylus` and loaded async. Contains everything else.

Dark mode is split accordingly: `_first/dark_first.styl` (inlined CSS variables + forced overrides) and `_style/_plugins/_dark/dark_async.styl` / `dark_plugins.styl` (async).

Subdirectories:
- `_defines/` — variables/mixins (`color.styl`, `layout.styl`, `fonts.styl`, `effect.styl`, `func.styl`, `AutoPrefixCSS.styl`).
- `_first/` — the critical-path partials `first.styl` imports.
- `_style/_base/`, `_style/_layout/`, `_style/_plugins/`, `_style/_tag-plugins/` — the async bundle.

When touching CSS, decide first: is this above-the-fold (→ `_first/`) or not (→ `_style/`)? Don't duplicate rules across both.

### Client JS

- `source/js/app.js` — bootstraps `VolantisApp`, `VolantisFancyBox`, highlight-keywords, anchor scrolling on `DOMContentLoaded`.
- `source/js/plugins/` — `aplayer.js`, `parallax.js`, `rightMenus.js`, `tags/` (per-tag client behavior like `sites.js`).
- `source/js/search/` — `algolia.js`, `hexo.js`, `meilisearch.js` (one runtime chosen by config).

Scripts are exposed to templates through the CDN system names (`volantis_app`, `volantis_aplayer`, …) defined in `_cdn.yml`.

### Custom Files injection points

`scripts/helpers/custom-files.js` (modified from NexT) defines user override points by name. `volantis_inject(<point>)` in layouts pulls them in. Points:
- Styles: `first`, `style`, `dark`, `darkVar`.
- Views: `headBegin`, `headEnd`, `header`, `side`, `topMeta`, `bottomMeta`, `footer`, `postEnd`, `bodyBegin`, `bodyEnd`.

Files under these points are watched only when Hexo is run as `hexo s`/`hexo server` (checked via `process.argv[2]`).

### i18n

`languages/en.yml`, `zh-CN.yml`, `zh-TW.yml`. Users can extend via `source/_data/languages.yml`; `config.js` merges per-lang entries into `hexo.theme.i18n` (supports Hexo's array-of-languages config).

## Conventions to respect

- **Don't add a build step.** There's no webpack/rollup/esbuild here. Client JS is shipped as-is; CSS compiles via `hexo-renderer-stylus`. Keep it that way unless the user asks.
- **Don't invent scripts.** `package.json` has no real test/lint/build. Only touch it to update dependencies or version (releases are automated).
- **Styles go to the right phase.** If you add a rule for something visible on first paint (navbar, cover, base typography, first-screen search) it belongs in `_first/`; everything else in `_style/`. Same for dark mode.
- **External assets go through `_cdn.yml` + the CDN System.** Don't hardcode `https://cdn.jsdelivr.net/...` URLs in templates; use `volantis-local/...` / `volantis-npm/...` / `volantis-static/...` / `volantis-cdnjs/...` aliases or add a `cdn.<name>` entry.
- **Tag plugins take `key:value` args.** Use `hexo.args.map(args, keys, others)` from `scripts/events/lib/stellar-tag-utils.js` rather than hand-parsing.
- **Config reads go through `hexo.theme.config` / EJS `theme`**, because of the merge layering above. Don't read user settings from `hexo.config.theme_config` directly after `generateBefore`.
- **Commits follow Conventional Commits.** Scopes are lowercase and often map to a subsystem (`md`, `artalk`, `comment`, `pandown`, `rightmenu`, `highlightjs`, …). The changelog is generated from commit messages — write them as the public release note.
- **`7.x` is the breaking-change branch.** `_config.yml` shouts this at the top. Don't worry about back-compat with 5.x/6.x unless the task says so; do flag breaking changes in commit messages with `!` or a `BREAKING CHANGE:` footer so release-please picks them up.

## Useful entry points when debugging

- Config issues → `scripts/events/lib/config.js` + `scripts/events/lib/check-configuration.js`.
- Broken CDN URL → `scripts/events/lib/cdn.js` + `_cdn.yml`.
- First-paint CSS not updating → `scripts/helpers/first-style.js` caches in `hexo.locals`; run `hexo clean` in the consuming site.
- Tag plugin misparsing args → `scripts/events/lib/stellar-tag-utils.js` (`hexo.args.map`).
- Custom file injection not firing → `scripts/helpers/custom-files.js` (check point name is spelled exactly, and that you're running `hexo s` for watch).
- Env-check on startup → set `debug: env` in `_config.yml`; runs `scripts/events/lib/check-environment.js` on `generateBefore`.
