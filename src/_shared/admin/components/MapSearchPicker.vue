<script setup lang="ts">
/**
 * MapSearchPicker — Google Geocoding search + Google Maps Embed preview.
 *
 * Uses the Google Geocoding REST API (browser-safe fetch) for address search
 * and the Google Maps Embed API for the live map preview. Requires
 * VITE_GOOGLE_MAPS_API_KEY to be set in your environment.
 */
import { computed, onBeforeUnmount, ref, watch } from 'vue'

const props = defineProps<{
  address: string
  embedUrl?: string
}>()

const emit = defineEmits<{
  (e: 'update:address', v: string): void
  (e: 'update:embedUrl', v: string): void
}>()

interface GeoResult {
  formatted_address: string
  place_id: string
  geometry: { location: { lat: number; lng: number } }
}

const API_KEY = (import.meta as { env: Record<string, string> }).env.VITE_GOOGLE_MAPS_API_KEY ?? ''

const query = ref(props.address)
const open = ref(false)
const loading = ref(false)
const results = ref<GeoResult[]>([])
const lastErr = ref<string>('')
let timer: ReturnType<typeof setTimeout> | null = null
let abort: AbortController | null = null

watch(() => props.address, (v) => {
  if (v !== query.value) query.value = v
})

function buildEmbed(placeId: string): string {
  return `https://www.google.com/maps/embed/v1/place?key=${API_KEY}&q=place_id:${placeId}`
}

async function search(q: string) {
  if (!q || q.trim().length < 3) { results.value = []; open.value = false; return }
  if (!API_KEY) { lastErr.value = 'VITE_GOOGLE_MAPS_API_KEY is not set.'; return }
  loading.value = true
  lastErr.value = ''
  if (abort) abort.abort()
  abort = new AbortController()
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(q)}&key=${API_KEY}`
    const r = await fetch(url, { signal: abort.signal })
    if (!r.ok) throw new Error(`Geocode request failed (${r.status})`)
    const data = await r.json() as { status: string; results: GeoResult[]; error_message?: string }
    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      throw new Error(data.error_message ?? data.status)
    }
    results.value = data.results ?? []
    open.value = results.value.length > 0
  } catch (e) {
    if ((e as Error).name !== 'AbortError') lastErr.value = (e as Error).message
  } finally {
    loading.value = false
  }
}

function onInput(v: string) {
  query.value = v
  emit('update:address', v)
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => search(v), 350)
}

function pick(h: GeoResult) {
  query.value = h.formatted_address
  emit('update:address', h.formatted_address)
  emit('update:embedUrl', buildEmbed(h.place_id))
  open.value = false
}

function onBlur() {
  setTimeout(() => { open.value = false }, 150)
}

const previewSrc = computed(() => props.embedUrl || '')

onBeforeUnmount(() => { if (abort) abort.abort(); if (timer) clearTimeout(timer) })
</script>

<template>
  <div class="msp">
    <div class="msp__search">
      <input
        type="search"
        class="msp__input"
        :value="query"
        placeholder="Search address (powered by Google Maps)…"
        autocomplete="off"
        spellcheck="false"
        @input="onInput(($event.target as HTMLInputElement).value)"
        @focus="results.length && (open = true)"
        @blur="onBlur"
      />
      <span v-if="loading" class="msp__spinner" aria-hidden="true" />
      <ul v-if="open && results.length" class="msp__results" role="listbox">
        <li v-for="h in results" :key="h.place_id">
          <button type="button" class="msp__result" @mousedown.prevent="pick(h)">
            {{ h.formatted_address }}
          </button>
        </li>
      </ul>
      <p v-if="lastErr" class="msp__err">{{ lastErr }}</p>
    </div>

    <div class="msp__preview">
      <iframe
        v-if="previewSrc"
        :src="previewSrc"
        class="msp__map"
        loading="lazy"
        referrerpolicy="no-referrer"
        allowfullscreen
        title="Location preview"
      />
      <div v-else class="msp__placeholder">Search for an address to drop a pin.</div>
    </div>
  </div>
</template>

<style scoped>
.msp { display: flex; flex-direction: column; gap: 0.6rem; }
.msp__search { position: relative; }
.msp__input {
  width: 100%;
  padding: 0.55rem 0.75rem;
  background: var(--adm-surface-2);
  color: var(--adm-text);
  border: 1px solid var(--adm-border);
  border-radius: var(--adm-radius-sm, 6px);
  font: inherit; font-size: 0.9rem;
}
.msp__input:focus { outline: none; border-color: var(--adm-accent); }
.msp__spinner {
  position: absolute; right: 0.6rem; top: 50%; transform: translateY(-50%);
  width: 14px; height: 14px;
  border: 2px solid var(--adm-border);
  border-top-color: var(--adm-accent);
  border-radius: 50%;
  animation: msp-spin 0.7s linear infinite;
}
@keyframes msp-spin { to { transform: translateY(-50%) rotate(360deg); } }

.msp__results {
  position: absolute; z-index: 5; top: calc(100% + 4px); left: 0; right: 0;
  list-style: none; padding: 0.25rem; margin: 0;
  background: var(--adm-surface);
  border: 1px solid var(--adm-border);
  border-radius: var(--adm-radius, 8px);
  box-shadow: 0 12px 28px rgba(0,0,0,0.35);
  max-height: 280px; overflow: auto;
}
.msp__result {
  display: block; width: 100%; text-align: left;
  padding: 0.5rem 0.65rem;
  background: transparent; border: 0;
  color: var(--adm-text); font: inherit; font-size: 0.85rem;
  border-radius: var(--adm-radius-sm, 6px);
  cursor: pointer;
}
.msp__result:hover { background: var(--adm-surface-2); }

.msp__err { color: #e26d6d; font-size: 0.8rem; margin: 0.4rem 0 0; }

.msp__preview {
  border: 1px solid var(--adm-border);
  border-radius: var(--adm-radius, 8px);
  overflow: hidden;
  background: var(--adm-surface-2);
  aspect-ratio: 16 / 9;
}
.msp__map { display: block; width: 100%; height: 100%; border: 0; }
.msp__placeholder {
  display: flex; align-items: center; justify-content: center; height: 100%;
  color: var(--adm-text-muted); font-size: 0.85rem;
}
</style>
