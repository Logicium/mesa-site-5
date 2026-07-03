<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { contentClient, type LodgingConfigDTO, type LodgingRoomDTO, type ReservationDTO } from '../../platform/contentClient'
import { useActiveSiteStore } from '../../platform/activeSiteStore'

const activeSites = useActiveSiteStore()
const siteId = computed(() => activeSites.activeId)

const loading = ref(false)
const error = ref<string | null>(null)
const saving = ref(false)
const savedAt = ref<string | null>(null)

const resolved = ref<Required<LodgingConfigDTO> | null>(null)
const rooms = ref<LodgingRoomDTO[]>([])
const addOnEnabled = ref(false)
const reservations = ref<ReservationDTO[]>([])

const newRoom = ref<LodgingRoomDTO>({ id: '', label: '', description: '', capacity: 2, nightlyRateCents: undefined, imageUrl: '' })

async function load() {
  if (!siteId.value) return
  loading.value = true
  error.value = null
  try {
    const [cfg, list, sites] = await Promise.all([
      contentClient.getLodgingConfig(siteId.value),
      contentClient.listSiteReservations(siteId.value).catch(() => [] as ReservationDTO[]),
      contentClient.listSites(),
    ])
    resolved.value = cfg.resolved
    rooms.value = (cfg.override?.rooms ?? cfg.resolved.rooms ?? []).map(r => ({ ...r }))
    reservations.value = list
    addOnEnabled.value = !!sites.find(s => s.id === siteId.value)?.addOns?.includes('lodging')
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
  } finally {
    loading.value = false
  }
}

function addRoom() {
  const r = newRoom.value
  if (!r.id.trim() || !r.label.trim()) return
  rooms.value.push({
    id: r.id.trim(),
    label: r.label.trim(),
    description: r.description?.trim() || undefined,
    capacity: Math.max(1, Number(r.capacity) || 1),
    nightlyRateCents: r.nightlyRateCents != null && r.nightlyRateCents > 0 ? Math.round(r.nightlyRateCents) : undefined,
    imageUrl: r.imageUrl?.trim() || undefined,
  })
  newRoom.value = { id: '', label: '', description: '', capacity: 2, nightlyRateCents: undefined, imageUrl: '' }
}

function removeRoom(i: number) { rooms.value.splice(i, 1) }

async function saveConfig() {
  if (!siteId.value || !resolved.value) return
  saving.value = true
  error.value = null
  try {
    const payload: LodgingConfigDTO = {
      timezone: resolved.value.timezone,
      currency: resolved.value.currency,
      minNights: resolved.value.minNights,
      maxNights: resolved.value.maxNights,
      windowDays: resolved.value.windowDays,
      checkInTime: resolved.value.checkInTime,
      checkOutTime: resolved.value.checkOutTime,
      rooms: rooms.value
        .filter(r => r.id.trim() && r.label.trim())
        .map(r => ({
          id: r.id.trim(),
          label: r.label.trim(),
          description: r.description?.trim() || undefined,
          capacity: Math.max(1, Number(r.capacity) || 1),
          nightlyRateCents: r.nightlyRateCents != null && r.nightlyRateCents > 0 ? Math.round(r.nightlyRateCents) : undefined,
          imageUrl: r.imageUrl?.trim() || undefined,
        })),
    }
    const next = await contentClient.saveLodgingConfig(siteId.value, payload)
    resolved.value = next.resolved
    savedAt.value = new Date().toISOString()
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
  } finally {
    saving.value = false
  }
}

async function toggleAddOn() {
  if (!siteId.value) return
  try {
    const res = await contentClient.setSiteAddOn(siteId.value, 'lodging', !addOnEnabled.value)
    addOnEnabled.value = res.addOns.includes('lodging')
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
  }
}

async function cancelReservation(id: string) {
  if (!siteId.value) return
  if (!confirm('Cancel this reservation? The guest will be notified.')) return
  try {
    await contentClient.adminCancelReservation(siteId.value, id)
    reservations.value = reservations.value.map(r => r.id === id ? { ...r, status: 'cancelled' } : r)
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
  }
}

