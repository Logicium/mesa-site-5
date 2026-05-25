/**
 * Platform feature switch.
 *
 * When `enabled` is true, the app:
 *   - boots `useSiteContentStore().hydrate()` from the backend overlay before mount,
 *   - registers `/admin/*` routes for the owner dashboard,
 *   - posts contact-form submissions to the backend.
 *
 * When false (default), the site behaves exactly as it does today: fully static,
 * reading from the build-time `src/config/site.config.ts`.
 *
 * Toggle via `VITE_PLATFORM_ENABLED=true` in the environment.
 */
export const PLATFORM_ENABLED = import.meta.env.VITE_PLATFORM_ENABLED === 'true'

/** Backend base URL (no trailing slash). */
export const PLATFORM_API = (import.meta.env.VITE_CONTENT_API || '').replace(/\/$/, '')

/** This site's slug in the backend. Set per-deployment by the provisioner. */
export const PLATFORM_SLUG = import.meta.env.VITE_SITE_SLUG || ''

/** This site's immutable UUID in the backend. Preferred over slug for lookups. */
export const PLATFORM_SITE_ID = import.meta.env.VITE_SITE_ID || ''

/**
 * The key used by `contentClient` for all public per-site requests.
 * Prefers the immutable site ID; falls back to the slug for back-compat
 * with sites deployed before the ID switchover.
 */
export const PLATFORM_SITE_KEY = PLATFORM_SITE_ID || PLATFORM_SLUG

export type ArchetypeKind = 'mesa' | 'hearth' | 'vault' | 'project' | 'keystone'

/** Which archetype this UI represents. Derived from VITE_SITE_SLUG. */
export const ARCHETYPE_KIND = (import.meta.env.VITE_SITE_SLUG || 'hearth') as ArchetypeKind

