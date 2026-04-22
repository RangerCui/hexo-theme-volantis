/**
 * photogallery.js
 *
 * {% photogallery [col] [group] [recentCount] %}
 *
 * Source:
 * - theme/source/photography/thumbs/
 * - theme/source/photography/originals/
 * - theme/source/photography/captions.yml
 *
 * captions.yml supports:
 * - legacy string: `photo-01.jpg: "标题"`
 * - object:
 *   photo-01.jpg:
 *     date: 2026-04-21
 *     title: 夜色海岸
 *     intro: 拍摄时有海风，曝光稍微拉高了一档。
 *     caption: 灯箱说明（可选）
 */

'use strict';

const fs = require('hexo-fs');
const path = require('path');

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// 文件名 photo-01.jpeg → "摄影 #01"，作为 title/caption 的中文默认
function defaultTitleFromFile(fileName) {
  const m = /(?:^|\D)(\d{1,4})\./.exec(fileName);
  if (m) return `摄影 #${m[1]}`;
  return fileName.replace(/\.[a-z]+$/i, '');
}

function normalizePhotoMeta(raw, fileName) {
  const fallback = defaultTitleFromFile(fileName);

  if (typeof raw === 'string') {
    const s = raw.trim();
    return {
      date: '',
      title: s || fallback,
      intro: '',
      caption: s || fallback
    };
  }

  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    const title = (raw.title || raw.caption || raw.name || '').toString().trim() || fallback;
    const intro = (raw.intro || raw.description || raw.desc || raw.summary || '').toString().trim();
    const date = raw.date || raw.time || raw.timeline || '';
    const caption = (raw.caption || '').toString().trim() || [title, intro].filter(Boolean).join(' · ');
    return { date, title, intro, caption };
  }

  return {
    date: '',
    title: fallback,
    intro: '',
    caption: fallback
  };
}

function parseSortDate(date) {
  if (date instanceof Date && !Number.isNaN(date.getTime())) {
    return date.getTime();
  }
  const str = String(date || '').trim();
  if (!str) return null;
  const ts = Date.parse(str);
  return Number.isNaN(ts) ? null : ts;
}

function formatDateLabel(date) {
  if (date instanceof Date && !Number.isNaN(date.getTime())) {
    return date.toISOString().slice(0, 10);
  }
  return String(date || '').trim();
}

function buildPhotoCard(photo, group, variant) {
  const { fileName, thumbUrl, fullUrl, meta } = photo;
  const title = meta.title || fileName;
  const intro = meta.intro || '';
  const dateLabel = formatDateLabel(meta.date);
  const caption = meta.caption || [title, intro, dateLabel].filter(Boolean).join(' · ');
  const variantClass = variant === 'recent' ? 'photo-card--recent' : 'photo-card--all';

  const introHtml = intro
    ? `<p class="photo-intro">${escapeHtml(intro)}</p>`
    : '';

  const dateHtml = dateLabel
    ? `<time datetime="${escapeHtml(dateLabel)}">${escapeHtml(dateLabel)}</time>`
    : '';

  return `<article class="photo-card ${variantClass}">`
    + `<a class="photo-link fancybox" itemscope itemtype="http://schema.org/ImageObject" itemprop="url"`
    + ` href="${fullUrl}" data-fancybox="${escapeHtml(group)}" data-caption="${escapeHtml(caption)}">`
    + `<img class="img fancybox" itemprop="contentUrl" src="${thumbUrl}" alt="${escapeHtml(caption)}"/>`
    + `</a>`
    + `<div class="photo-meta">`
    + `<h4 class="photo-title">${escapeHtml(title)}</h4>`
    + introHtml
    + dateHtml
    + `</div>`
    + `</article>`;
}

hexo.extend.tag.register('photogallery', function (args) {
  const clean = s => String(s || '').trim().replace(/,$/, '').trim();
  const col = clean(args[0]) || '4';
  const group = clean(args[1]) || 'photography';
  const recentCountArg = Number.parseInt(clean(args[2]) || '7', 10);
  const recentCount = Number.isNaN(recentCountArg) ? 7 : Math.max(1, Math.min(12, recentCountArg));

  const baseDir = path.join(hexo.theme_dir, 'source', 'photography');
  const thumbsDir = path.join(baseDir, 'thumbs');
  const originalsDir = path.join(baseDir, 'originals');
  const captionsPath = path.join(baseDir, 'captions.yml');
  const siteRoot = (hexo.config.root || '/').replace(/\/?$/, '/');

  let captions = {};
  if (fs.existsSync(captionsPath)) {
    try {
      captions = hexo.render.renderSync({ path: captionsPath, engine: 'yaml' }) || {};
    } catch (e) {
      hexo.log.warn(`[photogallery] failed to parse captions.yml: ${e.message}`);
    }
  }

  let files = [];
  try {
    files = fs.listDirSync(thumbsDir)
      .filter(f => /\.(jpe?g|png|webp|avif)$/i.test(f))
      .sort();
  } catch (e) {
    hexo.log.warn(`[photogallery] thumbs dir not found: ${thumbsDir}`);
    return `<div class="note warning"><p>photography/thumbs/ 目录不存在，无法渲染相册。</p></div>`;
  }

  if (files.length === 0) {
    return `<div class="note info"><p>尚无照片。向 theme/source/photography/ 放入图片即可。</p></div>`;
  }

  const photos = files.map((f, idx) => {
    const hasOriginal = fs.existsSync(path.join(originalsDir, f));
    const thumbUrl = `${siteRoot}photography/thumbs/${f}`;
    const fullUrl = hasOriginal ? `${siteRoot}photography/originals/${f}` : thumbUrl;
    const meta = normalizePhotoMeta(captions[f], f);
    return {
      fileName: f,
      thumbUrl,
      fullUrl,
      meta,
      idx,
      sortKey: parseSortDate(meta.date)
    };
  }).sort((a, b) => {
    if (a.sortKey !== null && b.sortKey !== null) return b.sortKey - a.sortKey;
    if (a.sortKey !== null) return -1;
    if (b.sortKey !== null) return 1;
    return a.idx - b.idx;
  });

  const recents = photos.slice(0, recentCount);
  const recentHtml = recents.map(photo => buildPhotoCard(photo, group, 'recent')).join('');
  const allHtml = photos.map(photo => buildPhotoCard(photo, group, 'all')).join('');

  return `<div galleryFlag itemscope itemtype="http://schema.org/ImageGallery"`
    + ` class="gallery photogallery cd-template" col="${escapeHtml(col)}" data-group="${escapeHtml(group)}" data-layout="chuckdries-template">`
    + `<section class="cd-gallery-hero">`
    + `<h2>摄影作品集</h2>`
    + `<p>最近更新</p>`
    + `</section>`
    + `<section class="cd-gallery-section">`
    + `<div class="cd-section-head">`
    + `<h3 id="recently">最近更新</h3>`
    + `</div>`
    + `<div class="cd-recent-strip">${recentHtml}</div>`
    + `</section>`
    + `<section class="cd-gallery-section cd-gallery-section--all">`
    + `<div class="cd-section-head">`
    + `<h3 id="all">全部作品</h3>`
    + `</div>`
    + `<div class="cd-masonry">${allHtml}</div>`
    + `</section>`
    + `</div>`;
});
