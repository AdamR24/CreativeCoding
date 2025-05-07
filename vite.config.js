// vite.config.js
const { resolve } = require('path')
const { defineConfig } = require('vite')

module.exports = defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        clock: resolve(__dirname, 'Clock.html'),
        mouse: resolve(__dirname, 'MouseDisturber.html'),
        text: resolve(__dirname, 'TextDisplay.html'),
      }
    }
  }
})