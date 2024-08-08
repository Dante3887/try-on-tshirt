const path = require('path');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

module.exports = {
    entry: './src/threejsmanager.js',
    output: {
        filename: "three.js",
        path: path.resolve(__dirname, 'dist'),
    },

    plugins: [
        new BundleAnalyzerPlugin()
    ],
}