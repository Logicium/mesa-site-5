<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { contentClient } from '../../platform/contentClient'

const sites = ref<Awaited<ReturnType<typeof contentClient.listSites>>>([])
const loading = ref(false)
const error = ref<string | null>(null)
const showDeactivated = ref(false)
const redeploying = ref<Record<string, boolean>>({})
const redeployMsg = ref<Record<string, string>>({})

// Rename (inline edit of displayName)
const editingName = ref<string | null>(null)
const nameDraft = ref<string>('')
const renaming = ref<Record<string, boolean>>({})

// Deactivate / activate
const deactivating = ref<Record<string, boolean>>({})
const updateStatus = ref<Record<string, { current: string | null; latest: string | null; hasUpdate: boolean; neverChecked?: boolean } | null>>({})
const updateChecking = ref<Record<string, boolean>>({})
const updating = ref<Record<string, boolean>>({})
const updateMsg = ref<Record<string, string>>({})

// Reprovision (force fresh provisioning run for stuck sites)
const reprovisioning = ref<Record<string, boolean>>({})
const reprovisionMsg = ref<Record<string, string>>({})

// Live deployment progress per site (polled from Vercel via the backend)
type DeployPhase = 'QUEUED' | 'INITIALIZING' | 'BUILDING' | 'UPLOADING' | 'DEPLOYING' | 'READY' | 'ERROR' | 'CANCELED' | 'UNKNOWN'
interface DeployProgress {
  state: DeployPhase
  deploymentId: string | null
  startedAt: number
  label: string
  percent: number
  failed: boolean
}
const deployProgress = ref<Record<string, DeployProgress | null>>({})
const deployTimers: Record<string, ReturnType<typeof setTimeout> | null> = {}

const PHASE_LABEL: Record<DeployPhase, string> = {
  QUEUED: 'Queued — waiting for Vercel to pick up the build',
  INITIALIZING: 'Initializing build environment',
  BUILDING: 'Building site (installing deps, compiling)',
  UPLOADING: 'Uploading build output',
  DEPLOYING: 'Deploying to production',
  READY: 'Live ✓',
  ERROR: 'Build failed',
  CANCELED: 'Deployment canceled',
  UNKNOWN: 'Waiting for deployment to start',
}
const PHASE_PERCENT: Record<DeployPhase, number> = {
  UNKNOWN: 5, QUEUED: 10, INITIALIZING: 25, BUILDING: 55, UPLOADING: 80, DEPLOYING: 92, READY: 100, ERROR: 100, CANCELED: 100,
}

function startDeployTracking(
  siteId: string,
  deploymentId: string | null,
  initialLabel = 'Starting…',
  priorDeploymentId: string | null = null,
) {
  // Cancel any previous tracker for this site
  stopDeployTracking(siteId)
  const startedAt = Date.now()
  deployProgress.value[siteId] = {
    state: 'UNKNOWN',
    deploymentId,
    startedAt,
    label: initialLabel,
    percent: 5,
    failed: false,
  }
  const tick = async () => {
    try {
      const status = await contentClient.getDeploymentStatus(siteId, deployProgress.value[siteId]?.deploymentId ?? undefined)
      const state = (status.state || 'UNKNOWN') as DeployPhase
      const prev = deployProgress.value[siteId]
      if (!prev) return

      // Guard against showing READY for a deployment that finished BEFORE the
      // user clicked Update/Redeploy. This happens when the worker hasn't yet
      // triggered the new build, so Vercel returns the previous (already-live)
      // deployment. We only honor READY once Vercel reports a deployment whose
      // id differs from the prior one AND whose createdAt is after startedAt.
      const isStaleDeploy =
        (state === 'READY' || state === 'DEPLOYING' || state === 'UPLOADING') &&
        (
          (priorDeploymentId != null && status.deploymentId === priorDeploymentId) ||
          (status.createdAt != null && status.createdAt < startedAt)
        )

      if (isStaleDeploy) {
        deployProgress.value[siteId] = {
          ...prev,
          state: 'UNKNOWN',
          // Don't latch onto the stale deploymentId — keep polling "latest".
          deploymentId: prev.deploymentId,
          label: 'Waiting for new deployment to start…',
          percent: Math.max(prev.percent, 8),
          failed: false,
        }
        deployTimers[siteId] = setTimeout(tick, 3_000)
        return
      }

      deployProgress.value[siteId] = {
        ...prev,
        state,
        deploymentId: status.deploymentId ?? prev.deploymentId,
        label: PHASE_LABEL[state] ?? state,
        percent: PHASE_PERCENT[state] ?? prev.percent,
        failed: state === 'ERROR' || state === 'CANCELED',
      }
      if (state === 'READY') {
        // Pull a fresh screenshot once the build is live
        void refreshScreenshot(siteId)
        // Refresh the site row so productionUrl/status reflect the new deploy
        try {
          sites.value = await contentClient.listSites()
        } catch { /* non-fatal */ }
        // Linger the READY state briefly, then clear
        deployTimers[siteId] = setTimeout(() => { deployProgress.value[siteId] = null }, 5_000)
        return
      }
      if (state === 'ERROR' || state === 'CANCELED') {
        // Linger longer so the user can read the failure
        deployTimers[siteId] = setTimeout(() => { deployProgress.value[siteId] = null }, 15_000)
        return
      }
      // Stop polling after 10 minutes to avoid runaway timers
      if (Date.now() - prev.startedAt > 10 * 60_000) {
        deployProgress.value[siteId] = null
        return
      }
      deployTimers[siteId] = setTimeout(tick, 3_000)
    } catch {
      // Transient API hiccup — keep polling
      deployTimers[siteId] = setTimeout(tick, 5_000)
    }
  }
  // Small initial delay so Vercel has a moment to register the new deployment
  deployTimers[siteId] = setTimeout(tick, 1_500)
}

