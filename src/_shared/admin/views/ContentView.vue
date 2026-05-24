<script setup lang="ts">
// ─── Types (mirrors MesaSiteConfig) ──────────────────────────────────────────
import { computed, onMounted, ref, watch, reactive } from 'vue'
import { contentClient } from '../../platform/contentClient'
import { useActiveSiteStore } from '../../platform/activeSiteStore'

interface PhotoSlot { src: string; alt?: string; caption?: string }
interface MenuItem { name: string; description?: string; price: string; tags?: string[] }
interface MenuCategory { name: string; description?: string; items: MenuItem[] }
interface HourRow { day: string; open: string }
interface SocialLink { label: string; href: string }
interface FactRow { label: string; value: string }
interface Testimonial { quote: string; author: string; source?: string }
interface SiteContent {
  brand: string; tagline: string; blurb: string; theme: string; swatch: string; variant: string
  contact: { address: string; phone: string; email: string; mapEmbedUrl?: string }
  hours: HourRow[]
  photos: { hero: PhotoSlot; about: PhotoSlot; gallery: PhotoSlot[] }
  story: { title: string; paragraphs: string[]; facts?: FactRow[] }
  menu: { intro?: string; categories: MenuCategory[]; fullMenuUrl?: string }
  testimonials: Testimonial[]
  social: SocialLink[]
}

function blankContent(): SiteContent {
  return {
    brand: '', tagline: '', blurb: '', theme: 'studio', swatch: 'sand', variant: 'essentials',
    contact: { address: '', phone: '', email: '', mapEmbedUrl: '' },
    hours: [{ day: '', open: '' }],
    photos: { hero: { src: '', alt: '' }, about: { src: '', alt: '' }, gallery: [] },
    story: { title: '', paragraphs: [''], facts: [] },
    menu: { intro: '', categories: [], fullMenuUrl: '' },
    testimonials: [],
    social: [],
  }
}

const activeSites = useActiveSiteStore()
const siteId = computed(() => activeSites.activeId)
const version = ref(0)
const published = ref(false)
const statusMsg = ref<string>('')
const error = ref<string | null>(null)
const uploading = ref<Record<string, boolean>>({})
const c = reactive<SiteContent>(blankContent())

function applyPayload(raw: Record<string, unknown>) {
  const p = raw as Partial<SiteContent>
  if (p.brand    !== undefined) c.brand    = p.brand    as string
  if (p.tagline  !== undefined) c.tagline  = p.tagline  as string
  if (p.blurb    !== undefined) c.blurb    = p.blurb    as string
  if (p.theme    !== undefined) c.theme    = p.theme    as string
  if (p.swatch   !== undefined) c.swatch   = p.swatch   as string
  if (p.variant  !== undefined) c.variant  = p.variant  as string
  if (p.contact  !== undefined) Object.assign(c.contact, p.contact)
  if (p.hours    !== undefined) { c.hours.length = 0; c.hours.push(...(p.hours as HourRow[])) }
  if (p.photos   !== undefined) Object.assign(c.photos,  p.photos)
  if (p.story    !== undefined) Object.assign(c.story,   p.story)
  if (p.menu     !== undefined) Object.assign(c.menu,    p.menu)
  if (p.testimonials !== undefined) { c.testimonials.length = 0; c.testimonials.push(...(p.testimonials as Testimonial[])) }
  if (p.social   !== undefined) { c.social.length = 0; c.social.push(...(p.social as SocialLink[])) }
}

async function loadDraft() {
  if (!siteId.value) return
  error.value = null
  try {
    const d = await contentClient.getDraft(siteId.value)
    version.value = d.version; published.value = d.published
    applyPayload(d.payload)
  } catch (e) { error.value = e instanceof Error ? e.message : String(e) }
}

async function save(publish = false) {
  error.value = null; statusMsg.value = ''
  try {
    const payload = JSON.parse(JSON.stringify(c)) as Record<string, unknown>
    if (publish) {
      const r = await contentClient.publish(siteId.value, payload)
      statusMsg.value = `Published v${r.version}`; published.value = true
    } else {
      const r = await contentClient.saveDraft(siteId.value, payload)
      version.value = r.version; statusMsg.value = 'Draft saved'
    }
  } catch (e) { error.value = e instanceof Error ? e.message : String(e) }
}

// ─── Image upload ─────────────────────────────────────────────────────────────
function readFile(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const fr = new FileReader()
    fr.onload = () => res(((fr.result as string).split(',')[1]) ?? '')
    fr.onerror = rej
    fr.readAsDataURL(file)
  })
}

async function uploadImage(slot: PhotoSlot, key: string, file: File) {
  uploading.value[key] = true; error.value = null
  try {
    const base64 = await readFile(file)
    const r = await contentClient.uploadMedia(siteId.value, file.name, file.type, base64)
    slot.src = r.url
  } catch (e) { error.value = e instanceof Error ? e.message : String(e) }
  finally { uploading.value[key] = false }
}

