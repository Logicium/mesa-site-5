<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { contentClient, type GooglePlacePreview } from '../../platform/contentClient'
import { useActiveSiteStore } from '../../platform/activeSiteStore'

const activeSites = useActiveSiteStore()
const siteId = computed(() => activeSites.activeId)

type Candidate = { placeId: string; name: string; address: string; rating: number | null; totalRatings: number | null }

const loading = ref(false)
const error = ref<string | null>(null)
const status = ref('')

const connected = ref<{ placeId: string; preview: GooglePlacePreview | null } | null>(null)
const savedReviews = ref<Array<{ id: string; rating: number; author: string; text: string; source: string; fetchedAt: string }>>([])

const query = ref('')
const searching = ref(false)
const results = ref<Candidate[]>([])
let searchSeq = 0
let searchTimer: number | null = null

async function loadConnection() {
  if (!siteId.value) { connected.value = null; savedReviews.value = []; return }
  // Reset before fetching so a slow request never shows the previous site's data.
  connected.value = null
  savedReviews.value = []
  results.value = []
  query.value = ''
  status.value = ''
  loading.value = true
  error.value = null
  try {
    const place = await contentClient.getGooglePlace(siteId.value)
    connected.value = place.placeId ? { placeId: place.placeId, preview: place.preview } : null
    savedReviews.value = await contentClient.listAdminReviews(siteId.value).catch(() => [])
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
  } finally {
    loading.value = false
  }
}

function scheduleSearch() {
  if (searchTimer) window.clearTimeout(searchTimer)
  searchTimer = window.setTimeout(runSearch, 280)
}

async function runSearch() {
  if (!siteId.value) return
  const q = query.value.trim()
  if (q.length < 2) { results.value = []; searching.value = false; return }
  const mySeq = ++searchSeq
  searching.value = true
  try {
    const res = await contentClient.searchGooglePlaces(siteId.value, q)
    if (mySeq !== searchSeq) return
    results.value = res.results
  } catch (e) {
    if (mySeq !== searchSeq) return
    error.value = e instanceof Error ? e.message : String(e)
  } finally {
    if (mySeq === searchSeq) searching.value = false
  }
}

async function pickPlace(c: Candidate) {
  if (!siteId.value) return
  status.value = ''
  error.value = null
  loading.value = true
  try {
    const res = await contentClient.setGooglePlace(siteId.value, c.placeId)
    connected.value = { placeId: res.placeId, preview: res.preview }
    savedReviews.value = await contentClient.listAdminReviews(siteId.value).catch(() => [])
    status.value = `Connected to ${c.name}. Reviews refresh hourly.`
    query.value = ''
    results.value = []
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
  } finally {
    loading.value = false
  }
}

async function disconnect() {
  if (!siteId.value || !connected.value) return
  if (!confirm('Disconnect this Google Business listing? Reviews will stop refreshing.')) return
  status.value = ''
  error.value = null
  loading.value = true
  try {
    await contentClient.disconnectGooglePlace(siteId.value)
    connected.value = null
    savedReviews.value = []
    status.value = 'Disconnected.'
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
  } finally {
    loading.value = false
  }
}

const mapEmbedUrl = computed(() => {
  if (!connected.value) return null
  return `https://www.google.com/maps?q=place_id:${encodeURIComponent(connected.value.placeId)}&output=embed`
})

function stars(rating: number) {
  const full = Math.round(rating)
  return '★★★★★'.slice(0, full) + '☆☆☆☆☆'.slice(0, 5 - full)
}

onMounted(loadConnection)
watch(siteId, loadConnection)
</script>