function stopDeployTracking(siteId: string) {
  const t = deployTimers[siteId]
  if (t) {
    clearTimeout(t)
    deployTimers[siteId] = null
  }
}

// Billing diagnostic (Stripe webhook resolution)
type BillingInfo = Awaited<ReturnType<typeof contentClient.getBillingStatus>>
const billing = ref<Record<string, BillingInfo | null>>({})
const billingLoading = ref<Record<string, boolean>>({})
const billingOpen = ref<Record<string, boolean>>({})
const billingMsg = ref<Record<string, string>>({})
const resolvingBilling = ref<Record<string, boolean>>({})

// Per-site screenshot refresh state. The screenshot URL itself lives on
// `s.screenshotUrl` (a public Vercel Blob URL the browser can cache); the
// frontend never fetches PNG bytes. We only track whether a manual refresh
// is in flight so the button can show a spinner.
const refreshingScreenshot = ref<Record<string, boolean>>({})
const screenshotErr = ref<Record<string, string | null>>({})

function screenshotSrc(s: { id: string; screenshotUrl?: string | null; screenshotCapturedAt?: string | null }): string | null {
  if (!s.screenshotUrl) return null
  // Cache-bust on capturedAt so a fresh capture replaces the cached image
  // immediately. Without this, the browser would keep showing the previous
  // PNG until its own cache TTL expires.
  const v = s.screenshotCapturedAt ? encodeURIComponent(s.screenshotCapturedAt) : Date.now().toString()
  return `${s.screenshotUrl}?v=${v}`
}

function screenshotAgeLabel(s: { screenshotCapturedAt?: string | null }): string {
  if (!s.screenshotCapturedAt) return ''
  const ms = Date.now() - new Date(s.screenshotCapturedAt).getTime()
  const days = Math.floor(ms / 86_400_000)
  if (days <= 0) {
    const hours = Math.floor(ms / 3_600_000)
    if (hours <= 0) return 'just now'
    return `${hours}h ago`
  }
  if (days === 1) return '1 day ago'
  return `${days} days ago`
}

async function refreshScreenshot(siteId: string) {
  refreshingScreenshot.value[siteId] = true
  screenshotErr.value[siteId] = null
  try {
    const r = await contentClient.refreshScreenshot(siteId)
    if (r.error) {
      screenshotErr.value[siteId] = r.error
      return
    }
    const idx = sites.value.findIndex(x => x.id === siteId)
    if (idx >= 0) {
      sites.value[idx] = {
        ...sites.value[idx]!,
        screenshotUrl: r.url,
        screenshotCapturedAt: r.capturedAt,
      }
    }
  } catch (e) {
    screenshotErr.value[siteId] = e instanceof Error ? e.message : String(e)
  } finally {
    refreshingScreenshot.value[siteId] = false
  }
}

