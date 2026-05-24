import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import '@apotome/archetype-shared/styles/base.css'
import './styles/themes.css'
import './styles/scrollbar.css'
import { PLATFORM_ENABLED } from '@apotome/archetype-shared/platform/config'
import { useSiteContentStore, applyDeep } from '@apotome/archetype-shared/platform/siteContentStore'
import { siteConfig } from './config/site.config'

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)
app.use(router)

async function boot() {
  const store = useSiteContentStore(pinia)
  store.setBuildTimeConfig(siteConfig)
  if (PLATFORM_ENABLED) {
    try {
      await store.hydrate()
      applyDeep(siteConfig as unknown as Record<string, unknown>, store.config)
    } catch { /* fall back to build-time config */ }
  }
  app.mount('#app')
}

void boot()
