/* global hexo */
// 每次 hexo 构建时从 theme/source/photography/originals/ 随机挑一张作为 cover.background。
// dev 模式 `hexo s` 会每次重启/regenerate 重新选；生产 `hexo g` 每次构建也会选一次新的。
// 若目录为空或访问失败则保持用户在 _config.yml 里的 cover.background 不变。

'use strict';

const fs = require('hexo-fs');
const path = require('path');

module.exports = hexo => {
  const coverCfg = hexo.theme.config && hexo.theme.config.cover;
  if (!coverCfg) return;

  const photosDir = path.join(hexo.theme_dir, 'source', 'photography', 'originals');
  let files = [];
  try {
    if (!fs.existsSync(photosDir)) return;
    files = fs.listDirSync(photosDir).filter(f => /\.(jpe?g|png|webp|avif)$/i.test(f));
  } catch (e) {
    hexo.log.warn(`[cover] failed to read ${photosDir}: ${e.message}`);
    return;
  }
  if (!files.length) return;

  const pick = files[Math.floor(Math.random() * files.length)];
  coverCfg.background = `/photography/originals/${pick}`;
  hexo.log.info(`[cover] random background → ${pick}`);
};
