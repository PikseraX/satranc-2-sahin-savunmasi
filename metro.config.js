const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
config.resolver.assetExts = config.resolver.assetExts.filter((ext) => ext !== 'html');
config.resolver.sourceExts.push('html');
config.transformer.babelTransformerPath = require.resolve('./html-transformer');

module.exports = config;
