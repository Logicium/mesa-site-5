<script setup lang="ts">
// ─── Types ───────────────────────────────────────────────────────────────────
import { computed, onBeforeUnmount, onMounted, ref, watch, reactive } from 'vue'
import { contentClient } from '../../platform/contentClient'
import { useActiveSiteStore } from '../../platform/activeSiteStore'
import { tabsForArchetype, type TabId } from '../contentSchemas'
import AiCopyButton from '../components/AiCopyButton.vue'
import MapSearchPicker from '../components/MapSearchPicker.vue'
import TextAreaField from '../../components/forms/TextAreaField.vue'
import SelectInput from '../components/inputs/SelectInput.vue'
import SegmentedInput from '../components/inputs/SegmentedInput.vue'
import ImageInput from '../components/inputs/ImageInput.vue'
import ChipsInput from '../components/inputs/ChipsInput.vue'
import IconInput from '../components/inputs/IconInput.vue'
import { THEME_LIST } from '../../themes'
import { SWATCH_LIST } from '../../themes/swatches'
import { useToast } from '../composables/useToast'

const THEME_OPTIONS = THEME_LIST.map(t => ({ value: t.name, label: t.label }))
const SWATCH_OPTIONS = SWATCH_LIST.map(s => ({ value: s.name, label: s.label, hint: s.group }))
const VARIANT_OPTIONS = [
  { value: 'essentials', label: 'Essentials', hint: '6–8 photos' },
  { value: 'portfolio', label: 'Portfolio', hint: '12–16 photos' },
  { value: 'extended', label: 'Extended', hint: '20–28 photos' },
]

interface PhotoSlot { src: string; alt?: string; caption?: string }
interface MenuItem { name: string; description?: string; price: string; tags?: string[] }
interface MenuCategory { name: string; description?: string; items: MenuItem[] }
interface HourRow { day: string; open: string }
interface SocialLink { label: string; href: string }
interface FactRow { label: string; value: string }
interface Testimonial { quote: string; author: string; source?: string }
// Archetype-specific item types — these MIRROR the shapes the deployed
// templates read from siteConfig. The editors must write exactly these
// (a mismatched shape published here once clobbered template arrays and
// stranded live sites on the splash screen).
interface RoomItem    { name: string; blurb?: string; rateFrom?: string; image?: string; features?: string[] }
interface AmenityItem { icon?: string; label: string; description?: string }
interface ServiceItem { name: string; description?: string; price?: string; icon?: string }
interface CapabilityItem { label: string; value: string }
interface ProductItem { name: string; price?: string; blurb?: string; badge?: string; image?: string }
interface CategoryItem { name: string; image?: string; count?: string }
interface EventItem   { id?: string; title: string; date: string; startTime?: string; category?: string; priceLabel?: string; image?: string; blurb?: string }
interface PillarItem  { title: string; body?: string }

interface SiteContent {
  brand: string; tagline: string; blurb: string; favicon?: string; theme: string; swatch: string; variant: string
  contact: { address: string; phone: string; email: string; mapEmbedUrl?: string }
  hours: HourRow[]
  photos: { hero: PhotoSlot; about: PhotoSlot; gallery: PhotoSlot[] }
  story: { title: string; paragraphs: string[]; facts?: FactRow[] }
  // mesa
  menu: { intro?: string; categories: MenuCategory[]; fullMenuUrl?: string }
  // hearth
  rooms: RoomItem[]
  amenities: AmenityItem[]
  // keystone
  services: ServiceItem[]
  capabilities: CapabilityItem[]
  // vault
  featured: ProductItem[]
  categories: CategoryItem[]
  // marquee
  events: EventItem[]
  // project
  mission: { statement: string; pillars: PillarItem[] }
  testimonials: Testimonial[]
  reviewsSource: 'manual' | 'google'
  social: SocialLink[]
}

function blankContent(): SiteContent {
  return {
    brand: '', tagline: '', blurb: '', favicon: '', theme: 'studio', swatch: 'sand', variant: 'essentials',
    contact: { address: '', phone: '', email: '', mapEmbedUrl: '' },
    hours: [{ day: '', open: '' }],
    photos: { hero: { src: '', alt: '' }, about: { src: '', alt: '' }, gallery: [] },
    story: { title: '', paragraphs: [''], facts: [] },
    menu: { intro: '', categories: [], fullMenuUrl: '' },
    rooms: [],
    amenities: [],
    services: [],
    capabilities: [],
    featured: [],
    categories: [],
    events: [],
    mission:  { statement: '', pillars: [] },
    testimonials: [],
    reviewsSource: 'manual',
    social: [],
  }
}

const activeSites = useActiveSiteStore()
const siteId = computed(() => activeSites.activeId)
const archetype = computed(() => activeSites.activeSite?.archetype ?? '')
const tabs = computed(() => tabsForArchetype(archetype.value))
const activeTab = ref<TabId>('brand')
watch(tabs, (next) => {
  if (!next.some(t => t.id === activeTab.value)) activeTab.value = next[0]?.id ?? 'brand'
})

const version = ref(0)
const published = ref(false)
const uploading = ref<Record<string, boolean>>({})
const c = reactive<SiteContent>(blankContent())
const toast = useToast()

// ─── Version history dropdown state ──────────────────────────────────────────
const historyOpen = ref(false)
const historyLoading = ref(false)
interface VersionRow {
  version: number
  published: boolean
  publishedAt?: string
  createdAt: string
  changes?: { paths: string[]; count: number }
}
const historyItems = ref<VersionRow[]>([])
const restoringVersion = ref<number | null>(null)
const historyAnchor = ref<HTMLElement | null>(null)

function toggleHistory() {
  if (historyOpen.value) { historyOpen.value = false; return }
  void openHistory()
}

async function openHistory() {
  if (!siteId.value) return
  historyOpen.value = true
  historyLoading.value = true
  try {
    historyItems.value = await contentClient.listVersions(siteId.value)
  } catch (e) {
    toast.error(e instanceof Error ? e.message : String(e))
  } finally {
    historyLoading.value = false
  }
}

function onDocClick(e: MouseEvent) {
  if (!historyOpen.value) return
  const t = e.target as Node | null
  if (t && historyAnchor.value && !historyAnchor.value.contains(t)) historyOpen.value = false
}
function onDocKey(e: KeyboardEvent) {
  if (e.key === 'Escape') historyOpen.value = false
}
onMounted(() => {
  document.addEventListener('mousedown', onDocClick)
  document.addEventListener('keydown', onDocKey)
})
onBeforeUnmount(() => {
  document.removeEventListener('mousedown', onDocClick)
  document.removeEventListener('keydown', onDocKey)
})

async function restoreVersion(v: number) {
  if (!siteId.value) return
  if (!window.confirm(`Restore version ${v}? This publishes a new version with that content.`)) return
  restoringVersion.value = v
  try {
    const r = await contentClient.restoreVersion(siteId.value, v)
    toast.success(`Restored as v${r.version}`)
    historyOpen.value = false
    await loadDraft()
  } catch (e) {
    toast.error(e instanceof Error ? e.message : String(e))
  } finally {
    restoringVersion.value = null
  }
}

