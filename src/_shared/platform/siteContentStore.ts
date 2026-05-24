/**
 * Pinia store that holds the live siteConfig and (optionally) deep-merges
 * a runtime overlay fetched from the backend.
 *
 * If the platform switch is off, or the network call fails, the build-time
 * config is used unchanged — so the site never breaks.
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { contentClient } from './contentClient'
import { PLATFORM_ENABLED, PLATFORM_SLUG } from './config'

function deepMerge<T>(base: T, override: unknown): T {
  if (override === null || override === undefined) return base
  if (Array.isArray(override)) return override as unknown as T
  if (typeof base !== 'object' || typeof override !== 'object' || base === null) return override as T
  const out: Record<string, unknown> = { ...(base as Record<string, unknown>) }
  for (const [k, v] of Object.entries(override as Record<string, unknown>)) {
    out[k] = deepMerge((base as Record<string, unknown>)[k] as unknown, v)
  }
  return out as T
}

export const useSiteContentStore = defineStore('siteContent', () => {
  const config = ref<unknown>(null)
  const hydrated = ref(false)
  const hydrating = ref(false)
  const error = ref<string | null>(null)

  const isPlatform = computed(() => PLATFORM_ENABLED && !!PLATFORM_SLUG)

  // Templates seed the initial value with their build-time siteConfig.
  function setBuildTimeConfig(cfg: unknown) {
    if (config.value === null) config.value = cfg
  }

  async function hydrate() {
    if (!isPlatform.value || hydrated.value || hydrating.value) return
    hydrating.value = true
    try {
      const res = await contentClient.fetchContent()
      config.value = deepMerge(config.value, res.content)
      hydrated.value = true
    } catch (e) {
      error.value = e instanceof Error ? e.message : String(e)
      // swallow — fall back to build-time config
    } finally {
      hydrating.value = false
    }
  }

  return { config, hydrated, hydrating, error, isPlatform, hydrate, setBuildTimeConfig }
})
