import { ref } from 'vue'

/**
 * Two-phase image pre-loading:
 *  1. Await `preloadCritical(urls)` — blocks until those images are in cache.
 *  2. Call `preloadBackground(urls)` — fire-and-forget, silently warms the cache.
 *
 * Both use the browser's native Image() API, so the downloads are stored in
 * the HTTP cache automatically. Any <img> or CSS background that later
 * references the same URL will be served instantly from cache.
 */
function loadOne(url: string): Promise<void> {
  return new Promise(resolve => {
    const img = new Image()
    img.onload = () => resolve()
    img.onerror = () => resolve() // never block the app on a broken image
    img.src = url
  })
}

export function useImagePreload() {
  const isReady = ref(false)

  /** Awaitable: resolves when all `urls` have loaded (or errored). */
  async function preloadCritical(urls: string[]): Promise<void> {
    await Promise.all(urls.map(loadOne))
    isReady.value = true
  }

  /** Fire-and-forget: starts downloads without awaiting. */
  function preloadBackground(urls: string[]): void {
    urls.forEach(loadOne)
  }

  return { isReady, preloadCritical, preloadBackground }
}