function formatStamp(s?: string): string {
  if (!s) return ''
  const d = new Date(s)
  return Number.isNaN(d.getTime()) ? s : d.toLocaleString()
}

/** Minimal context the AI prompt can reference. */
const aiContext = computed(() => ({
  brand: c.brand, tagline: c.tagline, blurb: c.blurb,
  archetype: archetype.value, theme: c.theme, swatch: c.swatch,
}))

function asRows<T>(v: unknown): T[] { return Array.isArray(v) ? (v as T[]) : [] }
function replaceRows<T>(target: T[], rows: T[]) { target.length = 0; target.push(...rows) }

/** Legacy admin drafts stored `{intro, items:[...]}` objects with different
    field names. Migrate them into the template-shaped arrays so old drafts
    load cleanly and the next publish writes the correct shape. */
function migrateRooms(raw: unknown): RoomItem[] {
  if (Array.isArray(raw)) {
    return raw.map((r: Record<string, unknown>) => ({
      name: String(r.name ?? ''),
      blurb: String(r.blurb ?? r.description ?? ''),
      rateFrom: String(r.rateFrom ?? r.rate ?? ''),
      image: String(r.image ?? r.photo ?? ''),
      features: Array.isArray(r.features) ? (r.features as string[]).map(String) : [],
    }))
  }
  if (raw && typeof raw === 'object') {
    return asRows<Record<string, unknown>>((raw as Record<string, unknown>).items).map(r => ({
      name: String(r.name ?? ''),
      blurb: String(r.description ?? ''),
      rateFrom: String(r.rate ?? ''),
      image: String(r.photo ?? ''),
      features: r.capacity ? [String(r.capacity)] : [],
    }))
  }
  return []
}

function migrateServices(raw: unknown): ServiceItem[] {
  if (Array.isArray(raw)) {
    return raw.map((s: Record<string, unknown>) => ({
      name: String(s.name ?? ''),
      description: String(s.description ?? ''),
      price: String(s.price ?? ''),
      icon: String(s.icon ?? ''),
    }))
  }
  if (raw && typeof raw === 'object') {
    return asRows<Record<string, unknown>>((raw as Record<string, unknown>).items).map(s => ({
      name: String(s.name ?? ''),
      description: String(s.description ?? ''),
      price: String(s.price ?? ''),
      icon: '',
    }))
  }
  return []
}

/** Legacy vault drafts used `products: {intro, items:[{name,description,price,photo}]}`. */
function migrateLegacyProducts(raw: unknown): ProductItem[] {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return []
  return asRows<Record<string, unknown>>((raw as Record<string, unknown>).items).map(p => ({
    name: String(p.name ?? ''),
    price: String(p.price ?? ''),
    blurb: String(p.description ?? ''),
    badge: '',
    image: String(p.photo ?? ''),
  }))
}

function applyPayload(raw: Record<string, unknown>) {
  const p = raw as Partial<SiteContent> & { products?: unknown }
  if (p.brand    !== undefined) c.brand    = p.brand    as string
  if (p.tagline  !== undefined) c.tagline  = p.tagline  as string
  if (p.blurb    !== undefined) c.blurb    = p.blurb    as string
  if (p.favicon  !== undefined) c.favicon  = p.favicon  as string
  if (p.theme    !== undefined) c.theme    = p.theme    as string
  if (p.swatch   !== undefined) c.swatch   = p.swatch   as string
  if (p.variant  !== undefined) c.variant  = p.variant  as string
  if (p.contact  !== undefined) Object.assign(c.contact, p.contact)
  if (p.hours    !== undefined) replaceRows(c.hours, asRows<HourRow>(p.hours))
  if (p.photos   !== undefined) Object.assign(c.photos,  p.photos)
  if (p.story    !== undefined) Object.assign(c.story,   p.story)
  if (p.menu     !== undefined) Object.assign(c.menu,    p.menu)
  if (p.rooms    !== undefined) replaceRows(c.rooms, migrateRooms(p.rooms))
  if (p.amenities !== undefined) replaceRows(c.amenities, asRows<AmenityItem>(p.amenities))
  if (p.services !== undefined) replaceRows(c.services, migrateServices(p.services))
  if (p.capabilities !== undefined) replaceRows(c.capabilities, asRows<CapabilityItem>(p.capabilities))
  if (p.featured !== undefined) replaceRows(c.featured, asRows<ProductItem>(p.featured))
  else if (p.products !== undefined) replaceRows(c.featured, migrateLegacyProducts(p.products))
  if (p.categories !== undefined) replaceRows(c.categories, asRows<CategoryItem>(p.categories))
  if (p.events   !== undefined) replaceRows(c.events, asRows<EventItem>(p.events))
  if (p.mission  !== undefined) Object.assign(c.mission,  p.mission)
  if (p.testimonials !== undefined) replaceRows(c.testimonials, asRows<Testimonial>(p.testimonials))
  if (p.reviewsSource !== undefined) c.reviewsSource = (p.reviewsSource === 'google' ? 'google' : 'manual')
  if (p.social   !== undefined) replaceRows(c.social, asRows<SocialLink>(p.social))
}

async function loadDraft() {
  if (!siteId.value) return
  try {
    const d = await contentClient.getDraft(siteId.value)
    version.value = d.version; published.value = d.published
    // Start from a clean slate: applyPayload only overwrites keys present in
    // the new payload, so without this the previous site's content bleeds
    // through when switching sites in the header.
    Object.assign(c, blankContent())
    applyPayload(d.payload)
  } catch (e) { toast.error(e instanceof Error ? e.message : String(e)) }
}

/** Only publish the archetype-specific keys this site actually uses — writing
    the other archetypes' (empty) keys would wipe template defaults on the
    live site the next time it hydrates. */
const ARCHETYPE_KEYS: Record<string, string[]> = {
  mesa: ['menu'],
  hearth: ['rooms', 'amenities'],
  keystone: ['services', 'capabilities'],
  vault: ['featured', 'categories'],
  marquee: ['events'],
  project: ['mission'],
}
const ALL_ARCHETYPE_KEYS = ['menu', 'rooms', 'amenities', 'services', 'capabilities', 'featured', 'categories', 'events', 'mission']

function payloadForSave(): Record<string, unknown> {
  const payload = JSON.parse(JSON.stringify(c)) as Record<string, unknown>
  const keep = new Set(ARCHETYPE_KEYS[(archetype.value || '').toLowerCase()] ?? ALL_ARCHETYPE_KEYS)
  for (const k of ALL_ARCHETYPE_KEYS) {
    if (!keep.has(k)) delete payload[k]
  }
  // Templates key events by id — derive one from the title when absent.
  if (Array.isArray(payload.events)) {
    payload.events = (payload.events as EventItem[]).map(e => ({
      ...e,
      id: e.id || e.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''),
    }))
  }
  return payload
}

async function save(publish = false) {
  try {
    const payload = payloadForSave()
    if (publish) {
      const r = await contentClient.publish(siteId.value, payload)
      version.value = r.version; published.value = true
      toast.success(`Published v${r.version}`)
    } else {
      const r = await contentClient.saveDraft(siteId.value, payload)
      version.value = r.version; published.value = false
      toast.success(`Draft saved · v${r.version}`)
    }
  } catch (e) { toast.error(e instanceof Error ? e.message : String(e)) }
}