<template>
  <section class="adm-page">
    <header class="adm-page__head">
      <div class="adm-page__title-block">
        <span class="adm-eyebrow">Reputation</span>
        <h1 class="adm-title">Google Reviews</h1>
        <p class="adm-subtitle">Pull live ratings and reviews from your Google Business Profile.</p>
      </div>
    </header>

    <div v-if="!siteId" class="adm-empty">
      <div class="adm-empty__icon">⌗</div>
      <h2 class="adm-empty__title">No active site</h2>
      <p class="adm-empty__body">Select a site from the header to manage its Google reviews.</p>
    </div>

    <template v-else>
      <div v-if="connected" class="rv-connected">
        <div class="rv-card rv-summary">
          <div class="rv-summary__head">
            <div class="rv-brand">
              <span class="rv-brand__logo" aria-hidden="true">
                <svg viewBox="0 0 48 48" width="22" height="22">
                  <path fill="#4285F4" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8a12 12 0 1 1 0-24c3.1 0 5.9 1.2 8 3.1l5.7-5.7A20 20 0 0 0 24 4a20 20 0 1 0 19.6 16.5z"/>
                  <path fill="#34A853" d="M6.3 14.7l6.6 4.8A12 12 0 0 1 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7A20 20 0 0 0 6.3 14.7z"/>
                  <path fill="#FBBC05" d="M24 44a20 20 0 0 0 13.6-5.3l-6.3-5.3a12 12 0 0 1-18-6.3l-6.6 5.1A20 20 0 0 0 24 44z"/>
                  <path fill="#EA4335" d="M43.6 20.5H42V20H24v8h11.3a12 12 0 0 1-4 5.4l6.3 5.3c-.4.4 6.4-4.7 6.4-14.7 0-1.3-.1-2.3-.4-3.5z"/>
                </svg>
              </span>
              <div>
                <span class="adm-eyebrow">Google Business Profile</span>
                <h3 class="rv-summary__name">{{ connected.preview?.name || 'Connected listing' }}</h3>
                <p v-if="connected.preview?.address" class="rv-summary__addr">{{ connected.preview.address }}</p>
              </div>
            </div>
            <button type="button" class="adm-btn adm-btn--sm" :disabled="loading" @click="disconnect">Disconnect</button>
          </div>

          <div v-if="connected.preview" class="rv-stats">
            <div class="rv-stat">
              <span class="rv-stat__val">{{ connected.preview.rating?.toFixed(1) ?? '—' }}</span>
              <span class="rv-stat__lbl">Average rating</span>
            </div>
            <div class="rv-stat">
              <span class="rv-stat__val">{{ connected.preview.totalRatings ?? '—' }}</span>
              <span class="rv-stat__lbl">Total reviews</span>
            </div>
            <div class="rv-stat">
              <span class="rv-stat__val">{{ savedReviews.length }}</span>
              <span class="rv-stat__lbl">Cached on site</span>
            </div>
            <a v-if="connected.preview.url" :href="connected.preview.url" target="_blank" rel="noopener" class="adm-btn adm-btn--sm rv-stat__link">View on Google ↗</a>
          </div>
        </div>

        <div class="rv-grid">
          <div class="rv-card rv-map" v-if="mapEmbedUrl">
            <iframe
              :key="connected.placeId"
              :src="mapEmbedUrl"
              loading="lazy"
              referrerpolicy="no-referrer-when-downgrade"
              allowfullscreen
              title="Business location"
            />
          </div>

          <div class="rv-card rv-reviews">
            <h3 class="rv-reviews__title">Recent reviews</h3>
            <p v-if="!savedReviews.length && !connected.preview?.reviews.length" class="adm-muted">
              No reviews yet. They’ll show up here once Google returns them.
            </p>
            <ul class="rv-list">
              <li v-for="r in (savedReviews.length ? savedReviews : connected.preview?.reviews ?? []).slice(0, 6)" :key="('id' in r) ? r.id : r.author + r.text" class="rv-item">
                <div class="rv-item__head">
                  <span class="rv-item__author">{{ r.author }}</span>
                  <span class="rv-item__stars" :title="`${r.rating}/5`">{{ stars(r.rating) }}</span>
                </div>
                <p class="rv-item__text">{{ r.text }}</p>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div v-else class="rv-card rv-picker">
        <div class="rv-brand rv-brand--lg">
          <span class="rv-brand__logo" aria-hidden="true">
            <svg viewBox="0 0 48 48" width="34" height="34">
              <path fill="#4285F4" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8a12 12 0 1 1 0-24c3.1 0 5.9 1.2 8 3.1l5.7-5.7A20 20 0 0 0 24 4a20 20 0 1 0 19.6 16.5z"/>
              <path fill="#34A853" d="M6.3 14.7l6.6 4.8A12 12 0 0 1 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7A20 20 0 0 0 6.3 14.7z"/>
              <path fill="#FBBC05" d="M24 44a20 20 0 0 0 13.6-5.3l-6.3-5.3a12 12 0 0 1-18-6.3l-6.6 5.1A20 20 0 0 0 24 44z"/>
              <path fill="#EA4335" d="M43.6 20.5H42V20H24v8h11.3a12 12 0 0 1-4 5.4l6.3 5.3c-.4.4 6.4-4.7 6.4-14.7 0-1.3-.1-2.3-.4-3.5z"/>
            </svg>
          </span>
          <div>
            <span class="adm-eyebrow">Google Business Profile</span>
            <h3 class="rv-picker__title">Find your business on Google</h3>
            <p class="rv-picker__body">Search for your business name and pick it from the list. We’ll pull your rating and recent reviews automatically.</p>
          </div>
        </div>

        <label class="adm-label rv-picker__search">
          <input
            v-model="query"
            class="adm-input"
            type="search"
            placeholder="e.g. Eternal Spa, Trinidad CO"
            autocomplete="off"
            @input="scheduleSearch"
          />
        </label>

        <div v-if="searching" class="adm-muted rv-picker__hint">Searching…</div>
        <div v-else-if="query.trim().length >= 2 && !results.length" class="adm-muted rv-picker__hint">
          No matches. Try including your city or a more specific name.
        </div>

        <ul v-if="results.length" class="rv-results">
          <li v-for="c in results" :key="c.placeId" class="rv-result">
            <button type="button" class="rv-result__btn" :disabled="loading" @click="pickPlace(c)">
              <div class="rv-result__main">
                <span class="rv-result__name">{{ c.name }}</span>
                <span class="rv-result__addr">{{ c.address }}</span>
              </div>
              <div class="rv-result__meta">
                <span v-if="c.rating != null" class="rv-result__rating">
                  <span class="rv-result__stars">{{ stars(c.rating) }}</span>
                  <span class="rv-result__count">{{ c.rating.toFixed(1) }}<template v-if="c.totalRatings"> · {{ c.totalRatings }}</template></span>
                </span>
                <span class="rv-result__cta">Connect →</span>
              </div>
            </button>
          </li>
        </ul>

        <p class="rv-picker__footnote">
          Google logo and listing data © Google. Make sure you own or manage the business profile before connecting.
        </p>
      </div>

      <p v-if="status" class="adm-msg-ok">{{ status }}</p>
      <p v-if="error" class="adm-msg-err">{{ error }}</p>
    </template>
  </section>
