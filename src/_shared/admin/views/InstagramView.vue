<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { contentClient } from '../../platform/contentClient'
import { useActiveSiteStore } from '../../platform/activeSiteStore'

const activeSites = useActiveSiteStore()
const siteId = computed(() => activeSites.activeId)
const connectUrl = ref<string | null>(null)
const error = ref<string | null>(null)
const notConfigured = ref(false)
const loading = ref(false)

async function loadConnect() {
  if (!siteId.value) return
  loading.value = true
  error.value = null
  notConfigured.value = false
  connectUrl.value = null
  try {
    connectUrl.value = (await contentClient.getInstagramConnect(siteId.value)).url
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    // Detect "Instagram not configured" — service returns 400 when the
    // FB_APP_ID/SECRET environment isn't set.
    if (/not configured/i.test(msg) || /400/.test(msg)) {
      notConfigured.value = true
    } else {
      error.value = msg
    }
  } finally {
    loading.value = false
  }
}
async function disconnect() {
  if (!siteId.value) return
  await contentClient.disconnectInstagram(siteId.value)
  await loadConnect()
}
onMounted(loadConnect)
watch(siteId, loadConnect)
</script>

<template>
  <section class="adm-page">
    <header class="adm-page__head">
      <div class="adm-page__title-block">
        <span class="adm-eyebrow">Social</span>
        <h1 class="adm-title">Instagram</h1>
        <p class="adm-subtitle">Pull your latest posts directly into your gallery — no manual uploads.</p>
      </div>
    </header>

    <div v-if="!siteId" class="adm-empty">
      <div class="adm-empty__icon">⌗</div>
      <h2 class="adm-empty__title">No active site</h2>
      <p class="adm-empty__body">Select a site from the header dropdown to manage its Instagram connection.</p>
    </div>

    <!-- Coming soon (no FB app credentials) -->
    <div v-else-if="notConfigured" class="ig-soon">
      <div class="ig-soon__inner">
        <div class="ig-soon__mark" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="5" />
            <circle cx="12" cy="12" r="4" />
            <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
          </svg>
        </div>
        <span class="adm-eyebrow">Coming soon</span>
        <h2 class="ig-soon__title">Instagram sync is on the way</h2>
        <p class="ig-soon__body">
          We’re finalising our partnership with Meta so you can connect your account in one click.
          In the meantime, you can upload photos directly in the Content section.
        </p>
        <div class="ig-soon__list">
          <div class="ig-soon__row">
            <span class="ig-soon__dot" />
            <div>
              <strong>One-click connect</strong>
              <p>Authenticate with your Instagram Business account in seconds.</p>
            </div>
          </div>
          <div class="ig-soon__row">
            <span class="ig-soon__dot" />
            <div>
              <strong>Auto-refresh feed</strong>
              <p>New posts appear in your gallery within minutes — no re-deploy needed.</p>
            </div>
          </div>
          <div class="ig-soon__row">
            <span class="ig-soon__dot" />
            <div>
              <strong>Curate what shows</strong>
              <p>Hide individual posts or filter by hashtag from the Content editor.</p>
            </div>
          </div>
        </div>
        <RouterLink to="/admin/content" class="adm-btn adm-btn--primary">Upload photos manually</RouterLink>
      </div>
    </div>

    <!-- Normal connect/disconnect -->
    <template v-else>
      <div class="adm-card">
        <h3 class="adm-card__title">Connect your account</h3>
        <p class="adm-card__sub">Authorise Apotome to read your posts. We only fetch media, never publish.</p>
        <div class="ig-actions">
          <a v-if="connectUrl" :href="connectUrl" class="adm-btn adm-btn--primary">Connect Instagram</a>
          <button type="button" class="adm-btn" @click="disconnect">Disconnect</button>
          <span v-if="loading" class="adm-muted">Loading…</span>
        </div>
        <p v-if="error" class="adm-msg-err">{{ error }}</p>
      </div>
    </template>
  </section>
</template>

<style scoped>
.ig-actions { display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap; }

.ig-soon {
  background: var(--adm-surface);
  border: 1px solid var(--adm-border);
  border-radius: var(--adm-radius-lg);
  padding: 3rem 2rem;
  position: relative; overflow: hidden;
  box-shadow: var(--adm-shadow);
}
.ig-soon::before {
  content: ''; position: absolute; inset: 0;
  background:
    radial-gradient(600px 300px at 80% -10%, rgba(196,164,124,0.10), transparent 60%),
    radial-gradient(500px 250px at 0% 110%, rgba(122,162,247,0.08), transparent 60%);
  pointer-events: none;
}
.ig-soon__inner {
  position: relative;
  max-width: 580px; margin: 0 auto;
  display: flex; flex-direction: column; gap: 0.6rem; align-items: flex-start;
}
.ig-soon__mark {
  width: 58px; height: 58px; border-radius: 14px;
  display: grid; place-items: center;
  background: linear-gradient(140deg, var(--adm-accent) 0%, var(--adm-accent-deep) 100%);
  color: var(--adm-on-accent);
  box-shadow: 0 6px 16px rgba(0,0,0,0.4);
  margin-bottom: 0.4rem;
}
.ig-soon__title {
  font-family: var(--adm-font-serif);
  font-size: clamp(1.6rem, 2.2vw, 2.1rem);
  font-weight: 500; letter-spacing: -0.01em;
  margin: 0.2rem 0 0.3rem;
}
.ig-soon__body { color: var(--adm-text-muted); margin: 0 0 1.25rem; max-width: 52ch; }
.ig-soon__list {
  display: flex; flex-direction: column; gap: 0.9rem;
  width: 100%; margin: 0.5rem 0 1.5rem;
}
.ig-soon__row { display: flex; gap: 0.75rem; align-items: flex-start; }
.ig-soon__dot {
  flex: 0 0 6px; height: 6px; margin-top: 0.55rem;
  border-radius: 50%; background: var(--adm-accent);
}
.ig-soon__row strong { color: var(--adm-text); font-weight: 600; font-size: 0.95rem; }
.ig-soon__row p { color: var(--adm-text-muted); margin: 0.15rem 0 0; font-size: 0.88rem; }
</style>