// ─── Image upload ─────────────────────────────────────────────────────────────
// Upload the original file as-is. Canvas-based WebP re-encoding routinely
// produced larger files than the source (browsers can't beat the camera's
// own encoder on already-compressed JPEGs), so we skip it.

function readAsDataUrl(file: Blob): Promise<string> {
  return new Promise((res, rej) => {
    const fr = new FileReader()
    fr.onload = () => res(fr.result as string)
    fr.onerror = rej
    fr.readAsDataURL(file)
  })
}

/** Read the file's bytes into base64 and pass through its original mime / name. */
async function prepareImage(file: File): Promise<{ base64: string; contentType: string; filename: string }> {
  const dataUrl = await readAsDataUrl(file)
  return {
    base64: dataUrl.split(',')[1] ?? '',
    contentType: file.type || 'application/octet-stream',
    filename: file.name,
  }
}

async function uploadImage(slot: PhotoSlot, key: string, file: File) {
  uploading.value[key] = true
  try {
    const { base64, contentType, filename } = await prepareImage(file)
    const r = await contentClient.uploadMedia(siteId.value, filename, contentType, base64)
    slot.src = r.url
  } catch (e) { toast.error(e instanceof Error ? e.message : String(e)) }
  finally { uploading.value[key] = false }
}


/** Upload many gallery photos at once. Each file becomes a new gallery slot. */
async function onBulkGalleryFiles(evt: Event) {
  const input = evt.target as HTMLInputElement
  const files = Array.from(input.files ?? [])
  for (const file of files) {
    const slot: PhotoSlot = { src: '', alt: '' }
    c.photos.gallery.push(slot)
    const idx = c.photos.gallery.length - 1
    // Use the slot we just pushed; indexing back through the array yields
    // `PhotoSlot | undefined` under noUncheckedIndexedAccess.
    await uploadImage(slot, `g${idx}`, file)
  }
  input.value = ''
}

/** Upload the site's favicon (any image format the browser can read). */
async function onFaviconFile(evt: Event) {
  const input = evt.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  uploading.value['favicon'] = true
  try {
    // Skip the WebP re-encode — browsers want .ico/.png/.svg for favicons.
    const base64 = (await readAsDataUrl(file)).split(',')[1] ?? ''
    const r = await contentClient.uploadMedia(siteId.value, file.name, file.type || 'image/png', base64)
    c.favicon = r.url
    toast.success('Favicon uploaded')
  } catch (e) {
    toast.error(e instanceof Error ? e.message : String(e))
  } finally {
    uploading.value['favicon'] = false
    input.value = ''
  }
}

// ─── List helpers ─────────────────────────────────────────────────────────────
function addHour()                    { c.hours.push({ day: '', open: '' }) }
function removeHour(i: number)        { c.hours.splice(i, 1) }
function addParagraph()               { c.story.paragraphs.push('') }
function removeParagraph(i: number)   { c.story.paragraphs.splice(i, 1) }
function addFact()                    { c.story.facts = c.story.facts ?? []; c.story.facts.push({ label: '', value: '' }) }
function removeFact(i: number)        { c.story.facts!.splice(i, 1) }
function addTestimonial()             { c.testimonials.push({ quote: '', author: '', source: '' }) }
function removeTestimonial(i: number) { c.testimonials.splice(i, 1) }
function addSocial()                  { c.social.push({ label: '', href: '' }) }
function removeSocial(i: number)      { c.social.splice(i, 1) }
function addGallerySlot()             { c.photos.gallery.push({ src: '', alt: '' }) }
function removeGallerySlot(i: number) { c.photos.gallery.splice(i, 1) }
function addCategory()                { c.menu.categories.push({ name: '', description: '', items: [] }) }
function removeCategory(i: number)    { c.menu.categories.splice(i, 1) }
function addMenuItem(cat: MenuCategory)              { cat.items.push({ name: '', description: '', price: '', tags: [] }) }
function removeMenuItem(cat: MenuCategory, i: number){ cat.items.splice(i, 1) }

// Archetype-specific helpers
function addRoom()    { c.rooms.push({ name: '', blurb: '', rateFrom: '', image: '', features: [] }) }
function removeRoom(i: number) { c.rooms.splice(i, 1) }
function addAmenity() { c.amenities.push({ icon: '', label: '', description: '' }) }
function removeAmenity(i: number) { c.amenities.splice(i, 1) }
function addService() { c.services.push({ name: '', description: '', price: '', icon: '' }) }
function removeService(i: number) { c.services.splice(i, 1) }
function addCapability() { c.capabilities.push({ label: '', value: '' }) }
function removeCapability(i: number) { c.capabilities.splice(i, 1) }
function addProduct() { c.featured.push({ name: '', price: '', blurb: '', badge: '', image: '' }) }
function removeProduct(i: number) { c.featured.splice(i, 1) }
function addShopCategory() { c.categories.push({ name: '', image: '', count: '' }) }
function removeShopCategory(i: number) { c.categories.splice(i, 1) }
function addEvent()   { c.events.push({ title: '', date: '', startTime: '', category: '', priceLabel: '', image: '', blurb: '' }) }
function removeEvent(i: number) { c.events.splice(i, 1) }
function addPillar()  { c.mission.pillars.push({ title: '', body: '' }) }
function removePillar(i: number)  { c.mission.pillars.splice(i, 1) }


/** Upload a PDF (or any non-image) to blob storage and store the URL on `c.menu.fullMenuUrl`. */
async function onMenuPdfFile(evt: Event) {
  const input = evt.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  if (file.type !== 'application/pdf') {
    toast.error('Please choose a PDF file.')
    input.value = ''
    return
  }
  uploading.value['menuPdf'] = true
  try {
    const base64 = (await readAsDataUrl(file)).split(',')[1] ?? ''
    const r = await contentClient.uploadMedia(siteId.value, file.name, 'application/pdf', base64)
    c.menu.fullMenuUrl = r.url
    toast.success('Menu PDF uploaded')
  } catch (e) {
    toast.error(e instanceof Error ? e.message : String(e))
  } finally {
    uploading.value['menuPdf'] = false
    input.value = ''
  }
}

onMounted(async () => {
  if (!activeSites.sites.length) { try { await activeSites.refresh() } catch { /* ignore */ } }
  await loadDraft()
})
watch(siteId, loadDraft)
</script>

