/**
 * Thin fetch wrapper around the archetype-service API.
 * Sends credentials (cookie session for admin endpoints); throws on non-2xx.
 */
import { PLATFORM_API, PLATFORM_SLUG } from './config'

const SESSION_KEY = 'archetype_session'
export function getStoredToken(): string | null { try { return localStorage.getItem(SESSION_KEY) } catch { return null } }
export function storeSessionToken(t: string) { try { localStorage.setItem(SESSION_KEY, t) } catch {} }
export function clearSessionToken() { try { localStorage.removeItem(SESSION_KEY) } catch {} }

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  if (!PLATFORM_API) throw new Error('VITE_CONTENT_API not configured')
  const token = getStoredToken()
  const headers: Record<string, string> = {}
  if (body) headers['Content-Type'] = 'application/json'
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(`${PLATFORM_API}${path}`, {
    method,
    credentials: 'include',
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`API ${method} ${path} ${res.status}: ${text}`)
  }
  return res.status === 204 ? (undefined as T) : (res.json() as Promise<T>)
}

export const contentClient = {
  // --- Public (no auth) ---
  fetchContent: () =>
    request<{ slug: string; archetype: string; plan: string; content: Record<string, unknown> }>(
      'GET',
      `/sites/${encodeURIComponent(PLATFORM_SLUG)}/content`,
    ),
  fetchReviews: () =>
    request<{ rating: number; author: string; text: string; source: string }[]>(
      'GET',
      `/sites/${encodeURIComponent(PLATFORM_SLUG)}/reviews`,
    ).catch(() => [] as Array<{ rating: number; author: string; text: string; source: string }>),
  fetchInstagram: () =>
    request<{ media: Array<{ id: string; media_url: string; permalink: string; caption?: string }> }>(
      'GET',
      `/sites/${encodeURIComponent(PLATFORM_SLUG)}/instagram`,
    ).catch(() => ({ media: [] })),
  submitForm: (type: 'contact' | 'newsletter', fields: Record<string, string>, captcha?: string) =>
    request<{ ok: true }>('POST', `/sites/${encodeURIComponent(PLATFORM_SLUG)}/submissions`, {
      type,
      fields,
      captcha,
      hp: '',
    }),

  // --- Auth ---
  requestMagicLink: (email: string, name?: string) =>
    request<{ ok: true }>('POST', `/auth/request-link`, { email, name }),
  verifyMagicToken: async (token: string) => {
    const data = await request<{ ok: true; sessionToken: string; owner: { id: string; email: string; name?: string } }>('GET', `/auth/callback?token=${encodeURIComponent(token)}`)
    if (data.sessionToken) storeSessionToken(data.sessionToken)
    return data
  },
  passwordRegister: async (email: string, password: string, name?: string) => {
    const data = await request<{ ok: true; sessionToken: string; owner: { id: string; email: string; name?: string } }>('POST', `/auth/register`, { email, password, name })
    if (data.sessionToken) storeSessionToken(data.sessionToken)
    return data
  },
  passwordLogin: async (email: string, password: string) => {
    const data = await request<{ ok: true; sessionToken: string; owner: { id: string; email: string; name?: string } }>('POST', `/auth/login`, { email, password })
    if (data.sessionToken) storeSessionToken(data.sessionToken)
    return data
  },
  setPassword: (password: string) =>
    request<{ ok: true }>('POST', `/auth/set-password`, { password }),
  me: () => request<{ owner: { id: string; email: string; name?: string; hasPassword?: boolean } }>('GET', '/auth/me'),
  logout: async () => {
    clearSessionToken()
    return request<{ ok: true }>('POST', '/auth/logout')
  },

  // --- Admin ---
  listSites: () => request<Array<{ id: string; slug: string; archetype: string; status: string; productionUrl?: string; customDomain?: string }>>('GET', '/admin/sites'),
  getDraft: (siteId: string) => request<{ version: number; published: boolean; payload: Record<string, unknown> }>('GET', `/admin/sites/${siteId}/content/draft`),
  saveDraft: (siteId: string, payload: Record<string, unknown>) => request<{ version: number; published: boolean }>('PUT', `/admin/sites/${siteId}/content/draft`, { payload }),
  publish: (siteId: string, payload?: Record<string, unknown>) => request<{ version: number; publishedAt: string }>('POST', `/admin/sites/${siteId}/content/publish`, { payload }),
  listVersions: (siteId: string) => request<Array<{ version: number; published: boolean; publishedAt?: string; createdAt: string }>>('GET', `/admin/sites/${siteId}/content/versions`),
  restoreVersion: (siteId: string, version: number) => request<{ version: number; publishedAt: string }>('POST', `/admin/sites/${siteId}/content/versions/${version}/restore`),
  uploadMedia: (siteId: string, filename: string, contentType: string, base64: string) => request<{ url: string }>('POST', `/admin/sites/${siteId}/media`, { filename, contentType, base64 }),

  listSubmissions: (siteId: string) => request<Array<{ id: string; type: string; payload: Record<string, string>; readAt?: string; createdAt: string }>>('GET', `/admin/sites/${siteId}/submissions`),
  markSubmissionRead: (siteId: string, subId: string) => request<{ ok: true }>('POST', `/admin/sites/${siteId}/submissions/${subId}/read`),

  setGooglePlace: (siteId: string, placeId: string) => request<{ ok: true }>('POST', `/admin/sites/${siteId}/google-place`, { placeId }),
  addManualReview: (siteId: string, body: { author: string; rating: number; text: string }) => request<{ id: string }>('POST', `/admin/sites/${siteId}/reviews/manual`, body),

  getInstagramConnect: (siteId: string) => request<{ url: string }>('GET', `/admin/sites/${siteId}/instagram/connect`),
  disconnectInstagram: (siteId: string) => request<{ ok: true }>('POST', `/admin/sites/${siteId}/instagram/disconnect`),

  requestDomain: (siteId: string, domain: string) => request<{ domain: string; dns: { instructions: Array<{ type: string; name: string; value: string; note: string }> } }>('POST', `/admin/sites/${siteId}/domain`, { domain }),
  verifyDomain: (siteId: string) => request<{ ok: boolean }>('POST', `/admin/sites/${siteId}/domain/verify`),
  getDomain: (siteId: string) => request<{ domain?: string; token?: string }>('GET', `/admin/sites/${siteId}/domain`),

  getAnalytics: (siteId: string) => request<Array<{ date: string; visitors: number; pageviews: number; uptimeLatencyMs: number; uptimeError?: string }>>('GET', `/admin/sites/${siteId}/analytics`),

  generateCopy: (siteId: string, field: string, prompt: string, context?: Record<string, unknown>) =>
    request<{ options: string[] }>('POST', `/admin/sites/${siteId}/ai/copy`, { field, prompt, context }),

  listOrders: () => request<Array<{ id: string; archetype: string; plan: string; status: string; siteId?: string; createdAt: string; failureReason?: string }>>('GET', '/admin/orders'),
  retryOrder: (orderId: string) => request<{ ok: true }>('POST', `/admin/orders/${orderId}/retry`),
  getDeployLogs: (siteId: string) => request<Array<{ step: string; status: string; message?: string; durationMs?: number; createdAt: string }>>('GET', `/admin/sites/${siteId}/deploy-logs`),
  redeploySite: (siteId: string) => request<{ ok: boolean; deploymentId: string; url: string }>('POST', `/admin/sites/${siteId}/redeploy`),

  /** Live Vercel deployment state for a site (for progress UI). Pass deploymentId to follow a specific deploy. */
  getDeploymentStatus: (siteId: string, deploymentId?: string) => request<{
    state: 'QUEUED' | 'INITIALIZING' | 'BUILDING' | 'UPLOADING' | 'DEPLOYING' | 'READY' | 'ERROR' | 'CANCELED' | 'UNKNOWN'
    deploymentId: string | null
    url: string | null
    createdAt: number | null
    siteStatus: string
    productionUrl: string | null
  }>('GET', `/admin/sites/${siteId}/deployment-status${deploymentId ? `?deploymentId=${encodeURIComponent(deploymentId)}` : ''}`),

  /** Compare the site's recorded template commit against the latest commit on the template repo. */
  getUpdateStatus: (siteId: string) => request<{ current: string | null; latest: string | null; hasUpdate: boolean; neverChecked?: boolean }>('GET', `/admin/sites/${siteId}/update-status`),
  /** Queue a job that syncs template files into the customer's repo and triggers a redeploy. */
  updateSite: (siteId: string) => request<{ ok: true; jobId: string | number }>('POST', `/admin/sites/${siteId}/update`),
  /** Force a fresh provisioning run for a stuck site (idempotent — reuses existing repo/project). */
  reprovisionSite: (siteId: string) => request<{ ok: true; orderId: string }>('POST', `/admin/sites/${siteId}/reprovision`),
  /** Stripe diagnostic: session payment status, payment intent, recent webhook events. */
  getBillingStatus: (siteId: string) => request<{
    orderId: string
    orderStatus: string
    stripeSessionId: string | null
    stripeCustomerId: string | null
    failureReason: string | null
    stripeConfigured?: boolean
    session?: { id: string; paymentStatus: string | null; status: string | null; amountTotal: number | null; currency: string | null; customerEmail: string | null; createdAt: string } | null
    paymentIntent?: { id: string; status: string; amount: number; amountReceived: number; lastPaymentError: string | null } | null
    webhookEvents?: Array<{ id: string; type: string; created: number }>
    canResolve?: boolean
    notes?: string | null
    error?: string
  }>('GET', `/admin/sites/${siteId}/billing-status`),
  /** When Stripe confirms paid but the order never advanced, flip it and enqueue. */
  resolveBilling: (siteId: string) => request<{ ok: true; orderId: string; orderStatus: string }>('POST', `/admin/sites/${siteId}/resolve-billing`),
  /** URL of the cached screenshot PNG for a site. Pass fresh=true to force recapture. */
  screenshotUrl: (siteId: string, fresh = false) => `${PLATFORM_API}/admin/sites/${siteId}/screenshot${fresh ? '?fresh=1' : ''}`,

  // --- Orders / checkout (public) ---
  createOrder: (payload: {
    archetype: 'mesa' | 'hearth' | 'vault' | 'keystone' | 'keystone'
    plan: string
    addOns: string[]
    wizardPayload: Record<string, unknown>
    owner: { email: string; name?: string }
  }) => request<{ orderId: string; checkoutUrl: string | null; dryRun?: boolean }>('POST', '/orders', payload),
  getOrder: (id: string) => request<{ id: string; status: string; siteId?: string; failureReason?: string }>('GET', `/orders/${id}`),

  // --- AI copy assistant (public — wizard uses this without auth) ---
  aiSuggest: (payload: {
    archetype: string
    brand: string
    field: string
    context?: Record<string, string>
  }) => {
    if (!PLATFORM_API) return Promise.resolve({ text: '' })
    return fetch(`${PLATFORM_API}/ai/suggest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).then(r => r.ok ? r.json() as Promise<{ text: string }> : Promise.resolve({ text: '' }))
  },
}
