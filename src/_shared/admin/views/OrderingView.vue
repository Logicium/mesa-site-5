<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { contentClient, type MenuItemDTO, type MenuItemInput, type MealOrderDTO, type OrderingConfigDTO } from '../../platform/contentClient'
import { useActiveSiteStore } from '../../platform/activeSiteStore'

const activeSites = useActiveSiteStore()
const siteId = computed(() => activeSites.activeId)

const loading = ref(false)
const error = ref<string | null>(null)
const saving = ref(false)
const savedAt = ref<string | null>(null)

const resolved = ref<Required<OrderingConfigDTO> | null>(null)
const items = ref<MenuItemDTO[]>([])
const orders = ref<MealOrderDTO[]>([])
const addOnEnabled = ref(false)

// Local editor model for hours: weekday -> "HH:MM-HH:MM,HH:MM-HH:MM" string.
const hoursEditor = ref<Record<number, string>>({})
const dayLabels: Array<{ idx: number; label: string }> = [
  { idx: 0, label: 'Sun' }, { idx: 1, label: 'Mon' }, { idx: 2, label: 'Tue' }, { idx: 3, label: 'Wed' },
  { idx: 4, label: 'Thu' }, { idx: 5, label: 'Fri' }, { idx: 6, label: 'Sat' },
]

const newItem = ref<MenuItemInput>({
  sku: '', name: '', description: '', priceCents: 0, currency: 'USD', category: '', imageUrl: '', active: true, sortOrder: 0,
})

async function load() {
  if (!siteId.value) return
  loading.value = true
  error.value = null
  try {
    const [cfg, list, ords, sites] = await Promise.all([
      contentClient.getOrderingConfig(siteId.value),
      contentClient.orderingListSiteMenu(siteId.value).catch(() => [] as MenuItemDTO[]),
      contentClient.orderingListOrders(siteId.value).catch(() => [] as MealOrderDTO[]),
      contentClient.listSites(),
    ])
    resolved.value = cfg.resolved
    items.value = list
    orders.value = ords
    addOnEnabled.value = !!sites.find(s => s.id === siteId.value)?.addOns?.includes('ordering')
    if (cfg.resolved.currency) newItem.value.currency = cfg.resolved.currency
    hoursEditor.value = {}
    for (const { idx } of dayLabels) {
      const ranges = cfg.resolved.hours?.[idx] ?? []
      hoursEditor.value[idx] = ranges.join(', ')
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
  } finally {
    loading.value = false
  }
}

async function addItem() {
  if (!siteId.value) return
  const i = newItem.value
  if (!i.sku.trim() || !i.name.trim()) return
  try {
    const created = await contentClient.orderingCreateMenuItem(siteId.value, {
      sku: i.sku.trim(),
      name: i.name.trim(),
      description: i.description?.trim() || undefined,
      priceCents: Math.max(0, Math.round(i.priceCents)),
      currency: i.currency || resolved.value?.currency || 'USD',
      category: i.category?.trim() || '',
      imageUrl: i.imageUrl?.trim() || undefined,
      active: i.active ?? true,
      sortOrder: i.sortOrder ?? 0,
    })
    items.value.push(created)
    newItem.value = { sku: '', name: '', description: '', priceCents: 0, currency: resolved.value?.currency || 'USD', category: '', imageUrl: '', active: true, sortOrder: 0 }
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
  }
}

async function saveItem(p: MenuItemDTO) {
  if (!siteId.value) return
  try {
    const updated = await contentClient.orderingUpdateMenuItem(siteId.value, p.id, {
      sku: p.sku.trim(),
      name: p.name.trim(),
      description: p.description?.trim() || undefined,
      priceCents: Math.max(0, Math.round(p.priceCents)),
      currency: p.currency,
      category: p.category,
      imageUrl: p.imageUrl?.trim() || undefined,
      active: p.active,
      sortOrder: p.sortOrder,
    })
    const i = items.value.findIndex(x => x.id === updated.id)
    if (i >= 0) items.value[i] = updated
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
  }
}

async function deleteItem(p: MenuItemDTO) {
  if (!siteId.value) return
  if (!confirm(`Delete "${p.name}"?`)) return
  try {
    await contentClient.orderingDeleteMenuItem(siteId.value, p.id)
    items.value = items.value.filter(x => x.id !== p.id)
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
  }
}

function parseHoursEditor(): Record<number, string[]> {
  const out: Record<number, string[]> = {}
  for (const { idx } of dayLabels) {
    const raw = (hoursEditor.value[idx] ?? '').trim()
    if (!raw) continue
    const ranges = raw.split(',').map(s => s.trim()).filter(Boolean)
    const valid = ranges.filter(r => /^\d{1,2}:\d{2}-\d{1,2}:\d{2}$/.test(r))
    if (valid.length) out[idx] = valid
  }
  return out
}

async function saveConfig() {
  if (!siteId.value || !resolved.value) return
  saving.value = true
  error.value = null
  try {
    const payload: OrderingConfigDTO = {
      timezone: resolved.value.timezone,
      currency: resolved.value.currency,
      hours: parseHoursEditor(),
      slotMinutes: Math.max(5, Math.round(resolved.value.slotMinutes)),
      prepMinutes: Math.max(0, Math.round(resolved.value.prepMinutes)),
      maxOrdersPerSlot: Math.max(1, Math.round(resolved.value.maxOrdersPerSlot)),
      windowDays: Math.max(1, Math.round(resolved.value.windowDays)),
      pickupInstructions: resolved.value.pickupInstructions,
      notifyEmail: resolved.value.notifyEmail || undefined,
    }
    const next = await contentClient.saveOrderingConfig(siteId.value, payload)
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
    const res = await contentClient.setSiteAddOn(siteId.value, 'ordering', !addOnEnabled.value)
    addOnEnabled.value = res.addOns.includes('ordering')
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
  }
}

async function setOrderStatus(o: MealOrderDTO, status: MealOrderDTO['status']) {
  if (!siteId.value) return
  try {
    const updated = await contentClient.orderingUpdateOrder(siteId.value, o.id, status)
    const i = orders.value.findIndex(x => x.id === o.id)
    if (i >= 0) orders.value[i] = updated
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
  }
}

function money(cents?: number, currency?: string) {
  if (cents == null) return ''
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || resolved.value?.currency || 'USD' }).format(cents / 100)
}

