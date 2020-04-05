/* eslint-disable import/no-extraneous-dependencies */
const path = require('path');
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
  plugins: [],
};
// Exports
module.exports = config;
