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
import { PLATFORM_ENABLED, PLATFORM_SITE_KEY, PLATFORM_SITE_ID, PLATFORM_SLUG } from './config'

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

  // Cached id of the site whose slug matches PLATFORM_SITE_KEY — needed to call
  // the owner-scoped admin endpoints from the public site.
  const ownedSiteId = ref<string | null>(null)
  let ownedSiteLookup: Promise<string | null> | null = null

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
    if (!isPlatform.value) return
    try {
      const list = await contentClient.fetchReviews()
      // Public site only shows reviews that actually have substance: at least
      // four stars and a non-empty body. Anything else feels like clutter.
      googleReviews.value = list
        .filter(r => (r.rating ?? 0) >= 4 && !!r.text && r.text.trim().length > 0)
        .map(r => ({
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
      applyFavicon()
    } catch (e) {
      error.value = e instanceof Error ? e.message : String(e)
      // swallow — fall back to build-time config
    } finally {
      hydrating.value = false
    }
  }

  /**
   * Swap the document's `<link rel="icon">` if the published config defines a
   * custom favicon URL. Runs after hydrate so visitors always see the owner's
   * latest tab icon without needing a per-template touch.
   */
  function applyFavicon() {
    if (typeof document === 'undefined') return
    const cfg = config.value as { favicon?: string; brand?: { favicon?: string } } | null
    const url = cfg?.favicon || cfg?.brand?.favicon
    if (!url) return
    let link = document.querySelector<HTMLLinkElement>('link[rel~="icon"]')
    if (!link) {
      link = document.createElement('link')
      link.rel = 'icon'
      document.head.appendChild(link)
    }
    link.href = url
  }

  // Whenever the public site is configured for Google reviews, fetch them once.
  watch(reviewsSource, (s) => {
    if (s === 'google') void loadGoogleReviews()
  }, { immediate: true })

  /**
   * Resolve this deployment's site row id from the backend so the
   * ThemeSwitcher can call the owner-scoped admin endpoints. We prefer the
   * immutable UUID injected at build time (`PLATFORM_SITE_ID`) and fall back
   * to a slug lookup for sites deployed before the ID switchover.
   */
  async function resolveOwnedSiteId(): Promise<string | null> {
    if (ownedSiteId.value) return ownedSiteId.value
    if (!isPlatform.value) return null
    // Fast path: the provisioner injects the row's UUID directly, no list call.
    if (PLATFORM_SITE_ID) {
      ownedSiteId.value = PLATFORM_SITE_ID
      return ownedSiteId.value
    }
    if (!ownedSiteLookup) {
      ownedSiteLookup = contentClient.listSites()
        .then(sites => {
          const match = sites.find(s => s.id === PLATFORM_SITE_KEY || s.slug === PLATFORM_SITE_KEY || s.slug === PLATFORM_SLUG)
          ownedSiteId.value = match?.id ?? null
          return ownedSiteId.value
        })
        .catch(() => null)
    }
    return ownedSiteLookup
  }

  /**
   * Merge `patch` (typically theme / style fields) into the current draft and
   * publish. Used by the live ThemeSwitcher so an owner's tweaks become the
   * public site's defaults for everyone else. Silently no-ops for non-owners
   * or when the lookup fails — the worst case is a localStorage-only change.
   */
  async function saveThemePatch(patch: Record<string, unknown>): Promise<void> {
    const id = await resolveOwnedSiteId()
    if (!id) throw new Error('Could not resolve site id for this deployment')
    const draft = await contentClient.getDraft(id).catch(() => null)
    const base = (draft?.payload ?? {}) as Record<string, unknown>
    const merged: Record<string, unknown> = { ...base }
    for (const [k, v] of Object.entries(patch)) {
      if (v && typeof v === 'object' && !Array.isArray(v)
          && base[k] && typeof base[k] === 'object' && !Array.isArray(base[k])) {
        merged[k] = { ...(base[k] as Record<string, unknown>), ...(v as Record<string, unknown>) }
      } else {
        merged[k] = v
      }
    }
    await contentClient.publish(id, merged)
  }

  return {
    config, hydrated, hydrating, error, isPlatform,
    reviewsSource, googleReviews,
    ownedSiteId,
    hydrate, setBuildTimeConfig, loadGoogleReviews,
    resolveOwnedSiteId, saveThemePatch,
  }
})