function pickupLocal(iso: string) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: resolved.value?.timezone || 'America/Denver',
    dateStyle: 'medium', timeStyle: 'short',
  }).format(new Date(iso))
}

onMounted(load)
watch(siteId, load)
</script>

<template>
  <section class="adm-page">
    <header class="adm-page__head">
      <div>
        <span class="adm-eyebrow">Premium add-on</span>
        <h1 class="adm-title">Ordering</h1>
        <p class="adm-subtitle">
          Accept pickup orders from your menu. Define your hours, kitchen capacity,
          and items.
        </p>
      </div>
      <div class="head-actions">
        <button
          type="button"
          class="adm-btn"
          :class="addOnEnabled ? 'adm-btn--ghost' : 'adm-btn--primary'"
          @click="toggleAddOn"
        >{{ addOnEnabled ? 'Disable add-on' : 'Enable ordering' }}</button>
      </div>
    </header>

    <div v-if="!siteId" class="adm-empty">
      <p class="adm-empty__body">Select a site from the header to manage its ordering.</p>
    </div>

    <template v-else>
      <p v-if="error" class="adm-msg-err">{{ error }}</p>
      <p v-if="loading" class="adm-muted">Loading…</p>

      <div v-if="!addOnEnabled" class="adm-card adm-card--soft addon-gate">
        <p>
          The Ordering add-on is currently <strong>off</strong> for this site. Enable it
          above to start accepting orders.
        </p>
      </div>

      <section class="adm-card">
        <h2 class="adm-h2">Menu items</h2>
        <p class="adm-muted adm-mb">Items appear grouped by category on your ordering page.</p>

        <ul v-if="items.length" class="rm-list">
          <li v-for="p in items" :key="p.id" class="rm-row">
            <input class="adm-input rm-row__sku" v-model="p.sku" placeholder="SKU" />
            <input class="adm-input rm-row__name" v-model="p.name" placeholder="Name" />
            <input class="adm-input rm-row__cat" v-model="p.category" placeholder="Category" />
            <input class="adm-input rm-row__desc" v-model="p.description" placeholder="Description" />
            <input class="adm-input rm-row__price" type="number" min="0" step="1" v-model.number="p.priceCents" title="Price (cents)" />
            <input class="adm-input rm-row__img" v-model="p.imageUrl" placeholder="image url" />
            <label class="rm-row__active" :title="p.active ? 'Active' : 'Hidden'">
              <input type="checkbox" v-model="p.active" /> live
            </label>
            <button type="button" class="adm-btn adm-btn--primary adm-btn--sm" @click="saveItem(p)">Save</button>
            <button type="button" class="adm-btn adm-btn--ghost adm-btn--sm" @click="deleteItem(p)">×</button>
          </li>
        </ul>
        <p v-else class="adm-muted adm-mb">No menu items yet.</p>

        <div class="rm-row rm-row--new">
          <input class="adm-input rm-row__sku" v-model="newItem.sku" placeholder="SKU" />
          <input class="adm-input rm-row__name" v-model="newItem.name" placeholder="Name" />
          <input class="adm-input rm-row__cat" v-model="newItem.category" placeholder="Category" />
          <input class="adm-input rm-row__desc" v-model="newItem.description" placeholder="Description" />
          <input class="adm-input rm-row__price" type="number" min="0" step="1" v-model.number="newItem.priceCents" placeholder="cents" />
          <input class="adm-input rm-row__img" v-model="newItem.imageUrl" placeholder="image url" />
          <label class="rm-row__active">
            <input type="checkbox" v-model="newItem.active" /> live
          </label>
          <button type="button" class="adm-btn adm-btn--primary adm-btn--sm" @click="addItem">Add</button>
          <span />
        </div>
        <p class="adm-muted" style="font-size: 0.75rem; margin-top: 0.5rem;">
          Prices are in cents (e.g. <code>1200</code> = $12).
        </p>
      </section>

      <section v-if="resolved" class="adm-card">
        <h2 class="adm-h2">Ordering settings</h2>
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
            <span>Slot length (minutes)</span>
            <input class="adm-input" type="number" min="5" step="5" v-model.number="resolved.slotMinutes" />
          </label>
          <label class="adm-field">
            <span>Prep lead time (minutes)</span>
            <input class="adm-input" type="number" min="0" step="5" v-model.number="resolved.prepMinutes" />
          </label>
          <label class="adm-field">
            <span>Max orders per slot</span>
            <input class="adm-input" type="number" min="1" v-model.number="resolved.maxOrdersPerSlot" />
          </label>
          <label class="adm-field">
            <span>Window (days forward)</span>
            <input class="adm-input" type="number" min="1" max="60" v-model.number="resolved.windowDays" />
          </label>
          <label class="adm-field adm-field--full">
            <span>Pickup instructions</span>
            <textarea class="adm-input" rows="2" v-model="resolved.pickupInstructions" />
          </label>
          <label class="adm-field adm-field--full">
            <span>Notification email (optional)</span>
            <input class="adm-input" type="email" v-model="resolved.notifyEmail" />
          </label>
        </div>

        <h3 class="adm-h2" style="margin-top: 1rem; font-size: 0.95rem;">Pickup hours</h3>
        <p class="adm-muted" style="font-size: 0.8rem; margin: 0 0 0.5rem;">
          Format: <code>11:00-14:00, 17:00-21:00</code>. Leave blank for a closed day.
        </p>
        <div class="hours-grid">
          <label v-for="d in dayLabels" :key="d.idx" class="adm-field">
            <span>{{ d.label }}</span>
            <input class="adm-input" v-model="hoursEditor[d.idx]" placeholder="11:00-20:00" />
          </label>
        </div>
      </section>

      <div class="save-bar">
        <button type="button" class="adm-btn adm-btn--primary" :disabled="saving" @click="saveConfig">
          {{ saving ? 'Saving…' : 'Save settings' }}
        </button>
        <span v-if="savedAt" class="adm-muted">Saved {{ new Date(savedAt).toLocaleTimeString() }}</span>
      </div>

      <section class="adm-card">
        <h2 class="adm-h2">Orders</h2>
        <p v-if="!orders.length" class="adm-muted">No orders yet.</p>
        <table v-else class="adm-table">
          <thead>
            <tr><th>Pickup</th><th>Customer</th><th>Items</th><th>Total</th><th>Status</th><th /></tr>
          </thead>
          <tbody>
            <tr v-for="o in orders" :key="o.id">
              <td>{{ pickupLocal(o.pickupAt) }}</td>
              <td>
                {{ o.name }}<br />
                <small><a :href="`mailto:${o.email}`">{{ o.email }}</a><template v-if="o.phone"> · {{ o.phone }}</template></small>
              </td>
              <td>
                <div v-for="it in o.items" :key="it.menuItemId">
                  {{ it.name }} × {{ it.quantity }}<template v-if="it.notes"> <em>({{ it.notes }})</em></template>
                </div>
              </td>
              <td>{{ money(o.totalCents, o.currency) }}</td>
              <td>
                <span class="adm-badge" :class="o.status === 'cancelled' ? 'adm-badge--warn' : (o.status === 'completed' ? 'adm-badge--ok' : 'adm-badge--info')">{{ o.status }}</span>
              </td>
              <td class="order-actions">
                <button v-if="o.status === 'pending'" type="button" class="adm-btn adm-btn--ghost adm-btn--sm" @click="setOrderStatus(o, 'confirmed')">Confirm</button>
                <button v-if="o.status === 'confirmed'" type="button" class="adm-btn adm-btn--ghost adm-btn--sm" @click="setOrderStatus(o, 'ready')">Mark ready</button>
                <button v-if="o.status === 'ready'" type="button" class="adm-btn adm-btn--ghost adm-btn--sm" @click="setOrderStatus(o, 'completed')">Complete</button>
                <button v-if="o.status !== 'cancelled' && o.status !== 'completed'" type="button" class="adm-btn adm-btn--ghost adm-btn--sm" @click="setOrderStatus(o, 'cancelled')">Cancel</button>
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
.adm-h2 { margin: 0 0 0.4rem; font-size: 1.05rem; }
.adm-mb { margin-bottom: 0.75rem; }
.addon-gate { padding: 1rem 1.1rem; margin-bottom: 1rem; }

