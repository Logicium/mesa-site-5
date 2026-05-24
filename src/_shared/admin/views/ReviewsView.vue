<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { contentClient } from '../../platform/contentClient'
import { useActiveSiteStore } from '../../platform/activeSiteStore'

const activeSites = useActiveSiteStore()
const siteId = computed(() => activeSites.activeId)
const placeId = ref('')
const manual = ref({ author: '', rating: 5, text: '' })
const status = ref('')
const error = ref<string | null>(null)

async function savePlace() {
  status.value = ''; error.value = null
  try {
    await contentClient.setGooglePlace(siteId.value, placeId.value.trim())
    status.value = 'Saved. Reviews will refresh hourly.'
  } catch (e) { error.value = e instanceof Error ? e.message : String(e) }
}
async function addManual() {
  status.value = ''; error.value = null
  try {
    await contentClient.addManualReview(siteId.value, { ...manual.value })
    status.value = 'Added.'
    manual.value = { author: '', rating: 5, text: '' }
  } catch (e) { error.value = e instanceof Error ? e.message : String(e) }
}
watch(siteId, () => { status.value = ''; error.value = null })
</script>

<template>
  <section class="adm-page">
    <header class="adm-page__head">
      <div>
        <span class="adm-eyebrow">Reputation</span>
        <h1 class="adm-title">Reviews</h1>
        <p class="adm-subtitle">Pull in Google reviews automatically, or curate your own.</p>
      </div>
    </header>

    <div v-if="!siteId" class="adm-empty">
      <p class="adm-empty__body">Select a site from the header to manage reviews.</p>
    </div>
    <template v-else>
      <div class="rv-grid">
        <div class="adm-card">
          <h3 class="adm-card__title">Google Place</h3>
          <p class="adm-card__sub">Paste your Google Place ID. We refresh ratings hourly.</p>
          <form class="rv-form" @submit.prevent="savePlace">
            <label class="adm-label">
              Place ID
              <input v-model="placeId" class="adm-input" placeholder="ChIJ…" />
            </label>
            <button type="submit" class="adm-btn adm-btn--primary">Save</button>
          </form>
        </div>

        <div class="adm-card">
          <h3 class="adm-card__title">Add a manual review</h3>
          <p class="adm-card__sub">Showcase testimonials you collected outside of Google.</p>
          <form class="rv-form" @submit.prevent="addManual">
            <label class="adm-label">
              Author
              <input v-model="manual.author" class="adm-input" required />
            </label>
            <label class="adm-label">
              Rating (1–5)
              <input v-model.number="manual.rating" class="adm-input" type="number" min="1" max="5" required />
            </label>
            <label class="adm-label">
              Review text
              <textarea v-model="manual.text" class="adm-textarea" rows="3" required />
            </label>
            <button type="submit" class="adm-btn adm-btn--primary">Add review</button>
          </form>
        </div>
      </div>
      <p v-if="status" class="adm-msg-ok">{{ status }}</p>
      <p v-if="error" class="adm-msg-err">{{ error }}</p>
    </template>
  </section>
</template>

<style scoped>
.rv-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1.25rem; }
.rv-form { display: flex; flex-direction: column; gap: 0.75rem; }
</style>
