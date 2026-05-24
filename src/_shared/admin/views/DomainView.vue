<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { contentClient } from '../../platform/contentClient'
import { useActiveSiteStore } from '../../platform/activeSiteStore'

const activeSites = useActiveSiteStore()
const siteId = computed(() => activeSites.activeId)
const domain = ref('')
const dns = ref<{ instructions: Array<{ type: string; name: string; value: string; note: string }> } | null>(null)
const verifyStatus = ref('')
const error = ref<string | null>(null)

async function loadCurrent() {
  if (!siteId.value) { domain.value = ''; dns.value = null; return }
  try {
    const r = await contentClient.getDomain(siteId.value)
    if (r.domain) domain.value = r.domain
  } catch (e) { error.value = e instanceof Error ? e.message : String(e) }
}
async function request() {
  error.value = null; verifyStatus.value = ''
  try { dns.value = (await contentClient.requestDomain(siteId.value, domain.value.trim())).dns }
  catch (e) { error.value = e instanceof Error ? e.message : String(e) }
}
async function verify() {
  error.value = null
  try {
    const r = await contentClient.verifyDomain(siteId.value)
    verifyStatus.value = r.ok ? 'Verified.' : 'Not yet — DNS may need more time.'
  } catch (e) { error.value = e instanceof Error ? e.message : String(e) }
}
onMounted(loadCurrent)
watch(siteId, loadCurrent)
</script>

<template>
  <section class="adm-page">
    <header class="adm-page__head">
      <div>
        <span class="adm-eyebrow">Setup</span>
        <h1 class="adm-title">Domain</h1>
        <p class="adm-subtitle">Point your own domain at this site — we handle the SSL.</p>
      </div>
    </header>

    <div v-if="!siteId" class="adm-empty">
      <p class="adm-empty__body">Select a site from the header to attach a domain.</p>
    </div>
    <template v-else>
      <div class="adm-card">
        <h3 class="adm-card__title">Attach a domain</h3>
        <p class="adm-card__sub">Use the full hostname — e.g. <code>www.yoursite.com</code>.</p>
        <form class="dn-form" @submit.prevent="request">
          <input v-model="domain" class="adm-input" placeholder="www.yoursite.com" />
          <button type="submit" class="adm-btn adm-btn--primary">Attach domain</button>
        </form>
      </div>

      <div v-if="dns" class="adm-card">
        <h3 class="adm-card__title">DNS records</h3>
        <p class="adm-card__sub">Add these at your registrar, then come back and verify.</p>
        <div class="dn-table-wrap">
          <table class="adm-table dn-table">
            <thead><tr><th>Type</th><th>Name</th><th>Value</th><th>Note</th></tr></thead>
            <tbody>
              <tr v-for="(r, i) in dns.instructions" :key="i">
                <td><span class="adm-badge">{{ r.type }}</span></td>
                <td class="dn-mono">{{ r.name }}</td>
                <td class="dn-mono">{{ r.value }}</td>
                <td class="adm-muted">{{ r.note }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <button type="button" class="adm-btn adm-btn--primary" @click="verify">I’ve added the records — verify</button>
        <p v-if="verifyStatus" class="adm-msg-ok">{{ verifyStatus }}</p>
      </div>
      <p v-if="error" class="adm-msg-err">{{ error }}</p>
    </template>
  </section>
</template>

<style scoped>
.dn-form { display: flex; gap: 0.6rem; flex-wrap: wrap; }
.dn-form .adm-input { flex: 1; min-width: 220px; }
.dn-table-wrap { overflow-x: auto; margin: 0.4rem 0 1rem; }
.dn-table { min-width: 540px; }
.dn-mono { font-family: var(--adm-font-mono); font-size: 0.82rem; word-break: break-all; }
code { font-family: var(--adm-font-mono); color: var(--adm-accent); }
</style>