.rm-list { list-style: none; padding: 0; margin: 0 0 0.75rem; display: flex; flex-direction: column; gap: 0.35rem; }
.rm-row { display: grid; grid-template-columns: 6rem 9rem 7rem 1fr 5rem 1.2fr 3rem auto auto; gap: 0.3rem; align-items: center; }
.rm-row--new { padding-top: 0.5rem; border-top: 1px dashed var(--adm-border); }
.rm-row__active { display: flex; align-items: center; gap: 0.25rem; font-size: 0.78rem; color: var(--adm-text-subtle); }

.meta-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; }
.adm-field { display: flex; flex-direction: column; gap: 0.2rem; font-size: 0.8rem; color: var(--adm-text-subtle); }
.adm-field--full { grid-column: 1 / -1; }
.hours-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 0.4rem; }
@media (max-width: 800px) { .hours-grid { grid-template-columns: repeat(2, 1fr); } .meta-grid { grid-template-columns: 1fr; } }

.save-bar { display: flex; align-items: center; gap: 0.75rem; margin: 1rem 0 1.25rem; }

.adm-table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
.adm-table th, .adm-table td { text-align: left; padding: 0.55rem 0.5rem; border-bottom: 1px solid var(--adm-border); vertical-align: top; }
.adm-table th { color: var(--adm-text-subtle); font-weight: 600; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.06em; }
.order-actions { display: flex; flex-direction: column; gap: 0.25rem; }
</style>