async function redeploy(siteId: string) {
  redeploying.value[siteId] = true
  redeployMsg.value[siteId] = ''
  // Snapshot the currently-live deployment so the tracker can ignore it and
  // wait for the genuinely new deployment to land before showing READY.
  let priorId: string | null = null
  try {
    const cur = await contentClient.getDeploymentStatus(siteId)
    priorId = cur.deploymentId
  } catch { /* non-fatal */ }
  try {
    const r = await contentClient.redeploySite(siteId)
    redeployMsg.value[siteId] = `Triggered (${r.deploymentId.slice(0, 12)}\u2026)`
    startDeployTracking(siteId, r.deploymentId, 'Redeploy queued', priorId)
  } catch (e) {
    redeployMsg.value[siteId] = e instanceof Error ? e.message : String(e)
  } finally {
    redeploying.value[siteId] = false
  }
}

async function checkUpdate(siteId: string) {
  updateChecking.value[siteId] = true
  updateMsg.value[siteId] = ''
  try {
    updateStatus.value[siteId] = await contentClient.getUpdateStatus(siteId)
  } catch (e) {
    updateMsg.value[siteId] = e instanceof Error ? e.message : String(e)
  } finally {
    updateChecking.value[siteId] = false
  }
}

async function updateNow(siteId: string) {
  updating.value[siteId] = true
  updateMsg.value[siteId] = ''
  // Snapshot the latest deployment so the tracker knows to ignore it while the
  // worker is still syncing template files into the repo. Without this guard
  // the poller sees the previous READY deployment and reports "Live" instantly.
  let priorId: string | null = null
  try {
    const cur = await contentClient.getDeploymentStatus(siteId)
    priorId = cur.deploymentId
  } catch { /* non-fatal */ }
  try {
    const r = await contentClient.updateSite(siteId)
    updateMsg.value[siteId] = `Update queued (${r.jobId})`
    // Update is async (worker syncs template files then redeploys). Start tracking;
    // the poller will discover the new deployment id on its first non-stale tick.
    startDeployTracking(siteId, null, 'Syncing template files\u2026', priorId)
  } catch (e) {
    updateMsg.value[siteId] = e instanceof Error ? e.message : String(e)
  } finally {
    updating.value[siteId] = false
  }
}

async function reprovision(siteId: string) {
  reprovisioning.value[siteId] = true
  reprovisionMsg.value[siteId] = ''
  try {
    const r = await contentClient.reprovisionSite(siteId)
    reprovisionMsg.value[siteId] = `Reprovisioning queued (order ${r.orderId.slice(0, 8)}\u2026)`
    // The new deploy will produce a new URL; clear the current screenshot URL
    // locally so the placeholder shows until the post-READY auto-refresh
    // captures the new site. The backend keeps the old blob until then.
    const idx = sites.value.findIndex(x => x.id === siteId)
    if (idx >= 0) {
      sites.value[idx] = { ...sites.value[idx]!, screenshotUrl: null, screenshotCapturedAt: null }
    }
    // Track the new deployment as soon as the provisioning processor creates it.
    // The tracker auto-refreshes the screenshot when the build reaches READY.
    startDeployTracking(siteId, null, 'Reprovisioning \u2014 creating repo + Vercel project\u2026')
  } catch (e) {
    reprovisionMsg.value[siteId] = e instanceof Error ? e.message : String(e)
  } finally {
    reprovisioning.value[siteId] = false
  }
}

async function toggleBilling(siteId: string) {
  billingOpen.value[siteId] = !billingOpen.value[siteId]
  if (!billingOpen.value[siteId]) return
  if (billing.value[siteId]) return
  billingLoading.value[siteId] = true
  billingMsg.value[siteId] = ''
  try {
    billing.value[siteId] = await contentClient.getBillingStatus(siteId)
  } catch (e) {
    billingMsg.value[siteId] = e instanceof Error ? e.message : String(e)
  } finally {
    billingLoading.value[siteId] = false
  }
}

async function refreshBilling(siteId: string) {
  billingLoading.value[siteId] = true
  billingMsg.value[siteId] = ''
  try {
    billing.value[siteId] = await contentClient.getBillingStatus(siteId)
  } catch (e) {
    billingMsg.value[siteId] = e instanceof Error ? e.message : String(e)
  } finally {
    billingLoading.value[siteId] = false
  }
}

async function resolveBilling(siteId: string) {
  resolvingBilling.value[siteId] = true
  billingMsg.value[siteId] = ''
  try {
    const r = await contentClient.resolveBilling(siteId)
    billingMsg.value[siteId] = `Marked paid (${r.orderStatus}) \u2014 provisioning queued`
    // Refresh diagnostics so the canResolve flag clears
    billing.value[siteId] = await contentClient.getBillingStatus(siteId).catch(() => billing.value[siteId] ?? null)
  } catch (e) {
    billingMsg.value[siteId] = e instanceof Error ? e.message : String(e)
  } finally {
    resolvingBilling.value[siteId] = false
  }
}