<template>
  <section class="cv">
    <div class="cv-header">
      <h1>Content</h1>
      <div class="cv-header__right">
        <div v-if="siteId" ref="historyAnchor" class="history-wrap">
          <button
            type="button"
            class="version-chip"
            :title="'View version history'"
            :aria-expanded="historyOpen"
            @click="toggleHistory"
          >v{{ version }} · {{ published ? 'published' : 'draft' }}<span class="version-chip__caret" aria-hidden="true">▾</span></button>

          <div v-if="historyOpen" class="history-dd" role="menu">
            <header class="history-dd__head">
              <strong>Version history</strong>
              <button type="button" class="history-dd__close" @click="historyOpen = false" aria-label="Close">×</button>
            </header>
            <p v-if="historyLoading" class="meta">Loading…</p>
            <p v-else-if="historyItems.length === 0" class="meta">No versions yet.</p>
            <ul v-else class="version-list">
              <li
                v-for="row in historyItems"
                :key="row.version"
                class="version-row"
                :class="{ 'version-row--current': row.version === version }"
              >
                <div class="version-row__main">
                  <span class="version-row__num">v{{ row.version }}</span>
                  <span
                    class="version-row__badge"
                    :class="row.published ? 'badge--pub' : 'badge--draft'"
                  >{{ row.published ? 'published' : 'draft' }}</span>
                  <span class="version-row__stamp">
                    {{ formatStamp(row.publishedAt || row.createdAt) }}
                  </span>
                </div>
                <div
                  v-if="row.changes && row.changes.paths.length"
                  class="version-row__changes"
                  :title="`${row.changes.count} field${row.changes.count === 1 ? '' : 's'} changed`"
                >
                  <span
                    v-for="p in row.changes.paths"
                    :key="p"
                    class="change-chip"
                  >{{ p }}</span>
                  <span
                    v-if="row.changes.count > row.changes.paths.length"
                    class="change-chip change-chip--more"
                  >+{{ row.changes.count - row.changes.paths.length }} more</span>
                </div>
                <div v-else-if="row.changes" class="version-row__changes meta">Initial version</div>
                <button
                  type="button"
                  class="btn-primary version-row__btn"
                  :disabled="restoringVersion !== null || row.version === version"
                  @click="restoreVersion(row.version)"
                >
                  <template v-if="restoringVersion === row.version">Restoring…</template>
                  <template v-else-if="row.version === version">Current</template>
                  <template v-else>Restore</template>
                </button>
              </li>
            </ul>
          </div>
        </div>
        <button type="button" @click="save(false)">Save draft</button>
        <button type="button" class="btn-primary" @click="save(true)">Publish</button>
      </div>
    </div>
    <p v-if="!siteId" class="err">Select a site from the header dropdown.</p>

    <div v-if="siteId" class="cv-body">
      <!-- Tab bar -->
      <nav class="cv-tabs" role="tablist">
        <button
          v-for="t in tabs"
          :key="t.id"
          type="button"
          role="tab"
          :aria-selected="activeTab === t.id"
          class="cv-tab"
          :class="{ 'cv-tab--active': activeTab === t.id }"
          @click="activeTab = t.id"
        >{{ t.label }}</button>
      </nav>

      <!-- ── Brand ── -->
      <fieldset v-if="activeTab === 'brand'">
        <legend>Brand</legend>
        <div class="row-2">
          <label>
            <span class="lbl-row">Business name
              <AiCopyButton :site-id="siteId" field="brand" prompt="A short business / brand name" :context="aiContext" @pick="(v) => c.brand = v" />
            </span>
            <input v-model="c.brand" />
          </label>
          <label>
            <span class="lbl-row">Tagline
              <AiCopyButton :site-id="siteId" field="tagline" prompt="A short, evocative tagline under 12 words" :context="aiContext" @pick="(v) => c.tagline = v" />
            </span>
            <input v-model="c.tagline" />
          </label>
        </div>
        <label>
          <span class="lbl-row">Short blurb (meta description &amp; intro paragraph)
            <AiCopyButton :site-id="siteId" field="blurb" prompt="A warm, concrete 2-3 sentence blurb under 60 words" :context="aiContext" @pick="(v) => c.blurb = v" />
          </span>
          <TextAreaField v-model="c.blurb" :rows="3" :maxlength="280" />
        </label>
        <label>Browser tab icon (favicon)
          <div class="favicon-row">
            <img v-if="c.favicon" :src="c.favicon" class="favicon-thumb" alt="Current favicon" />
            <div v-else class="favicon-thumb favicon-thumb--empty" aria-hidden="true">ico</div>
            <label class="file-btn">{{ uploading['favicon'] ? 'Uploading…' : (c.favicon ? 'Replace' : 'Upload') }}
              <input type="file" accept="image/png,image/x-icon,image/svg+xml,image/vnd.microsoft.icon" :disabled="!!uploading['favicon']" @change="onFaviconFile" />
            </label>
            <input v-model="c.favicon" placeholder="or paste URL (.ico / .png / .svg)" class="flex-1" />
            <button v-if="c.favicon" type="button" class="btn-remove btn-remove--icon" :title="'Clear favicon'" @click="c.favicon = ''">×</button>
          </div>
        </label>
        <div class="row-3">
          <SelectInput v-model="c.theme" label="Theme" :options="THEME_OPTIONS" />
          <SelectInput v-model="c.swatch" label="Swatch" :options="SWATCH_OPTIONS" />
          <SelectInput v-model="c.variant" label="Variant" :options="VARIANT_OPTIONS" />
        </div>
      </fieldset>

      <!-- ── Contact ── -->
      <fieldset v-if="activeTab === 'contact'">
        <legend>Contact</legend>
        <div class="row-2">
          <label>Phone<input v-model="c.contact.phone" /></label>
          <label>Email<input v-model="c.contact.email" type="email" /></label>
        </div>
        <label>Address &amp; map
          <MapSearchPicker
            :address="c.contact.address"
            :embed-url="c.contact.mapEmbedUrl"
            @update:address="v => c.contact.address = v"
            @update:embed-url="v => c.contact.mapEmbedUrl = v"
          />
        </label>
      </fieldset>

      <!-- ── Hours ── -->
      <fieldset v-if="activeTab === 'hours'">
        <legend>Hours</legend>
        <div v-for="(h, i) in c.hours" :key="i" class="list-row">
          <input v-model="h.day"  placeholder="Day / range (e.g. Tuesday – Thursday)" class="flex-3" />
          <input v-model="h.open" placeholder="Hours or 'Closed'" class="flex-2" />
          <button type="button" class="btn-remove btn-remove--icon" @click="removeHour(i)">×</button>
        </div>
        <button type="button" class="btn-add" @click="addHour">+ Add row</button>
      </fieldset>

      <!-- ── Photos ── -->
      <fieldset v-if="activeTab === 'photos'">
        <legend>Photos</legend>

        <div class="photo-row">
          <div class="photo-slot">
            <ImageInput v-model="c.photos.hero.src" :site-id="siteId" label="Hero image" hint="16:9 · 2400px wide" />
            <input v-model="c.photos.hero.alt" placeholder="Alt text" />
            <input v-model="c.photos.hero.caption" placeholder="Caption (optional)" />
          </div>
          <div class="photo-slot">
            <ImageInput v-model="c.photos.about.src" :site-id="siteId" label="About image" hint="Portrait or 4:5" aspect="4 / 5" />
            <input v-model="c.photos.about.alt" placeholder="Alt text" />
            <input v-model="c.photos.about.caption" placeholder="Caption (optional)" />
          </div>
        </div>

        <p class="section-sub">Gallery <span class="hint">6–8 for essentials · 12–16 for portfolio · 20–28 for extended</span></p>
        <div class="gallery-grid">
          <div v-for="(g, i) in c.photos.gallery" :key="i" class="photo-slot photo-slot--sm">
            <ImageInput v-model="g.src" :site-id="siteId" aspect="1 / 1" />
            <input v-model="g.alt" placeholder="Alt text" />
            <button type="button" class="btn-remove btn-remove--inline" @click="removeGallerySlot(i)">Remove</button>
          </div>
        </div>
        <div class="gallery-actions">
          <button type="button" class="btn-add" @click="addGallerySlot">+ Add gallery photo</button>
          <label class="file-btn file-btn--accent">+ Upload multiple
            <input type="file" accept="image/*" multiple @change="onBulkGalleryFiles" />
          </label>
        </div>
      </fieldset>

      <!-- ── Story / About ── -->
      <fieldset v-if="activeTab === 'story'">
        <legend>Story / About section</legend>
        <label>Section heading<input v-model="c.story.title" /></label>
        <div v-for="(_, i) in c.story.paragraphs" :key="i" class="paragraph-row">
          <div class="paragraph-row__head">
            <span class="paragraph-row__label">Paragraph {{ i + 1 }}</span>
            <div class="paragraph-row__actions">
              <AiCopyButton :site-id="siteId" :field="`story paragraph ${i + 1}`" prompt="A single paragraph (~60 words) for the About section" :context="aiContext" @pick="(v) => c.story.paragraphs[i] = v" />
              <button type="button" class="btn-remove btn-remove--icon" :title="'Remove paragraph'" @click="removeParagraph(i)">×</button>
            </div>
          </div>
          <TextAreaField v-model="c.story.paragraphs[i]" :rows="4" :maxlength="600" placeholder="Paragraph text…" />
        </div>
        <button type="button" class="btn-add" @click="addParagraph">+ Add paragraph</button>

        <p class="section-sub">Stats / facts <span class="hint">optional — displayed as a highlight bar</span></p>
        <div v-for="(f, i) in (c.story.facts ?? [])" :key="i" class="list-row">
          <input v-model="f.label" placeholder="Label (e.g. Founded)" class="flex-1" />
          <input v-model="f.value" placeholder="Value (e.g. 2024)" class="flex-1" />
          <button type="button" class="btn-remove btn-remove--icon" @click="removeFact(i)">×</button>
        </div>
        <button type="button" class="btn-add" @click="addFact">+ Add stat</button>
      </fieldset>

      <!-- ── Menu (mesa) ── -->
      <fieldset v-if="activeTab === 'menu'">
        <legend>Menu</legend>
        <div class="row-2">
          <label>Menu intro line<input v-model="c.menu.intro" placeholder="Updated weekly with…" /></label>
          <label>Full menu PDF
            <div class="pdf-upload">
              <input
                type="file"
                accept="application/pdf"
                :disabled="uploading['menuPdf']"
                @change="onMenuPdfFile"
              />
              <a v-if="c.menu.fullMenuUrl" :href="c.menu.fullMenuUrl" target="_blank" rel="noopener" class="pdf-upload__link">View current PDF</a>
              <button
                v-if="c.menu.fullMenuUrl"
                type="button"
                class="pdf-upload__clear"
                @click="c.menu.fullMenuUrl = ''"
              >Remove</button>
              <span v-if="uploading['menuPdf']" class="meta">Uploading…</span>
            </div>
          </label>
        </div>

        <div v-for="(cat, ci) in c.menu.categories" :key="ci" class="menu-cat">
          <div class="menu-cat__header">
            <input v-model="cat.name" placeholder="Category (e.g. Small)" class="flex-2" />
            <input v-model="cat.description" placeholder="Short description (optional)" class="flex-3" />
            <button type="button" class="btn-remove" @click="removeCategory(ci)">Remove category</button>
          </div>
          <div v-for="(item, ii) in cat.items" :key="ii" class="menu-item">
            <input v-model="item.name" placeholder="Dish name" class="flex-2" />
            <input v-model="item.description" placeholder="Description" class="flex-3" />
            <input v-model="item.price" placeholder="$0" style="max-width:80px" />
            <div style="min-width: 150px">
              <ChipsInput :model-value="item.tags ?? []" placeholder="V, GF…" @update:model-value="(v: string[]) => item.tags = v" />
            </div>
            <button type="button" class="btn-remove btn-remove--icon" @click="removeMenuItem(cat, ii)">×</button>
          </div>
          <button type="button" class="btn-add btn-add--indent" @click="addMenuItem(cat)">+ Add item</button>
        </div>
        <button type="button" class="btn-add" @click="addCategory">+ Add category</button>
      </fieldset>

      <!-- ── Rooms (hearth) ── -->
      <fieldset v-if="activeTab === 'rooms'">
        <legend>Rooms</legend>
        <div v-for="(r, i) in c.rooms" :key="i" class="testimonial-row">
          <div class="row-2">
            <input v-model="r.name" placeholder="Room name (e.g. Mountain Suite)" />
            <input v-model="r.rateFrom" placeholder="Rate from (e.g. $180)" />
          </div>
          <ChipsInput
            :model-value="r.features ?? []"
            placeholder="Add a feature (King bed, Sleeps 2…)"
            @update:model-value="(v: string[]) => r.features = v"
          />
          <div class="field-with-ai">
            <TextAreaField v-model="r.blurb" :rows="2" :maxlength="300" placeholder="Short description…" />
            <AiCopyButton :site-id="siteId" :field="`room: ${r.name || 'room'}`" prompt="A short, warm room description (~25 words)" :context="aiContext" @pick="(v) => r.blurb = v" />
          </div>
          <ImageInput
            :model-value="r.image ?? ''"
            :site-id="siteId"
            @update:model-value="(v: string) => r.image = v"
          />
          <button type="button" class="btn-remove" @click="removeRoom(i)">Remove room</button>
        </div>
        <button type="button" class="btn-add" @click="addRoom">+ Add room</button>

        <p class="section-sub">Amenities <span class="hint">included with every stay</span></p>
        <div v-for="(a, i) in c.amenities" :key="i" class="list-row">
          <div style="width: 140px; flex-shrink: 0">
            <IconInput :model-value="a.icon ?? ''" @update:model-value="(v: string) => a.icon = v" />
          </div>
          <input v-model="a.label" placeholder="Label (e.g. High-speed Wi-Fi)" />
          <input v-model="a.description" placeholder="Short description (optional)" class="flex-1" />
          <button type="button" class="btn-remove" @click="removeAmenity(i)">✕</button>
        </div>
        <button type="button" class="btn-add" @click="addAmenity">+ Add amenity</button>
      </fieldset>

      <!-- ── Services (keystone) ── -->
      <fieldset v-if="activeTab === 'services'">
        <legend>Services</legend>
        <div v-for="(s, i) in c.services" :key="i" class="testimonial-row">
          <div class="row-2">
            <input v-model="s.name" placeholder="Service name" />
            <input v-model="s.price" placeholder="Price (e.g. From $120)" />
          </div>
          <div style="max-width: 160px">
            <IconInput :model-value="s.icon ?? ''" @update:model-value="(v: string) => s.icon = v" />
          </div>
          <div class="field-with-ai">
            <TextAreaField v-model="s.description" :rows="2" :maxlength="300" placeholder="Description…" />
            <AiCopyButton :site-id="siteId" :field="`service: ${s.name || 'service'}`" prompt="A short, concrete service description (~30 words)" :context="aiContext" @pick="(v) => s.description = v" />
          </div>
          <button type="button" class="btn-remove" @click="removeService(i)">Remove service</button>
        </div>
        <button type="button" class="btn-add" @click="addService">+ Add service</button>

        <p class="section-sub">Capabilities <span class="hint">trust-bar stats (e.g. Years in business: 15+)</span></p>
        <div v-for="(cap, i) in c.capabilities" :key="i" class="list-row">
          <input v-model="cap.label" placeholder="Label (e.g. Years in business)" />
          <input v-model="cap.value" placeholder="Value (e.g. 15+)" class="flex-1" />
          <button type="button" class="btn-remove" @click="removeCapability(i)">✕</button>
        </div>
        <button type="button" class="btn-add" @click="addCapability">+ Add capability</button>
      </fieldset>

      <!-- ── Products (vault) ── -->
      <fieldset v-if="activeTab === 'products'">
        <legend>Featured products</legend>
        <div v-for="(p, i) in c.featured" :key="i" class="testimonial-row">
          <div class="row-2">
            <input v-model="p.name" placeholder="Product name" />
            <input v-model="p.price" placeholder="Price (e.g. $28)" />
          </div>
          <input v-model="p.badge" placeholder="Badge (optional — New · Local · Sale)" />
          <div class="field-with-ai">
            <TextAreaField v-model="p.blurb" :rows="2" :maxlength="300" placeholder="Short description…" />
            <AiCopyButton :site-id="siteId" :field="`product: ${p.name || 'product'}`" prompt="A short, tactile product description (~20 words)" :context="aiContext" @pick="(v) => p.blurb = v" />
          </div>
          <ImageInput
            :model-value="p.image ?? ''"
            :site-id="siteId"
            aspect="1 / 1"
            @update:model-value="(v: string) => p.image = v"
          />
          <button type="button" class="btn-remove" @click="removeProduct(i)">Remove product</button>
        </div>
        <button type="button" class="btn-add" @click="addProduct">+ Add product</button>

        <p class="section-sub">Shop categories</p>
        <div v-for="(cat, i) in c.categories" :key="i" class="list-row">
          <input v-model="cat.name" placeholder="Category name (e.g. Apparel)" />
          <input v-model="cat.count" placeholder="Item count" style="max-width:110px" />
          <input v-model="cat.image" placeholder="Image URL" class="flex-1" />
          <button type="button" class="btn-remove" @click="removeShopCategory(i)">✕</button>
        </div>
        <button type="button" class="btn-add" @click="addShopCategory">+ Add category</button>
      </fieldset>

      <!-- ── Events (marquee) ── -->
      <fieldset v-if="activeTab === 'events'">
        <legend>Events</legend>
        <div v-for="(e, i) in c.events" :key="i" class="testimonial-row">
          <div class="row-2">
            <input v-model="e.title" placeholder="Event title" />
            <input v-model="e.date" type="date" />
          </div>
          <div class="row-2">
            <input v-model="e.startTime" placeholder="Start time (e.g. 7:30 PM)" />
            <input v-model="e.priceLabel" placeholder="Price label (e.g. $25 · Free)" />
          </div>
          <input v-model="e.category" placeholder="Category (Music · Comedy · Gallery)" />
          <div class="field-with-ai">
            <TextAreaField v-model="e.blurb" :rows="2" :maxlength="300" placeholder="One line that sells the night…" />
            <AiCopyButton :site-id="siteId" :field="`event: ${e.title || 'event'}`" prompt="A punchy one-line event description (~20 words)" :context="aiContext" @pick="(v) => e.blurb = v" />
          </div>
          <ImageInput
            :model-value="e.image ?? ''"
            :site-id="siteId"
            @update:model-value="(v: string) => e.image = v"
          />
          <button type="button" class="btn-remove" @click="removeEvent(i)">Remove event</button>
        </div>
        <button type="button" class="btn-add" @click="addEvent">+ Add event</button>
      </fieldset>

      <!-- ── Mission (project) ── -->
      <fieldset v-if="activeTab === 'mission'">
        <legend>Mission</legend>
        <label>
          <span class="lbl-row">Mission statement
            <AiCopyButton :site-id="siteId" field="mission statement" prompt="A 1-2 sentence mission statement under 40 words" :context="aiContext" @pick="(v) => c.mission.statement = v" />
          </span>
          <TextAreaField v-model="c.mission.statement" :rows="3" :maxlength="240" />
        </label>
        <p class="section-sub">Pillars</p>
        <div v-for="(pi, i) in c.mission.pillars" :key="i" class="testimonial-row">
          <input v-model="pi.title" placeholder="Pillar title" />
          <div class="field-with-ai">
            <TextAreaField v-model="pi.body" :rows="2" :maxlength="200" placeholder="Body text…" />
            <AiCopyButton :site-id="siteId" :field="`pillar: ${pi.title || 'pillar'}`" prompt="A short pillar description (~25 words)" :context="aiContext" @pick="(v) => pi.body = v" />
          </div>
          <button type="button" class="btn-remove" @click="removePillar(i)">Remove pillar</button>
        </div>
        <button type="button" class="btn-add" @click="addPillar">+ Add pillar</button>
      </fieldset>

      <!-- ── Testimonials ── -->
      <fieldset v-if="activeTab === 'testimonials'">
        <legend>Testimonials</legend>
        <div class="reviews-source">
          <SegmentedInput
            v-model="c.reviewsSource"
            label="Show on the public site"
            :options="[
              { value: 'manual', label: 'Hand-written testimonials' },
              { value: 'google', label: 'Live Google reviews' },
            ]"
            hint="Live reviews pull from the business connected on the Google Reviews page. If none are available, the public site falls back to the hand-written list below."
          />
        </div>
        <div v-for="(t, i) in c.testimonials" :key="i" class="testimonial-row">
          <TextAreaField v-model="t.quote" :rows="2" :maxlength="400" placeholder="Quote…" />
          <div class="row-2">
            <input v-model="t.author" placeholder="Author name" />
            <input v-model="t.source" placeholder="Source (Google, Yelp…)" />
          </div>
          <button type="button" class="btn-remove" @click="removeTestimonial(i)">Remove</button>
        </div>
        <button type="button" class="btn-add" @click="addTestimonial">+ Add testimonial</button>
      </fieldset>

      <!-- ── Social ── -->
      <fieldset v-if="activeTab === 'social'">
        <legend>Social links</legend>
        <div v-for="(s, i) in c.social" :key="i" class="list-row">
          <input v-model="s.label" placeholder="Label (Instagram, Facebook…)" class="flex-1" />
          <input v-model="s.href"  placeholder="https://…" class="flex-3" />
          <button type="button" class="btn-remove btn-remove--icon" @click="removeSocial(i)">×</button>
        </div>
        <button type="button" class="btn-add" @click="addSocial">+ Add link</button>
      </fieldset>

      <!-- ── Bottom save bar ── -->
      <div class="save-bar">
        <button type="button" @click="save(false)">Save draft</button>
        <button type="button" class="btn-primary" @click="save(true)">Publish</button>
      </div>

    </div>
    <p v-else class="meta">Select a site above to begin editing.</p>
  </section>