</template>

<style scoped>
.rv-card {
  background: var(--adm-surface);
  border: 1px solid var(--adm-border);
  border-radius: var(--adm-radius-lg);
  padding: 1.5rem;
}

.rv-connected { display: flex; flex-direction: column; gap: 1.25rem; }

.rv-summary__head {
  display: flex; align-items: flex-start; justify-content: space-between;
  gap: 1rem; flex-wrap: wrap;
}
.rv-brand { display: flex; gap: 1rem; align-items: flex-start; min-width: 0; }
.rv-brand--lg { margin-bottom: 1.25rem; }
.rv-brand__logo {
  flex: 0 0 auto;
  width: 48px; height: 48px;
  border-radius: 12px;
  background: #fff;
  display: grid; place-items: center;
  border: 1px solid var(--adm-border);
  box-shadow: 0 1px 2px rgba(0,0,0,0.25);
}
.rv-summary__name {
  font-family: var(--adm-font-serif); font-weight: 500;
  font-size: 1.3rem; margin: 0.2rem 0 0.25rem;
}
.rv-summary__addr { color: var(--adm-text-muted); margin: 0; font-size: 0.9rem; }

.rv-stats {
  display: flex; flex-wrap: wrap; gap: 1.5rem 2rem; align-items: center;
  margin-top: 1.25rem; padding-top: 1.25rem;
  border-top: 1px solid var(--adm-border-soft);
}
.rv-stat { display: flex; flex-direction: column; gap: 0.15rem; }
.rv-stat__val { font-family: var(--adm-font-serif); font-size: 1.6rem; font-weight: 500; }
.rv-stat__lbl { color: var(--adm-text-muted); font-size: 0.78rem; letter-spacing: 0.06em; text-transform: uppercase; }
.rv-stat__link { margin-left: auto; }