function formatMoney(amount: number | null | undefined, currency: string | null | undefined) {
  if (amount == null || !currency) return ''
  try { return new Intl.NumberFormat(undefined, { style: 'currency', currency: currency.toUpperCase() }).format(amount / 100) }
  catch { return `${(amount / 100).toFixed(2)} ${currency.toUpperCase()}` }
}

function siteTitle(s: { slug: string; displayName?: string | null }) {
  return (s.displayName && s.displayName.trim()) || s.slug
}

function startRename(s: { id: string; slug: string; displayName?: string | null }) {
  editingName.value = s.id
  nameDraft.value = siteTitle(s)
}

function cancelRename() {
  editingName.value = null
  nameDraft.value = ''
}

async function saveRename(siteId: string) {
  renaming.value[siteId] = true
  try {
    const r = await contentClient.renameSite(siteId, nameDraft.value.trim())
    const idx = sites.value.findIndex(x => x.id === siteId)
    if (idx >= 0) sites.value[idx] = { ...sites.value[idx]!, displayName: r.displayName }
    editingName.value = null
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
  } finally {
    renaming.value[siteId] = false
  }
}

async function reloadSites() {
  sites.value = await contentClient.listSites({ includeDeactivated: showDeactivated.value })
}

async function toggleShowDeactivated() {
  showDeactivated.value = !showDeactivated.value
  try { await reloadSites() } catch (e) { error.value = e instanceof Error ? e.message : String(e) }
}

async function confirmDeactivate(s: { id: string; slug: string; displayName?: string | null }) {
  const name = siteTitle(s)
  if (!confirm(`Deactivate “${name}”?\n\nThe site stays online for visitors but is hidden from the admin list. You can reactivate it later from “Show deactivated.”`)) return
  deactivating.value[s.id] = true
  try {
    await contentClient.deactivateSite(s.id)
    await reloadSites()
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
  } finally {
    deactivating.value[s.id] = false
  }
}

async function confirmActivate(s: { id: string }) {
  deactivating.value[s.id] = true
  try {
    await contentClient.activateSite(s.id)
    await reloadSites()
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
  } finally {
    deactivating.value[s.id] = false
  }
}

function formatTimestamp(unixSec: number) {
  try { return new Date(unixSec * 1000).toLocaleString() } catch { return String(unixSec) }
}

function formatElapsed(startedAt: number) {
  const s = Math.max(0, Math.round((Date.now() - startedAt) / 1000))
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  return `${m}m ${s % 60}s`
}

function isStuck(status: string) {
  const s = status.toLowerCase()
  return s === 'provisioning' || s === 'failed' || s === 'pending' || s === 'draft'
}

onMounted(async () => {
  loading.value = true
  try {
    sites.value = await contentClient.listSites({ includeDeactivated: showDeactivated.value })
    for (const s of sites.value) {
      if (liveUrl(s)) {
        void checkUpdate(s.id)
      }
    }
  }
  catch (e) { error.value = e instanceof Error ? e.message : String(e) }
  finally { loading.value = false }
})