function money(cents?: number, currency?: string) {
  if (cents == null) return ''
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || resolved.value?.currency || 'USD' }).format(cents / 100)
}

onMounted(load)
watch(siteId, load)
</script>

<template>
  <section class="adm-page">
    <header class="adm-page__head">
      <div>
        <span class="adm-eyebrow">Premium add-on</span>
        <h1 class="adm-title">Lodging</h1>
        <p class="adm-subtitle">
          Accept reservations on your booking page. Define your rooms, set your stay rules,
          and manage incoming guests.
        </p>
      </div>
      <div class="head-actions">
        <button
          type="button"
          class="adm-btn"
          :class="addOnEnabled ? 'adm-btn--ghost' : 'adm-btn--primary'"
          @click="toggleAddOn"
        >{{ addOnEnabled ? 'Disable add-on' : 'Enable lodging' }}</button>
      </div>
    </header>

    <div v-if="!siteId" class="adm-empty">
      <p class="adm-empty__body">Select a site from the header to manage its lodging.</p>
    </div>

    <template v-else>
      <p v-if="error" class="adm-msg-err">{{ error }}</p>
      <p v-if="loading" class="adm-muted">Loading…</p>

      <div v-if="!addOnEnabled" class="adm-card adm-card--soft addon-gate">
        <p>
          The Lodging add-on is currently <strong>off</strong> for this site. Enable it above
          to start accepting reservations.
        </p>
      </div>

      <div class="adm-grid">
        <section class="adm-card">
          <h2 class="adm-h2">Rooms</h2>
          <p class="adm-muted adm-mb">Each room appears as a bookable card on your reservations page.</p>

          <ul v-if="rooms.length" class="rm-list">
            <li v-for="(r, i) in rooms" :key="i" class="rm-row">
              <input class="adm-input rm-row__id" v-model="r.id" placeholder="id (e.g. cabin-pine)" />
              <input class="adm-input rm-row__label" v-model="r.label" placeholder="Label" />
              <input class="adm-input rm-row__desc" v-model="r.description" placeholder="Short description" />
              <input class="adm-input rm-row__cap" type="number" min="1" max="20" v-model.number="r.capacity" title="Capacity" />
              <input class="adm-input rm-row__rate" type="number" min="0" step="100" v-model.number="r.nightlyRateCents" placeholder="cents/night" title="Nightly rate (cents)" />
              <input class="adm-input rm-row__img" v-model="r.imageUrl" placeholder="image url" />
              <button type="button" class="adm-btn adm-btn--ghost adm-btn--sm" @click="removeRoom(i)">×</button>
            </li>
          </ul>
          <p v-else class="adm-muted adm-mb">No rooms yet.</p>

          <div class="rm-row rm-row--new">
            <input class="adm-input rm-row__id" v-model="newRoom.id" placeholder="id" />
            <input class="adm-input rm-row__label" v-model="newRoom.label" placeholder="Label" />
            <input class="adm-input rm-row__desc" v-model="newRoom.description" placeholder="Description" />
            <input class="adm-input rm-row__cap" type="number" min="1" v-model.number="newRoom.capacity" />
            <input class="adm-input rm-row__rate" type="number" min="0" step="100" v-model.number="newRoom.nightlyRateCents" placeholder="cents/night" />
            <input class="adm-input rm-row__img" v-model="newRoom.imageUrl" placeholder="image url" />
            <button type="button" class="adm-btn adm-btn--primary adm-btn--sm" @click="addRoom">Add</button>
          </div>
          <p class="adm-muted" style="font-size: 0.75rem; margin-top: 0.5rem;">
            Rates are stored in cents (e.g. <code>15000</code> = $150).
          </p>
        </section>

        <section v-if="resolved" class="adm-card">
          <h2 class="adm-h2">Stay rules</h2>
          <div class="meta-grid">
            <label class="adm-field">
              <span>Timezone</span>
              <input class="adm-input" v-model="resolved.timezone" />
            </label>
            <label class="adm-field">
              <span>Currency</span>
              <input class="adm-input" v-model="resolved.currency" maxlength="3" />
            </label>
            <label class="adm-field">
              <span>Min nights</span>
              <input class="adm-input" type="number" min="1" v-model.number="resolved.minNights" />
            </label>
            <label class="adm-field">
              <span>Max nights</span>
              <input class="adm-input" type="number" min="1" v-model.number="resolved.maxNights" />
            </label>
            <label class="adm-field">
              <span>Window (days)</span>
              <input class="adm-input" type="number" min="1" max="365" v-model.number="resolved.windowDays" />
            </label>
            <label class="adm-field">
              <span>Check-in time</span>
              <input class="adm-input" type="time" v-model="resolved.checkInTime" />
            </label>
            <label class="adm-field">
              <span>Check-out time</span>
              <input class="adm-input" type="time" v-model="resolved.checkOutTime" />
            </label>
          </div>
        </section>
      </div>

      <div class="save-bar">
        <button type="button" class="adm-btn adm-btn--primary" :disabled="saving" @click="saveConfig">
          {{ saving ? 'Saving…' : 'Save settings' }}
        </button>
        <span v-if="savedAt" class="adm-muted">Saved {{ new Date(savedAt).toLocaleTimeString() }}</span>
      </div>

      <section class="adm-card">
        <h2 class="adm-h2">Reservations</h2>
        <p v-if="!reservations.length" class="adm-muted">No reservations yet.</p>
        <table v-else class="adm-table">
          <thead>
            <tr><th>Dates</th><th>Room</th><th>Guest</th><th>Contact</th><th>Total</th><th>Status</th><th /></tr>
          </thead>
          <tbody>
            <tr v-for="r in reservations" :key="r.id">
              <td>{{ r.checkIn }} → {{ r.checkOut }} <small class="adm-muted">({{ r.nights }}n)</small></td>
              <td>{{ r.roomLabel }} <small class="adm-muted">· {{ r.partySize }} guest{{ r.partySize === 1 ? '' : 's' }}</small></td>
              <td>{{ r.name }}</td>
              <td>
                <a :href="`mailto:${r.email}`">{{ r.email }}</a>
                <template v-if="r.phone"> · {{ r.phone }}</template>
              </td>
              <td>{{ money(r.totalCents, r.currency) }}</td>
              <td>
                <span class="adm-badge" :class="r.status === 'cancelled' ? 'adm-badge--warn' : 'adm-badge--info'">{{ r.status }}</span>
              </td>
              <td>
                <button v-if="r.status !== 'cancelled'" type="button" class="adm-btn adm-btn--ghost adm-btn--sm" @click="cancelReservation(r.id)">Cancel</button>
              </td>
            </tr>
          </tbody>
        </table>
      </section>
    </template>
  </section>
