'use strict'
const path = require('path')

function resolve(dir) {
  return path.join(__dirname, dir)
}
// const name = 'electron-vue-example' // page title
const port = 9020
module.exports = {
    publicPath: '/',
  // outputDir: 'dist',
  // assetsDir: 'static',
  // lintOnSave: process.env.NODE_ENV === 'development',
  // productionSourceMap: false,
  devServer: {
    port: port
    //   open: true,
    //   overlay: {
    //     warnings: false,
    //     errors: true
    //   }
  },
  chainWebpack(config) {
    // alias
    config.resolve.alias.set('@', resolve('src'))
  }
}