function liveUrl(s: { customDomain?: string; productionUrl?: string }) {
  return s.customDomain ? `https://${s.customDomain}` : s.productionUrl ?? ''
}
function displayHost(url: string) {
  try { return new URL(url).host } catch { return url.replace(/^https?:\/\//, '') }
}

function statusClass(status: string) {
  const s = status.toLowerCase()
  if (s === 'live' || s === 'ready') return 'adm-badge--live'
  if (s === 'failed') return 'adm-badge--failed'
  if (s === 'provisioning' || s === 'pending' || s === 'queued' || s === 'building') return 'adm-badge--pending'
  return 'adm-badge--info'
}

const liveCount = computed(() => sites.value.filter(s => liveUrl(s)).length)
</script>

<template>
  <section class="adm-page">
    <header class="adm-page__head">
      <div class="adm-page__title-block">
        <span class="adm-eyebrow">Studio</span>
        <h1 class="adm-title">Your sites</h1>
        <p class="adm-subtitle">
          <template v-if="loading">Loading…</template>
          <template v-else-if="!sites.length">Nothing here yet — your first site will appear once it’s provisioned.</template>
          <template v-else>{{ liveCount }} of {{ sites.length }} live · click a card to open it in a new tab.</template>
        </p>
      </div>
      <div class="adm-page__head-actions">
        <button type="button" class="adm-btn adm-btn--sm adm-btn--ghost" @click="toggleShowDeactivated">
          {{ showDeactivated ? 'Hide deactivated' : 'Show deactivated' }}
        </button>
      </div>
    </header>

    <p v-if="error" class="adm-msg-err">{{ error }}</p>

    <div v-if="sites.length" class="site-grid">
      <article v-for="s in sites" :key="s.id" class="site-card" :class="{ 'site-card--deactivated': !!s.deactivatedAt }">
        <a
          v-if="liveUrl(s)"
          :href="liveUrl(s)"
          target="_blank"
          rel="noopener"
          class="site-card__preview"
          :title="`Open ${s.slug} in a new tab`"
        >
          <img
            v-if="screenshotSrc(s)"
            :src="screenshotSrc(s)!"
            :alt="`${s.slug} preview`"
          />
          <div v-else-if="screenshotErr[s.id]" class="site-card__placeholder">
            <span>Preview unavailable</span>
          </div>
          <div v-else class="site-card__placeholder">
            <span>No screenshot yet</span>
          </div>
          <span class="site-card__open-hint">Open ↗</span>
        </a>
        <div v-else class="site-card__preview site-card__preview--empty">
          <div class="site-card__placeholder"><span>Not deployed</span></div>
        </div>

        <div class="site-card__body">
          <div class="site-card__top">
            <span class="adm-eyebrow">{{ s.archetype }}</span>
            <span v-if="s.deactivatedAt" class="adm-badge adm-badge--info">deactivated</span>
            <span v-else class="adm-badge" :class="statusClass(s.status)">{{ s.status }}</span>
          </div>
          <div v-if="editingName === s.id" class="site-card__rename">
            <input
              v-model="nameDraft"
              class="adm-input"
              type="text"
              maxlength="80"
              placeholder="Business name"
              @keyup.enter="saveRename(s.id)"
              @keyup.esc="cancelRename"
            />
            <button type="button" class="adm-btn adm-btn--sm adm-btn--primary" :disabled="renaming[s.id]" @click="saveRename(s.id)">{{ renaming[s.id] ? 'Saving…' : 'Save' }}</button>
            <button type="button" class="adm-btn adm-btn--sm adm-btn--ghost" @click="cancelRename">Cancel</button>
          </div>
          <h2 v-else class="site-card__title">
            {{ siteTitle(s) }}
            <button type="button" class="site-card__rename-btn" title="Rename" @click="startRename(s)">✏</button>
          </h2>
          <p v-if="s.displayName && s.displayName !== s.slug" class="adm-subtle site-card__slug">{{ s.slug }}</p>
          <a v-if="liveUrl(s)" :href="liveUrl(s)" target="_blank" rel="noopener" class="adm-link site-card__url">
            {{ displayHost(liveUrl(s)) }}
          </a>
          <span v-else class="adm-subtle">No URL yet</span>

          <div class="site-card__update">
            <template v-if="liveUrl(s)">
              <span v-if="updateChecking[s.id]" class="adm-muted">Checking for updates…</span>
              <template v-else-if="updateStatus[s.id]">
                <span v-if="updateStatus[s.id]!.hasUpdate" class="adm-msg-warn">● Update available</span>
                <span v-else-if="updateStatus[s.id]!.neverChecked" class="adm-muted">● Status unknown</span>
                <span v-else class="adm-msg-ok">● Up to date</span>
              </template>
            </template>
          </div>

          <div class="site-card__actions">
            <button
              v-if="liveUrl(s)"
              type="button" class="adm-btn adm-btn--sm"
              :disabled="updateChecking[s.id]"
              @click="checkUpdate(s.id)"
            >Check</button>
            <button
              v-if="liveUrl(s) && (updateStatus[s.id]?.hasUpdate || updateStatus[s.id]?.neverChecked)"
              type="button" class="adm-btn adm-btn--sm adm-btn--primary"
              :disabled="updating[s.id]"
              @click="updateNow(s.id)"
            >{{ updating[s.id] ? 'Queuing…' : 'Update' }}</button>
            <button
              v-if="liveUrl(s)"
              type="button" class="adm-btn adm-btn--sm"
              :disabled="redeploying[s.id]"
              @click="redeploy(s.id)"
            >{{ redeploying[s.id] ? 'Triggering…' : 'Redeploy' }}</button>
            <button
              v-if="liveUrl(s)"
              type="button" class="adm-btn adm-btn--sm adm-btn--ghost"
              :disabled="refreshingScreenshot[s.id]"
              :title="s.screenshotCapturedAt ? `Last captured ${screenshotAgeLabel(s)}` : 'No screenshot yet'"
              @click="refreshScreenshot(s.id)"
            >{{ refreshingScreenshot[s.id] ? 'Capturing…' : '⟳ Screenshot' }}<span v-if="s.screenshotCapturedAt && !refreshingScreenshot[s.id]" class="site-card__screenshot-age"> · {{ screenshotAgeLabel(s) }}</span></button>
            <button
              v-if="isStuck(s.status)"
              type="button" class="adm-btn adm-btn--sm adm-btn--primary"
              :disabled="reprovisioning[s.id]"
              :title="'Force a fresh provisioning run (idempotent)'"
              @click="reprovision(s.id)"
            >{{ reprovisioning[s.id] ? 'Queuing…' : 'Reprovision' }}</button>
            <button
              type="button" class="adm-btn adm-btn--sm adm-btn--ghost"
              :title="'Check Stripe payment + webhook status'"
              @click="toggleBilling(s.id)"
            >{{ billingOpen[s.id] ? '× Billing' : 'Check billing' }}</button>
            <button
              v-if="!s.deactivatedAt"
              type="button" class="adm-btn adm-btn--sm adm-btn--ghost site-card__deactivate"
              :disabled="deactivating[s.id]"
              :title="'Hide from admin (keeps Vercel project + repo intact)'"
              @click="confirmDeactivate(s)"
            >{{ deactivating[s.id] ? '…' : 'Deactivate' }}</button>
            <button
              v-else
              type="button" class="adm-btn adm-btn--sm adm-btn--primary"
              :disabled="deactivating[s.id]"
              @click="confirmActivate(s)"
            >{{ deactivating[s.id] ? '…' : 'Reactivate' }}</button>
          </div>

          <p v-if="redeployMsg[s.id]" class="adm-muted site-card__msg">{{ redeployMsg[s.id] }}</p>
          <p v-if="updateMsg[s.id]" class="adm-muted site-card__msg">{{ updateMsg[s.id] }}</p>
          <p v-if="reprovisionMsg[s.id]" class="adm-muted site-card__msg">{{ reprovisionMsg[s.id] }}</p>

          <div
            v-if="deployProgress[s.id]"
            class="site-card__deploy"
            :class="{
              'site-card__deploy--ok': deployProgress[s.id]!.state === 'READY',
              'site-card__deploy--err': deployProgress[s.id]!.failed,
            }"
          >
            <div class="site-card__deploy-head">
              <span class="site-card__deploy-phase">{{ deployProgress[s.id]!.label }}</span>
              <span class="site-card__deploy-elapsed">{{ formatElapsed(deployProgress[s.id]!.startedAt) }}</span>
            </div>
            <div class="site-card__deploy-bar" role="progressbar" :aria-valuenow="deployProgress[s.id]!.percent" aria-valuemin="0" aria-valuemax="100">
              <div
                class="site-card__deploy-fill"
                :class="{ 'site-card__deploy-fill--indeterminate': !deployProgress[s.id]!.failed && deployProgress[s.id]!.state !== 'READY' }"
                :style="{ width: `${deployProgress[s.id]!.percent}%` }"
              ></div>
            </div>
            <div v-if="deployProgress[s.id]!.deploymentId" class="adm-muted adm-mono site-card__deploy-id">
              deploy {{ deployProgress[s.id]!.deploymentId!.slice(0, 16) }}…
            </div>
          </div>

          <div v-if="billingOpen[s.id]" class="site-card__billing">
            <div class="site-card__billing-head">
              <strong>Billing diagnostic</strong>
              <button type="button" class="adm-btn adm-btn--sm adm-btn--ghost" :disabled="billingLoading[s.id]" @click="refreshBilling(s.id)">⟳</button>
            </div>
            <p v-if="billingLoading[s.id]" class="adm-muted">Loading Stripe data…</p>
            <p v-if="billingMsg[s.id]" class="adm-muted">{{ billingMsg[s.id] }}</p>
            <template v-if="billing[s.id]">
              <dl class="bill-grid">
                <dt>Order status</dt><dd>{{ billing[s.id]!.orderStatus }}</dd>
                <dt>Stripe session</dt><dd>{{ billing[s.id]!.stripeSessionId || '—' }}</dd>
                <template v-if="billing[s.id]!.session">
                  <dt>Payment status</dt><dd>{{ billing[s.id]!.session!.paymentStatus || '—' }}</dd>
                  <dt>Amount</dt><dd>{{ formatMoney(billing[s.id]!.session!.amountTotal, billing[s.id]!.session!.currency) || '—' }}</dd>
                  <dt>Created</dt><dd>{{ billing[s.id]!.session!.createdAt }}</dd>
                </template>
                <template v-if="billing[s.id]!.paymentIntent">
                  <dt>Payment intent</dt><dd>{{ billing[s.id]!.paymentIntent!.status }}</dd>
                  <dt v-if="billing[s.id]!.paymentIntent!.lastPaymentError">Last error</dt>
                  <dd v-if="billing[s.id]!.paymentIntent!.lastPaymentError" class="adm-msg-err">
                    {{ billing[s.id]!.paymentIntent!.lastPaymentError }}
                  </dd>
                </template>
                <dt>Webhook events</dt>
                <dd>
                  <template v-if="billing[s.id]!.webhookEvents?.length">
                    <div v-for="ev in billing[s.id]!.webhookEvents" :key="ev.id" class="adm-mono">
                      {{ ev.type }} · {{ formatTimestamp(ev.created) }}
                    </div>
                  </template>
                  <span v-else class="adm-msg-warn">No checkout.session.completed event found — webhook likely never fired.</span>
                </dd>
                <template v-if="billing[s.id]!.failureReason">
                  <dt>Failure</dt><dd class="adm-msg-err">{{ billing[s.id]!.failureReason }}</dd>
                </template>
              </dl>
              <p v-if="billing[s.id]!.notes" class="adm-msg-warn">{{ billing[s.id]!.notes }}</p>
              <p v-if="billing[s.id]!.error" class="adm-msg-err">{{ billing[s.id]!.error }}</p>
              <div v-if="billing[s.id]!.canResolve" class="site-card__billing-actions">
                <button
                  type="button" class="adm-btn adm-btn--sm adm-btn--primary"
                  :disabled="resolvingBilling[s.id]"
                  @click="resolveBilling(s.id)"
                >{{ resolvingBilling[s.id] ? 'Resolving…' : 'Mark paid & provision' }}</button>
              </div>
            </template>
          </div>
        </div>
      </article>
    </div>

    <div v-else-if="!loading && !error" class="adm-empty">
      <div class="adm-empty__icon">◇</div>
      <h2 class="adm-empty__title">No sites yet</h2>
      <p class="adm-empty__body">Your sites will appear here as they finish provisioning.</p>
    </div>
  </section>
</template>

<style scoped>
.site-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 1.5rem;
}

