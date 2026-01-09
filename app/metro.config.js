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

// Optimize resolver for faster module resolution
config.resolver = {
  ...config.resolver,
  // Enable source maps only in development
  sourceExts: process.env.NODE_ENV === 'production' 
    ? ['js', 'json', 'ts', 'tsx']
    : ['js', 'json', 'ts', 'tsx', 'jsx'],
};

module.exports = config;