</template>

<style scoped>
.cv { max-width: 900px; }

/* Header */
.cv-header { display: flex; align-items: baseline; justify-content: space-between; flex-wrap: wrap; gap: 0.75rem; margin-bottom: 1.5rem; }
.cv-header h1 { margin: 0; font-family: var(--adm-font-serif); font-weight: 500; }
.cv-header__right { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; }

/* Version chip is a button that opens the history dropdown. */
.history-wrap { position: relative; display: inline-block; }
.version-chip {
  font: inherit; font-size: 0.78rem; letter-spacing: 0.04em;
  display: inline-flex; align-items: center; gap: 0.3rem;
  padding: 0.3rem 0.65rem;
  background: var(--adm-surface-2); color: var(--adm-text-muted);
  border: 1px solid var(--adm-border); border-radius: 999px;
  cursor: pointer;
  transition: color 140ms ease, border-color 140ms ease, background 140ms ease;
}
.version-chip:hover {
  color: var(--adm-text);
  border-color: var(--adm-accent);
  background: var(--adm-surface-3);
}
.version-chip__caret { font-size: 0.65rem; opacity: 0.7; }
.version-chip[aria-expanded="true"] { color: var(--adm-text); border-color: var(--adm-accent); }

/* Custom dropdown anchored under the version chip. */
.history-dd {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  z-index: 50;
  width: min(440px, calc(100vw - 2rem));
  max-height: min(70vh, 560px);
  display: flex; flex-direction: column;
  background: var(--adm-surface);
  border: 1px solid var(--adm-border);
  border-radius: var(--adm-radius, 10px);
  box-shadow: 0 18px 50px rgba(0,0,0,0.45);
  overflow: hidden;
}
.history-dd__head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 0.65rem 0.85rem;
  border-bottom: 1px solid var(--adm-border);
  font-family: var(--adm-font-serif);
}
.history-dd__close {
  background: transparent; border: 0; color: var(--adm-text-muted);
  font-size: 1.25rem; line-height: 1; cursor: pointer; padding: 0 0.25rem;
}
.history-dd__close:hover { color: var(--adm-text); }
.history-dd .meta { padding: 0.85rem; margin: 0; }