</template>

<style scoped>
.head-actions { margin-left: auto; }
.adm-grid { display: grid; grid-template-columns: 1.4fr 1fr; gap: 1rem; margin: 1rem 0; }
@media (max-width: 1000px) { .adm-grid { grid-template-columns: 1fr; } }
.adm-h2 { margin: 0 0 0.4rem; font-size: 1.05rem; }
.adm-mb { margin-bottom: 0.75rem; }
.addon-gate { padding: 1rem 1.1rem; margin-bottom: 1rem; }

.rm-list { list-style: none; padding: 0; margin: 0 0 0.75rem; display: flex; flex-direction: column; gap: 0.35rem; }
.rm-row { display: grid; grid-template-columns: 7rem 9rem 1fr 4rem 7rem 1.4fr auto; gap: 0.3rem; align-items: center; }
.rm-row--new { padding-top: 0.5rem; border-top: 1px dashed var(--adm-border); }

.meta-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem; }
.adm-field { display: flex; flex-direction: column; gap: 0.2rem; font-size: 0.8rem; color: var(--adm-text-subtle); }

.save-bar { display: flex; align-items: center; gap: 0.75rem; margin: 1rem 0 1.25rem; }

.adm-table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
.adm-table th, .adm-table td { text-align: left; padding: 0.55rem 0.5rem; border-bottom: 1px solid var(--adm-border); }
.adm-table th { color: var(--adm-text-subtle); font-weight: 600; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.06em; }
</style>