.site-card {
  display: flex; flex-direction: column;
  background: var(--adm-surface);
  border: 1px solid var(--adm-border);
  border-radius: var(--adm-radius-lg);
  overflow: hidden;
  box-shadow: var(--adm-shadow);
  transition: transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease;
}
.site-card:hover {
  transform: translateY(-2px);
  border-color: var(--adm-accent-deep);
  box-shadow: var(--adm-shadow-lg);
}

.site-card__preview {
  position: relative; display: block;
  aspect-ratio: 16 / 10;
  background: var(--adm-surface-2);
  overflow: hidden;
  border-bottom: 1px solid var(--adm-border);
}
.site-card__preview img {
  width: 100%; height: 100%; object-fit: cover; display: block;
  transition: transform 600ms ease;
}
.site-card:hover .site-card__preview img { transform: scale(1.03); }

.site-card__placeholder {
  position: absolute; inset: 0;
  display: grid; place-items: center;
  background: var(--adm-surface-2);
  color: var(--adm-text-subtle);
  font-size: 0.85rem; letter-spacing: 0.05em;
}
.site-card__preview--empty { pointer-events: none; }

.site-card__open-hint {
  position: absolute; top: 0.6rem; right: 0.6rem;
  padding: 0.25rem 0.55rem;
  background: rgba(10,11,13,0.7);
  border: 1px solid var(--adm-border-strong);
  color: var(--adm-text);
  font-size: 0.72rem; font-weight: 600; letter-spacing: 0.05em;
  border-radius: 999px;
  opacity: 0; transition: opacity 180ms;
  backdrop-filter: blur(6px);
}
.site-card__preview:hover .site-card__open-hint { opacity: 1; }

