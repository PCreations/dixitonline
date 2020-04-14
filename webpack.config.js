/* eslint-disable import/no-extraneous-dependencies */
const path = require('path');
const SentryWebpackPlugin = require('@sentry/webpack-plugin');
require('@babel/register');

// Webpack Configuration
const config = {
  // Entry
  entry: './index.js',
  // Output
  output: {
    path: path.resolve(__dirname, 'functions/build'),
    filename: 'dixit.js',
    library: 'dixit',
    libraryTarget: 'umd',
  },
  target: 'node',
  // Loaders
  module: {
    rules: [
      // JavaScript/JSX Files
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: ['babel-loader'],
      },
    ],
  },
  // Plugins
  plugins: [
    new SentryWebpackPlugin({
      include: '.',
      ignoreFile: '.sentrycliignore',
      ignore: ['node_modules', 'webpack.config.js'],
      configFile: 'sentry.properties',
    }),
  ],
};
// Exports
module.exports = config;
