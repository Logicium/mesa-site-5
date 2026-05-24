<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { contentClient } from '../../platform/contentClient'
import { useActiveSiteStore } from '../../platform/activeSiteStore'

const activeSites = useActiveSiteStore()
const siteId = computed(() => activeSites.activeId)
const rows = ref<Awaited<ReturnType<typeof contentClient.getAnalytics>>>([])
const error = ref<string | null>(null)

async function load() {
  if (!siteId.value) { rows.value = []; return }
  try { rows.value = await contentClient.getAnalytics(siteId.value) }
  catch (e) { error.value = e instanceof Error ? e.message : String(e) }
}
onMounted(load)
watch(siteId, load)
</script>

<template>
  <section class="adm-page">
    <header class="adm-page__head">
      <div>
        <span class="adm-eyebrow">Performance</span>
        <h1 class="adm-title">Analytics</h1>
        <p class="adm-subtitle">Daily visitors, pageviews, and uptime checks.</p>
      </div>
    </header>

    <div v-if="!siteId" class="adm-empty">
      <p class="adm-empty__body">Select a site from the header to see its analytics.</p>
    </div>
    <template v-else>
      <div v-if="!rows.length" class="adm-empty">
        <p class="adm-empty__body">No analytics yet. Data accrues once the site is live.</p>
      </div>
      <div v-else class="adm-card an-card">
        <div class="an-table-wrap">
          <table class="adm-table an-table">
            <thead>
              <tr><th>Date</th><th>Visitors</th><th>Pageviews</th><th>Uptime (ms)</th><th>Error</th></tr>
            </thead>
            <tbody>
              <tr v-for="r in rows" :key="r.date">
                <td class="adm-muted">{{ r.date }}</td>
                <td>{{ r.visitors }}</td>
                <td>{{ r.pageviews }}</td>
                <td>{{ r.uptimeLatencyMs }}</td>
                <td :class="r.uptimeError ? 'an-err' : ''">{{ r.uptimeError || '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <p v-if="error" class="adm-msg-err">{{ error }}</p>
    </template>
  </section>
</template>

<style scoped>
.an-card { padding: 0; overflow: hidden; }
.an-table-wrap { overflow-x: auto; }
.an-table { min-width: 560px; }
.an-err { color: var(--adm-danger); font-family: var(--adm-font-mono); font-size: 0.82rem; }
</style>
