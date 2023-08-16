import { defineConfig } from 'vite'
import { createVuePlugin as vue } from 'vite-plugin-vue2'
import EnvironmentPlugin from 'vite-plugin-environment'
import postcssNesting from 'postcss-nesting'
import VueI18nPlugin from '@intlify/unplugin-vue-i18n/vite'

import path from 'path'
import fs from 'fs'

const packageJson = fs.readFileSync('./package.json')
const appName = JSON.parse(packageJson).appName
const appVersion = JSON.parse(packageJson).version
const sbcName = JSON.parse(packageJson).sbcName
const sbcVersion = JSON.parse(packageJson).dependencies['sbc-common-components']
const aboutText1 = (appName && appVersion) ? `${appName} v${appVersion}` : ''
const aboutText2 = (sbcName && sbcVersion) ? `${sbcName} v${sbcVersion}` : ''
const generateAboutText = (aboutText1, aboutText2) => {
  if (aboutText1 && aboutText2) {
    return `"${aboutText1}<br>${aboutText2}"`
  } else if (aboutText1) {
    return `"${aboutText1}"`
  } else if (aboutText2) {
    return `"${aboutText2}"`
  } else {
    return ''
  }
}

export default defineConfig({
  define: {
    'import.meta.env.ABOUT_TEXT': generateAboutText(aboutText1, aboutText2)
  },
  envPrefix: 'VUE_APP_', // Need to remove this after fixing vaults. Use import.meta.env with VUE_APP.
  plugins: [
    vue(),
    EnvironmentPlugin({
      BUILD: 'web' // Fix for Vuelidate, allows process.env with Vite.
    }),
    postcssNesting,
    VueI18nPlugin({
      bridge: true,
      // Turn this off because we have html in our messages.
      strictMessage: false
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '~': path.resolve(__dirname, './node_modules'),
      '$assets': path.resolve(__dirname, './src/assets'),
      // Fix for vue-i18n-bridge unit tests fail - Remove with Vue3
      'vue-i18n-bridge': path.resolve(__dirname, './node_modules/vue-i18n-bridge/dist/vue-i18n-bridge.runtime.esm-bundler.js'),
      // Fix for bcrs-shared-components unit tests fail
      '@bcrs-shared-components/mixins': path.resolve(__dirname, './node_modules/@bcrs-shared-components/mixins/index.ts'),
      // Fix for module decorator unit tests fail
      'vuex-module-decorators': path.resolve(__dirname, './node_modules/vuex-module-decorators/dist/esm/index.js')
    },
    extensions: ['.js', '.ts', '.vue', '.json', '.css']
  },
  server: {
    port: 8080,
    host: true
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/unit/setup.ts',
    threading: true,
    // hide Vue Devtools message
    onConsoleLog: function (log) {
      if (log.includes('Download the Vue Devtools extension')) {
        return false
      }
    }
  },
  optimizeDeps: {
    // This needs to be done for FAS-UI and sbc-common-components to work.
    // Otherwise FAS complains about not having Vue.use(VueCompositionAPI)
    // sbc-common-components will fail at login.
    // vue-demi is included in here otherwise it gets the wrong vue instance.
    // Remove with Vue 3 for most of these.
    exclude: ['@vue/composition-api', 'sbc-common-components', 'vue-demi']
  }
})
