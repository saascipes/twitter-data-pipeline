const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');

module.exports = {
  configureWebpack: {
    plugins: [
      new MonacoWebpackPlugin()
    ]
  },
  devServer: {
    proxy: 'http://localhost:3000'
  },
  css: {
    loaderOptions: {
      sass: {
        data: `
          @import "@/sass/index.scss";
        `
      }
    }
  }
};