.rv-grid {
  display: grid; gap: 1.25rem;
  grid-template-columns: minmax(260px, 1fr) minmax(280px, 1.4fr);
}
@media (max-width: 880px) { .rv-grid { grid-template-columns: 1fr; } }

.rv-map { padding: 0; overflow: hidden; min-height: 320px; }
.rv-map iframe { width: 100%; height: 100%; min-height: 320px; border: 0; display: block; }

.rv-reviews__title {
  font-family: var(--adm-font-serif); font-weight: 500;
  font-size: 1.1rem; margin: 0 0 1rem;
}
.rv-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 1rem; }
.rv-item { border-top: 1px solid var(--adm-border-soft); padding-top: 0.85rem; }
.rv-item:first-child { border-top: 0; padding-top: 0; }
.rv-item__head { display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; }
.rv-item__author { font-weight: 600; font-size: 0.92rem; }
.rv-item__stars { color: #f5a623; letter-spacing: 0.1em; font-size: 0.85rem; }
.rv-item__text { color: var(--adm-text-muted); margin: 0.35rem 0 0; font-size: 0.9rem; line-height: 1.5; }

.rv-picker__title {
  font-family: var(--adm-font-serif); font-weight: 500;
  font-size: clamp(1.4rem, 2vw, 1.8rem); margin: 0.2rem 0 0.4rem;
}
.rv-picker__body { color: var(--adm-text-muted); margin: 0; max-width: 56ch; }
.rv-picker__search { margin: 0.25rem 0 0.5rem; max-width: 560px; }
.rv-picker__hint { margin: 0.25rem 0 0.75rem; font-size: 0.85rem; }
.rv-picker__footnote { margin: 1.25rem 0 0; color: var(--adm-text-subtle); font-size: 0.78rem; }

.rv-results {
  list-style: none; margin: 0.5rem 0 0; padding: 0;
  display: flex; flex-direction: column; gap: 0.5rem;
  max-width: 720px;
}
.rv-result__btn {
  width: 100%; text-align: left;
  display: flex; align-items: center; justify-content: space-between;
  gap: 1rem; padding: 0.85rem 1rem;
  background: var(--adm-surface-2);
  border: 1px solid var(--adm-border);
  border-radius: var(--adm-radius);
  color: var(--adm-text); cursor: pointer;
  font: inherit;
  transition: border-color 140ms, background 140ms;
}
.rv-result__btn:hover:not(:disabled) {
  border-color: var(--adm-accent);
  background: color-mix(in srgb, var(--adm-accent) 6%, var(--adm-surface-2));
}
.rv-result__btn:disabled { opacity: 0.6; cursor: progress; }
.rv-result__main { display: flex; flex-direction: column; gap: 0.15rem; min-width: 0; }
.rv-result__name { font-weight: 600; }
.rv-result__addr { color: var(--adm-text-muted); font-size: 0.85rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.rv-result__meta { display: flex; align-items: center; gap: 1rem; flex: 0 0 auto; }
.rv-result__rating { display: flex; flex-direction: column; align-items: flex-end; }
.rv-result__stars { color: #f5a623; letter-spacing: 0.08em; font-size: 0.85rem; }
.rv-result__count { color: var(--adm-text-muted); font-size: 0.78rem; }
.rv-result__cta { color: var(--adm-accent); font-size: 0.85rem; font-weight: 600; }
</style>
