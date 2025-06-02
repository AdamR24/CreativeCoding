// vite.config.js
const { resolve } = require('path')
const { defineConfig } = require('vite')

module.exports = defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        datavis: resolve(__dirname, 'DataVisualizer.html'),
        mouse: resolve(__dirname, 'MouseDisturber.html'),
        pattern: resolve(__dirname, 'PatternGenerator.html'),
      }
    }
  }
})