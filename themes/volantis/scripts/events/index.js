/* global hexo */

'use strict';

const configLib = require('./lib/config');
const stellarTagUtilsLib = require('./lib/stellar-tag-utils');
const renderStylusLib = require('./lib/render-stylus');
const checkEnvironmentLib = require('./lib/check-environment');
// const randomCoverLib = require('./lib/random-cover'); // 已停用：cover.background 改为固定 photo-04.jpeg
const { version } = require('../../package.json');

hexo.on('generateBefore', () => {
  // Merge config.
  configLib(hexo);
  stellarTagUtilsLib(hexo);
  renderStylusLib(hexo);
  // randomCoverLib(hexo); // 保留 scripts/events/lib/random-cover.js 文件以便日后需要重新启用
  if (hexo.theme.config.debug === "env") {
    checkEnvironmentLib(hexo);
  }
});

hexo.on('ready', () => {
  hexo.log.info(`
============================================================
  Volantis ${version}
  Docs: https://volantis.js.org/
  Repo: https://github.com/volantis-x/hexo-theme-volantis/
============================================================`);
});