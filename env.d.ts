/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** When 'true', the site fetches a runtime content overlay from the backend
   *  and registers /admin routes for the owner dashboard. Off by default so
   *  existing static deploys are unaffected. */
  readonly VITE_PLATFORM_ENABLED?: string
  /** Backend base URL, e.g. https://api.apotomelabs.com/v1 */
  readonly VITE_CONTENT_API?: string
  /** This site's slug as registered in the backend Sites table. */
  readonly VITE_SITE_SLUG?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