/* Version history list */
.version-list { list-style: none; padding: 0.5rem; margin: 0; display: flex; flex-direction: column; gap: 0.4rem; overflow: auto; }
.version-row {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 0.45rem 0.75rem;
  padding: 0.55rem 0.7rem;
  background: var(--adm-surface-2);
  border: 1px solid var(--adm-border);
  border-radius: var(--adm-radius, 8px);
}
.version-row--current { border-color: var(--adm-accent); }
.version-row__main { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
.version-row__num { font-weight: 600; }
.version-row__badge {
  font-size: 0.65rem; letter-spacing: 0.06em; text-transform: uppercase;
  padding: 0.1rem 0.4rem; border-radius: 999px;
}
.badge--pub   { background: color-mix(in srgb, var(--adm-accent) 22%, transparent); color: var(--adm-accent-soft, var(--adm-accent)); }
.badge--draft { background: var(--adm-surface-3); color: var(--adm-text-muted); }
.version-row__stamp { font-size: 0.78rem; color: var(--adm-text-muted); }
.version-row__btn { grid-column: 2; grid-row: 1 / span 2; align-self: center; }
.version-row__btn:disabled { opacity: 0.55; cursor: default; }
.version-row__changes {
  grid-column: 1;
  display: flex; flex-wrap: wrap; gap: 0.25rem;
  font-size: 0.72rem;
}
.change-chip {
  font-family: var(--adm-font-mono, ui-monospace, monospace);
  padding: 0.1rem 0.4rem;
  background: var(--adm-surface-3);
  border: 1px solid var(--adm-border);
  border-radius: 4px;
  color: var(--adm-text-muted);
}
.change-chip--more { background: transparent; border-style: dashed; }
.cv-site-select select {
  padding: 0.35rem 0.6rem;
  background: var(--adm-surface-2); color: var(--adm-text);
  border: 1px solid var(--adm-border); border-radius: var(--adm-radius-sm, 6px);
  font: inherit;
}

/* Body */
.cv-body { display: flex; flex-direction: column; gap: 1.5rem; }

/* Tabs */
.cv-tabs {
  display: flex; flex-wrap: wrap; gap: 0.25rem;
  border-bottom: 1px solid var(--adm-border);
  margin-bottom: 0.25rem;
}
.cv-tab {
  padding: 0.5rem 0.95rem;
  background: transparent;
  border: 1px solid transparent;
  border-bottom: none;
  border-radius: 8px 8px 0 0;
  color: var(--adm-text-muted);
  font: inherit; font-size: 0.82rem; font-weight: 600;
  letter-spacing: 0.04em;
  cursor: pointer;
  margin-bottom: -1px;
  transition: color 140ms ease, background 140ms ease, border-color 140ms ease;
}
.cv-tab:hover { color: var(--adm-accent); background: transparent; border-color: transparent; }
.cv-tab--active {
  color: var(--adm-text);
  background: var(--adm-surface);
  border-color: var(--adm-border);
  border-bottom-color: var(--adm-surface);
}

/* Label with inline AI button */
.lbl-row { display: inline-flex; align-items: center; gap: 0.5rem; }

/* Fieldsets */
fieldset {
  border: 1px solid var(--adm-border);
  background: var(--adm-surface);
  border-radius: var(--adm-radius, 10px);
  padding: 1.1rem 1.35rem;
}
legend {
  font-size: 0.78rem; font-weight: 700;
  padding: 0 0.45rem; color: var(--adm-text-muted);
  text-transform: uppercase; letter-spacing: 0.1em;
}
label {
  display: block; font-size: 0.78rem;
  color: var(--adm-text-muted);
  margin-bottom: 0.8rem;
  font-weight: 600; letter-spacing: 0.03em;
}

/* Inputs */
input, textarea, select {
  display: block; width: 100%; margin-top: 0.3rem;
  padding: 0.5rem 0.7rem;
  background: var(--adm-surface-2);
  color: var(--adm-text);
  border: 1px solid var(--adm-border);
  border-radius: var(--adm-radius-sm, 6px);
  font: inherit; font-size: 0.9rem;
  box-sizing: border-box;
  transition: border-color 140ms ease, box-shadow 140ms ease;
}
input:focus, textarea:focus, select:focus {
  outline: none;
  border-color: var(--adm-accent);
  box-shadow: 0 0 0 3px var(--adm-accent-glow);
}
textarea { resize: vertical; }

/* Grid */
.row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
.row-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.75rem; }

