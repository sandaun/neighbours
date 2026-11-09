const path = require('node:path');

const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// The web backoffice in admin/ is a separate project; never crawl or bundle it.
const adminDirectory = path.join(__dirname, 'admin');
const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
config.resolver.blockList = [
  ...[config.resolver.blockList ?? []].flat(),
  new RegExp(`^${escapeRegExp(adminDirectory)}[\\\\/].*`),
];

module.exports = withNativeWind(config, { input: './src/global.css' });