.site-card__body {
  padding: 1rem 1.1rem 1.1rem;
  display: flex; flex-direction: column; gap: 0.4rem;
}
.site-card__top { display: flex; justify-content: space-between; align-items: center; }

.site-card__title {
  font-family: var(--adm-font-serif);
  font-size: 1.5rem; font-weight: 500;
  letter-spacing: -0.01em; line-height: 1.1;
  margin: 0.1rem 0 0;
  color: var(--adm-text);
  display: inline-flex; align-items: baseline; gap: 0.4rem;
}
.site-card__rename-btn {
  background: none; border: none; padding: 0.1rem 0.3rem;
  color: var(--adm-text-muted); cursor: pointer;
  font-size: 0.9rem; line-height: 1;
  border-radius: 4px;
}
.site-card__rename-btn:hover { color: var(--adm-accent); background: var(--adm-surface-2); }
.site-card__rename { display: flex; gap: 0.35rem; align-items: stretch; margin-top: 0.2rem; }
.site-card__rename .adm-input { flex: 1; }
.site-card__slug { font-size: 0.78rem; margin: 0; }
.site-card--deactivated { opacity: 0.65; filter: grayscale(0.4); }
.site-card__deactivate { margin-left: auto; }
.site-card__url {
  font-size: 0.82rem; word-break: break-all;
}
.site-card__update { font-size: 0.78rem; margin-top: 0.25rem; min-height: 1.1em; }
.site-card__actions { display: flex; flex-wrap: wrap; gap: 0.4rem; margin-top: 0.6rem; }
.site-card__msg { font-size: 0.78rem; margin: 0.3rem 0 0; }