/* List rows — align children to bottom so a row's delete button shares
   its baseline with the inputs in the same row. */
.list-row { display: flex; align-items: end; gap: 0.5rem; margin-bottom: 0.5rem; }
.flex-1 { flex: 1; }
.flex-2 { flex: 2; }
.flex-3 { flex: 3; }

/* Buttons */
button {
  padding: 0.45rem 0.95rem;
  border-radius: var(--adm-radius-sm, 6px);
  border: 1px solid var(--adm-border-strong);
  background: var(--adm-surface-2);
  color: var(--adm-text);
  cursor: pointer; font: inherit;
  font-size: 0.85rem; white-space: nowrap;
  transition: background 140ms ease, border-color 140ms ease, color 140ms ease;
}
button:hover { border-color: var(--adm-accent); color: var(--adm-accent); }
.btn-primary {
  background: var(--adm-accent);
  color: var(--adm-bg);
  font-weight: 700;
  border-color: var(--adm-accent);
  letter-spacing: 0.02em;
}
.btn-primary:hover { background: var(--adm-accent-deep); border-color: var(--adm-accent-deep); color: var(--adm-bg); }
.btn-remove {
  padding: 0.3rem 0.65rem;
  background: transparent;
  border-color: color-mix(in srgb, var(--adm-danger) 45%, var(--adm-border));
  color: var(--adm-danger);
}
.btn-remove:hover { background: color-mix(in srgb, var(--adm-danger) 12%, transparent); border-color: var(--adm-danger); color: var(--adm-danger); }
.btn-remove--inline { align-self: flex-end; margin-top: 0.25rem; }
/* Square \u00d7 button sized to match a single-line input's outer height. */
.btn-remove--icon {
  width: 2.4rem;
  height: 2.4rem;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 1.15rem;
  line-height: 1;
  flex-shrink: 0;
  box-sizing: border-box;
}

