const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Performance optimizations
config.transformer = {
  ...config.transformer,
  // Enable minification in production
  minifierPath: require.resolve('metro-minify-terser'),
  minifierConfig: {
    ecma: 8,
    keep_classnames: true,
    keep_fnames: true,
    module: true,
    mangle: {
      module: true,
      keep_classnames: true,
      keep_fnames: true,
    },
  },
  // Enable inline requires for better performance
  getTransformOptions: async () => ({
    transform: {
      experimentalImportSupport: false,
      inlineRequires: true,
    },
  }),
};

// Ensure Expo's default extensions are preserved; add jsx only in development
const defaultSourceExts = config.resolver.sourceExts ?? [];
config.resolver = {
  ...config.resolver,
  sourceExts: process.env.NODE_ENV === 'production'
    ? defaultSourceExts.filter(ext => ext !== 'jsx')
    : [...new Set([...defaultSourceExts, 'jsx'])],
};

module.exports = config;