.site-card__placeholder--loading {
  background: var(--adm-surface-2);
}
.site-card__spinner {
  display: block;
  width: 28px; height: 28px;
  border: 2px solid color-mix(in srgb, var(--adm-accent) 30%, transparent);
  border-top-color: var(--adm-accent);
  border-radius: 50%;
  animation: sc-spin 900ms linear infinite;
}
@keyframes sc-spin { to { transform: rotate(360deg); } }

.site-card__billing {
  margin-top: 0.75rem;
  padding: 0.75rem 0.85rem;
  background: var(--adm-surface-2);
  border: 1px solid var(--adm-border);
  border-radius: var(--adm-radius);
  font-size: 0.82rem;
  display: flex; flex-direction: column; gap: 0.5rem;
}
.site-card__billing-head {
  display: flex; justify-content: space-between; align-items: center;
}
.site-card__billing-actions {
  display: flex; justify-content: flex-end; margin-top: 0.4rem;
}
.bill-grid {
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: 0.25rem 0.8rem;
  margin: 0;
}
.bill-grid dt { color: var(--adm-text-muted); }
.bill-grid dd { margin: 0; word-break: break-all; }
.adm-mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 0.78rem; }

.site-card__deploy {
  margin-top: 0.6rem;
  padding: 0.55rem 0.7rem;
  background: var(--adm-surface-2);
  border: 1px solid var(--adm-border);
  border-radius: var(--adm-radius);
  display: flex; flex-direction: column; gap: 0.35rem;
}
.site-card__deploy--ok { border-color: color-mix(in srgb, #16a34a 50%, var(--adm-border)); }
.site-card__deploy--err { border-color: color-mix(in srgb, #dc2626 60%, var(--adm-border)); }
.site-card__deploy-head {
  display: flex; justify-content: space-between; align-items: baseline;
  font-size: 0.82rem;
}
.site-card__deploy-phase { font-weight: 500; }
.site-card__deploy-elapsed { color: var(--adm-text-muted); font-variant-numeric: tabular-nums; }
.site-card__deploy-bar {
  height: 6px; width: 100%;
  background: color-mix(in srgb, var(--adm-border) 60%, transparent);
  border-radius: 999px; overflow: hidden; position: relative;
}
.site-card__deploy-fill {
  height: 100%;
  background: var(--adm-accent);
  border-radius: 999px;
  transition: width 600ms ease;
}
.site-card__deploy--ok .site-card__deploy-fill { background: #16a34a; }
.site-card__deploy--err .site-card__deploy-fill { background: #dc2626; }
.site-card__deploy-fill--indeterminate {
  background: linear-gradient(90deg, var(--adm-accent) 0%, color-mix(in srgb, var(--adm-accent) 40%, transparent) 50%, var(--adm-accent) 100%);
  background-size: 200% 100%;
  animation: sc-deploy-shimmer 1600ms linear infinite;
}
@keyframes sc-deploy-shimmer { from { background-position: 200% 0; } to { background-position: -200% 0; } }
.site-card__deploy-id { font-size: 0.7rem; }
</style>
