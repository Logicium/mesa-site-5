/**
 * Pinia store that holds the live siteConfig and (optionally) deep-merges
 * a runtime overlay fetched from the backend.
 *
 * If the platform switch is off, or the network call fails, the build-time
 * config is used unchanged — so the site never breaks.
 */
import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { contentClient } from './contentClient'
import { PLATFORM_ENABLED, PLATFORM_SITE_KEY } from './config'

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

/**
 * Apply `source` into `target` in place, recursing into nested objects so
 * Vue's reactivity sees each leaf assignment. Replaces arrays and primitives
 * outright; merges plain-object branches. Used by templates to push the
 * hydrated server overlay into the reactive build-time siteConfig so live
 * pages re-render without component changes.
 */
export function applyDeep(target: Record<string, unknown>, source: unknown): void {
  if (!source || typeof source !== 'object' || Array.isArray(source)) return
  for (const [k, v] of Object.entries(source as Record<string, unknown>)) {
    const cur = target[k]
    if (v && typeof v === 'object' && !Array.isArray(v) && cur && typeof cur === 'object' && !Array.isArray(cur)) {
      applyDeep(cur as Record<string, unknown>, v)
    } else {
      target[k] = v
    }
  }
}

export const useSiteContentStore = defineStore('siteContent', () => {
  const config = ref<unknown>(null)
  const hydrated = ref(false)
  const hydrating = ref(false)
  const error = ref<string | null>(null)

  // Live Google reviews, mapped to the TestimonialsSection shape.
  const googleReviews = ref<Array<{ quote: string; author: string; source?: string; rating?: number }>>([])
  const googleReviewsLoaded = ref(false)

  const isPlatform = computed(() => PLATFORM_ENABLED && !!PLATFORM_SITE_KEY)

  /** 'manual' (hand-written testimonials) or 'google' (live reviews). */
  const reviewsSource = computed<'manual' | 'google'>(() => {
    const cfg = config.value as { reviewsSource?: string } | null
    return cfg?.reviewsSource === 'google' ? 'google' : 'manual'
  })

  // Templates seed the initial value with their build-time siteConfig.
  function setBuildTimeConfig(cfg: unknown) {
    if (config.value === null) config.value = cfg
  }

  async function loadGoogleReviews() {
    if (!isPlatform.value || googleReviewsLoaded.value) return
    try {
      const list = await contentClient.fetchReviews()
      googleReviews.value = list.map(r => ({
        quote: r.text,
        author: r.author,
        source: r.source || 'Google',
        rating: r.rating,
      }))
      googleReviewsLoaded.value = true
    } catch { /* ignore — testimonials remain the fallback */ }
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

  // Whenever the public site is configured for Google reviews, fetch them once.
  watch(reviewsSource, (s) => {
    if (s === 'google') void loadGoogleReviews()
  }, { immediate: true })

  return {
    config, hydrated, hydrating, error, isPlatform,
    reviewsSource, googleReviews,
    hydrate, setBuildTimeConfig, loadGoogleReviews,
  }
})