function onPhotoFile(slot: PhotoSlot, key: string, evt: Event) {
  const file = (evt.target as HTMLInputElement).files?.[0]
  if (file) uploadImage(slot, key, file)
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
function tagsStr(item: MenuItem)                     { return (item.tags ?? []).join(', ') }
function setTags(item: MenuItem, v: string)          { item.tags = v.split(',').map(t => t.trim()).filter(Boolean) }

onMounted(loadDraft)
watch(siteId, loadDraft)
</script>

<template>
  <section class="cv">
    <div class="cv-header">
      <h1>Content</h1>
      <div class="cv-header__right">
        <span v-if="siteId" class="meta">v{{ version }} · {{ published ? 'published' : 'draft' }}</span>
        <button type="button" @click="save(false)">Save draft</button>
        <button type="button" class="btn-primary" @click="save(true)">Publish</button>
      </div>
    </div>
    <p v-if="statusMsg" class="ok">{{ statusMsg }}</p>
    <p v-if="error" class="err">{{ error }}</p>
    <p v-if="!siteId" class="err">Select a site from the header dropdown.</p>

    <div v-if="siteId" class="cv-body">

      <!-- ── Brand ── -->
      <fieldset>
        <legend>Brand</legend>
        <div class="row-2">
          <label>Business name<input v-model="c.brand" /></label>
          <label>Tagline<input v-model="c.tagline" /></label>
        </div>
        <label>Short blurb (meta description &amp; intro paragraph)<textarea v-model="c.blurb" rows="3" /></label>
        <div class="row-3">
          <label>Theme
            <select v-model="c.theme">
              <option>studio</option><option>ironwood</option><option>heritage</option><option>vibrant</option>
            </select>
          </label>
          <label>Swatch
            <select v-model="c.swatch">
              <option>sand</option><option>charcoal</option><option>clay</option><option>sage</option><option>slate</option>
            </select>
          </label>
          <label>Variant
            <select v-model="c.variant">
              <option>essentials</option><option>portfolio</option>
            </select>
          </label>
        </div>
      </fieldset>

      <!-- ── Contact ── -->
      <fieldset>
        <legend>Contact</legend>
        <div class="row-2">
          <label>Address<input v-model="c.contact.address" /></label>
          <label>Phone<input v-model="c.contact.phone" /></label>
        </div>
        <div class="row-2">
          <label>Email<input v-model="c.contact.email" type="email" /></label>
          <label>Google Maps embed URL<input v-model="c.contact.mapEmbedUrl" placeholder="https://www.google.com/maps?q=…&output=embed" /></label>
        </div>
      </fieldset>

      <!-- ── Hours ── -->
      <fieldset>
        <legend>Hours</legend>
        <div v-for="(h, i) in c.hours" :key="i" class="list-row">
          <input v-model="h.day"  placeholder="Day / range (e.g. Tuesday – Thursday)" class="flex-3" />
          <input v-model="h.open" placeholder="Hours or 'Closed'" class="flex-2" />
          <button type="button" class="btn-remove" @click="removeHour(i)">×</button>
        </div>
        <button type="button" class="btn-add" @click="addHour">+ Add row</button>
      </fieldset>

      <!-- ── Photos ── -->
      <fieldset>
        <legend>Photos</legend>

        <div class="photo-row">
          <div class="photo-slot">
            <p class="photo-slot__label">Hero image <span class="hint">16:9 · 2400px wide</span></p>
            <img v-if="c.photos.hero.src" :src="c.photos.hero.src" class="photo-thumb" />
            <label class="file-btn">{{ uploading['hero'] ? 'Uploading…' : 'Upload hero' }}
              <input type="file" accept="image/*" :disabled="!!uploading['hero']" @change="onPhotoFile(c.photos.hero, 'hero', $event)" />
            </label>
            <input v-model="c.photos.hero.src" placeholder="or paste URL" />
            <input v-model="c.photos.hero.alt" placeholder="Alt text" />
            <input v-model="c.photos.hero.caption" placeholder="Caption (optional)" />
          </div>
          <div class="photo-slot">
            <p class="photo-slot__label">About image <span class="hint">Portrait or 4:5</span></p>
            <img v-if="c.photos.about.src" :src="c.photos.about.src" class="photo-thumb" />
            <label class="file-btn">{{ uploading['about'] ? 'Uploading…' : 'Upload about' }}
              <input type="file" accept="image/*" :disabled="!!uploading['about']" @change="onPhotoFile(c.photos.about, 'about', $event)" />
            </label>
            <input v-model="c.photos.about.src" placeholder="or paste URL" />
            <input v-model="c.photos.about.alt" placeholder="Alt text" />
            <input v-model="c.photos.about.caption" placeholder="Caption (optional)" />
          </div>
        </div>

        <p class="section-sub">Gallery <span class="hint">6–8 for essentials · 12–16 for portfolio</span></p>
        <div class="gallery-grid">
          <div v-for="(g, i) in c.photos.gallery" :key="i" class="photo-slot photo-slot--sm">
            <img v-if="g.src" :src="g.src" class="photo-thumb" />
            <label class="file-btn">{{ uploading[`g${i}`] ? 'Uploading…' : 'Upload' }}
              <input type="file" accept="image/*" :disabled="!!uploading[`g${i}`]" @change="onPhotoFile(g, `g${i}`, $event)" />
            </label>
            <input v-model="g.src" placeholder="or paste URL" />
            <input v-model="g.alt" placeholder="Alt text" />
            <button type="button" class="btn-remove btn-remove--inline" @click="removeGallerySlot(i)">Remove</button>
          </div>
        </div>
        <button type="button" class="btn-add" @click="addGallerySlot">+ Add gallery photo</button>
      </fieldset>

      <!-- ── Story / About ── -->
      <fieldset>
        <legend>Story / About section</legend>
        <label>Section heading<input v-model="c.story.title" /></label>
        <div v-for="(_, i) in c.story.paragraphs" :key="i" class="list-row">
          <textarea v-model="c.story.paragraphs[i]" rows="3" class="flex-1" placeholder="Paragraph text…" />
          <button type="button" class="btn-remove" @click="removeParagraph(i)">×</button>
        </div>
        <button type="button" class="btn-add" @click="addParagraph">+ Add paragraph</button>

        <p class="section-sub">Stats / facts <span class="hint">optional — displayed as a highlight bar</span></p>
        <div v-for="(f, i) in (c.story.facts ?? [])" :key="i" class="list-row">
          <input v-model="f.label" placeholder="Label (e.g. Founded)" class="flex-1" />
          <input v-model="f.value" placeholder="Value (e.g. 2024)" class="flex-1" />
          <button type="button" class="btn-remove" @click="removeFact(i)">×</button>
        </div>
        <button type="button" class="btn-add" @click="addFact">+ Add stat</button>
      </fieldset>

      <!-- ── Menu ── -->
      <fieldset>
        <legend>Menu</legend>
        <div class="row-2">
          <label>Menu intro line<input v-model="c.menu.intro" placeholder="Updated weekly with…" /></label>
          <label>Full menu PDF / page URL<input v-model="c.menu.fullMenuUrl" placeholder="https://…" /></label>
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
            <input :value="tagsStr(item)" @input="setTags(item, ($event.target as HTMLInputElement).value)" placeholder="V, GF…" style="max-width:100px" />
            <button type="button" class="btn-remove" @click="removeMenuItem(cat, ii)">×</button>
          </div>
          <button type="button" class="btn-add btn-add--indent" @click="addMenuItem(cat)">+ Add item</button>
        </div>
        <button type="button" class="btn-add" @click="addCategory">+ Add category</button>
      </fieldset>

      <!-- ── Testimonials ── -->
      <fieldset>
        <legend>Testimonials</legend>
        <div v-for="(t, i) in c.testimonials" :key="i" class="testimonial-row">
          <textarea v-model="t.quote" rows="2" placeholder="Quote…" />
          <div class="row-2">
            <input v-model="t.author" placeholder="Author name" />
            <input v-model="t.source" placeholder="Source (Google, Yelp…)" />
          </div>
          <button type="button" class="btn-remove" @click="removeTestimonial(i)">Remove</button>
        </div>
        <button type="button" class="btn-add" @click="addTestimonial">+ Add testimonial</button>
      </fieldset>

      <!-- ── Social ── -->
      <fieldset>
        <legend>Social links</legend>
        <div v-for="(s, i) in c.social" :key="i" class="list-row">
          <input v-model="s.label" placeholder="Label (Instagram, Facebook…)" class="flex-1" />
          <input v-model="s.href"  placeholder="https://…" class="flex-3" />
          <button type="button" class="btn-remove" @click="removeSocial(i)">×</button>
        </div>
        <button type="button" class="btn-add" @click="addSocial">+ Add link</button>
      </fieldset>

      <!-- ── Bottom save bar ── -->
      <div class="save-bar">
        <button type="button" @click="save(false)">Save draft</button>
        <button type="button" class="btn-primary" @click="save(true)">Publish</button>
        <span v-if="statusMsg" class="ok">{{ statusMsg }}</span>
        <span v-if="error" class="err">{{ error }}</span>
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
.cv-site-select select {
  padding: 0.35rem 0.6rem;
  background: var(--adm-surface-2); color: var(--adm-text);
  border: 1px solid var(--adm-border); border-radius: var(--adm-radius-sm, 6px);
  font: inherit;
}

/* Body */
.cv-body { display: flex; flex-direction: column; gap: 1.5rem; }

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

/* List rows */
.list-row { display: flex; align-items: flex-start; gap: 0.5rem; margin-bottom: 0.5rem; }
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