/* Story paragraph block \u2014 puts AI / remove controls in a header above a full-width textarea. */
.paragraph-row { margin-bottom: 0.75rem; }
.paragraph-row__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
}
.paragraph-row__label { font-size: 0.78rem; color: var(--adm-text-muted); }
.paragraph-row__actions { display: inline-flex; align-items: center; gap: 0.4rem; }

/* Inline AI button beside a textarea field. */
.field-with-ai { display: flex; align-items: flex-start; gap: 0.5rem; }
.field-with-ai > .ta-field { flex: 1; min-width: 0; }

/* Favicon picker row. */
.favicon-row { display: flex; align-items: center; gap: 0.5rem; margin-top: 0.3rem; }
.favicon-thumb {
  width: 2.4rem;
  height: 2.4rem;
  border-radius: 6px;
  background: var(--adm-surface-2);
  border: 1px solid var(--adm-border);
  object-fit: contain;
  padding: 2px;
  box-sizing: border-box;
}
.favicon-thumb--empty {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.65rem;
  color: var(--adm-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Gallery actions row \u2014 add slot + bulk upload side-by-side. */
.gallery-actions { display: flex; align-items: center; gap: 0.5rem; margin-top: 0.25rem; flex-wrap: wrap; }
.file-btn--accent { border-color: var(--adm-accent); color: var(--adm-accent); }
.file-btn--accent:hover { background: var(--adm-accent-glow); }
.btn-add {
  font-size: 0.8rem;
  color: var(--adm-accent);
  background: transparent;
  border-color: transparent;
  padding: 0.25rem 0.5rem;
  margin-top: 0.25rem;
}
.btn-add:hover { color: var(--adm-accent-deep); border-color: transparent; background: var(--adm-accent-glow); }
.btn-add--indent { margin-left: 0.5rem; }

/* Photos */
.photo-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem; }
.gallery-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); gap: 1rem; margin: 0.5rem 0; }
.photo-slot {
  display: flex; flex-direction: column; gap: 0.4rem;
  padding: 0.8rem;
  background: var(--adm-surface-3);
  border: 1px solid var(--adm-border-soft);
  border-radius: var(--adm-radius, 10px);
}
.photo-slot--sm { font-size: 0.82rem; }
.photo-slot__label {
  font-size: 0.74rem; font-weight: 700;
  color: var(--adm-text-muted);
  margin: 0 0 0.25rem;
  text-transform: uppercase; letter-spacing: 0.08em;
}
.photo-thumb { width: 100%; max-height: 140px; object-fit: cover; border-radius: var(--adm-radius-sm, 6px); }
.file-btn {
  display: inline-block;
  padding: 0.4rem 0.8rem;
  background: var(--adm-surface-2);
  border: 1px solid var(--adm-border-strong);
  border-radius: var(--adm-radius-sm, 6px);
  cursor: pointer; font-size: 0.82rem;
  color: var(--adm-text);
  user-select: none;
  transition: border-color 140ms ease, color 140ms ease;
}
.file-btn:hover { border-color: var(--adm-accent); color: var(--adm-accent); }
.file-btn input[type="file"] { display: none; }

/* Menu */
.pdf-upload {
  display: flex; align-items: center; flex-wrap: wrap; gap: 0.5rem;
  margin-top: 0.3rem;
}
.pdf-upload input[type="file"] { width: auto; margin: 0; }
.pdf-upload__link {
  font-size: 0.8rem; color: var(--adm-accent); text-decoration: underline;
}
.pdf-upload__clear {
  background: transparent; border: 1px solid var(--adm-border);
  color: var(--adm-text-muted); font-size: 0.75rem; padding: 0.2rem 0.55rem;
  border-radius: 999px; cursor: pointer;
}
.pdf-upload__clear:hover { border-color: var(--adm-danger); color: var(--adm-danger); }
.menu-cat {
  background: var(--adm-surface-3);
  border: 1px solid var(--adm-border-soft);
  border-radius: var(--adm-radius, 10px);
  padding: 0.85rem; margin-bottom: 0.85rem;
}
.menu-cat__header { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; }
.menu-item { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.4rem; }
.menu-item input { margin-top: 0; }

/* Testimonials */
.reviews-source {
  background: var(--adm-surface-3);
  border: 1px solid var(--adm-border-soft);
  border-radius: var(--adm-radius, 10px);
  padding: 0.85rem 1rem;
  margin-bottom: 1rem;
}
.reviews-source__label {
  display: block; font-weight: 600; font-size: 0.85rem;
  color: var(--adm-text-muted); text-transform: uppercase;
  letter-spacing: 0.06em; margin-bottom: 0.5rem;
}
.reviews-source__choices { display: flex; flex-wrap: wrap; gap: 0.75rem 1.5rem; }
.reviews-source__choice {
  display: inline-flex; align-items: center; gap: 0.45rem;
  font-size: 0.92rem; cursor: pointer;
}
.reviews-source__choice input { width: auto; margin: 0; }
.reviews-source__hint {
  margin: 0.65rem 0 0; color: var(--adm-text-muted);
  font-size: 0.8rem; line-height: 1.4;
}
.testimonial-row {
  padding: 0.85rem;
  background: var(--adm-surface-3);
  border: 1px solid var(--adm-border-soft);
  border-radius: var(--adm-radius, 10px);
  margin-bottom: 0.85rem;
  display: flex; flex-direction: column; gap: 0.5rem;
}

/* Status */
.section-sub {
  font-size: 0.78rem; font-weight: 700;
  color: var(--adm-text-muted);
  margin: 0.85rem 0 0.45rem;
  text-transform: uppercase; letter-spacing: 0.08em;
}
.meta { color: var(--adm-text-subtle); font-size: 0.82rem; }
.hint { font-weight: 400; color: var(--adm-text-subtle); }
.ok { color: var(--adm-success); font-size: 0.85rem; }
.err { color: var(--adm-danger); font-size: 0.85rem; }
.save-bar {
  display: flex; align-items: center; gap: 0.75rem;
  padding-top: 0.85rem;
  border-top: 1px solid var(--adm-border);
  margin-top: 0.5rem;
}
</style>
