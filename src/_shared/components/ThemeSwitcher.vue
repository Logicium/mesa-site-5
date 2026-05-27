<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { ChevronDown, Settings, Copy, Check, Download, CornerDownRight, AlignLeft, AlignCenter, Palette, LayoutTemplate, LayoutGrid, Globe, Code2, User, Save, Loader2, AlertCircle } from 'lucide-vue-next'
import { useSiteTheme } from '../composables/useSiteTheme'
import { useSectionFlash } from '../composables/useSectionFlash'
import { usePreferences } from '../composables/usePreferences'
import { useAdminAuthStore } from '../platform/adminAuthStore'
import { useSiteContentStore } from '../platform/siteContentStore'
import { THEME_LIST } from '../themes'
import { SWATCH_LIST } from '../themes/swatches'
import { SWATCH_GROUP_LABELS, type SwatchGroup } from '../themes/tokens'

const auth = useAdminAuthStore()
const content = useSiteContentStore()
const { state: prefs, setThemeAutosave } = usePreferences()

// Group swatches by their `group` field so the picker renders sections
// (Neutral / Earth / Warm / Bold / Dark / Neon) instead of one flat grid.
const GROUP_ORDER: SwatchGroup[] = ['neutral', 'earth', 'warm', 'bold', 'dark', 'neon']
const swatchGroups = computed(() => {
  return GROUP_ORDER
    .map(g => ({ group: g, label: SWATCH_GROUP_LABELS[g], items: SWATCH_LIST.filter(s => s.group === g) }))
    .filter(g => g.items.length > 0)
})

const {
  themeName, swatchName, variant,
  heroStyle, footerStyle,
  contactStyle, hoursStyle, galleryStyle, reviewsStyle, subheroStyle,
  siteStyle,
  alignment,
  setTheme, setSwatch, setVariant,
  setHeroStyle, setFooterStyle,
  setContactStyle, setHoursStyle, setGalleryStyle, setReviewsStyle, setSubheroStyle,
  setSiteStyle,
  setAlignment,
} = useSiteTheme()

const VARIANTS = ['essentials', 'portfolio'] as const
const HERO_STYLES = ['1', '2', '3', '4', '5', '6'] as const
const HERO_STYLE_LABELS: Record<string, string> = { '1': 'Default', '2': 'Overlay', '3': 'Broadsheet', '4': 'Split', '5': 'Marquee', '6': 'Float' }
const FOOTER_STYLES = ['1', '2', '3', '4', '5'] as const
const FOOTER_STYLE_LABELS: Record<string, string> = { '1': 'Classic', '2': 'Editorial', '3': 'Billboard', '4': 'Minimal', '5': 'Dark Stage' }
const CONTACT_STYLES = ['1', '2', '3', '4', '5'] as const
const CONTACT_STYLE_LABELS: Record<string, string> = { '1': 'Studio Split', '2': 'Atlas Card', '3': 'Marquee', '4': 'Atlas Wide', '5': 'Brutalist' }
const HOURS_STYLES = ['1', '2', '3', '4', '5'] as const
const HOURS_STYLE_LABELS: Record<string, string> = { '1': 'Ledger', '2': 'Marquee', '3': 'Pillar', '4': 'Tiles', '5': 'Ribbon' }
const GALLERY_STYLES = ['1', '2', '3', '4', '5'] as const
const GALLERY_STYLE_LABELS: Record<string, string> = { '1': 'Default', '2': 'Mosaic', '3': 'Marquee', '4': 'Strip', '5': 'Polaroid' }
const REVIEWS_STYLES = ['1', '2', '3', '4', '5'] as const
const REVIEWS_STYLE_LABELS: Record<string, string> = { '1': 'Default', '2': 'Spotlight', '3': 'Carousel', '4': 'Wall', '5': 'Ticker' }
const SUBHERO_STYLES = ['1', '2', '3', '4', '5'] as const
const SUBHERO_STYLE_LABELS: Record<string, string> = { '1': 'Compact', '2': 'Banner', '3': 'Centered', '4': 'Broadsheet', '5': 'Split' }
const SITE_STYLES = ['1', '2', '3'] as const
// project = wizard: Site style
const SITE_STYLE_LABEL = 'Site style'
const SITE_STYLE_LABELS: Record<string, string> = { '1': 'Default', '2': 'Alt', '3': 'Bold' }

type Tab = 'theme' | 'style' | 'sections' | 'global' | 'config'
const TAB_STORAGE_KEY = 'ap-switcher-tab'
function readTab(): Tab {
  try {
    const v = localStorage.getItem(TAB_STORAGE_KEY)
    if (v === 'theme' || v === 'style' || v === 'sections' || v === 'global' || v === 'config') return v
  } catch { /* storage unavailable */ }
  return 'theme'
}
const tab = ref<Tab>(readTab())
watch(tab, (v) => { try { localStorage.setItem(TAB_STORAGE_KEY, v) } catch { /* */ } })
const open = ref(false)
function toggle() { open.value = !open.value }

/* ── Section-flash registry ──
   Each setting's eyebrow label is clickable; clicking scrolls to the element
   it controls and flashes inverted colors. If the element doesn't exist on
   the current page, navigate to a fallback route and try again. */
const { goto } = useSectionFlash()
const sectionTargets = {
  hero:      { selectors: ['.ap-hero'],                                  route: '/' },
  subhero:   { selectors: ['.ap-subhero'],                               route: '/contact' },
  footer:    { selectors: ['.ap-footer'],                                route: '/' },
  site:      { selectors: ['.wiz', '.ap-section'], route: '/wizard' },
  contact:   { selectors: ['.ap-contact'],                               route: '/contact' },
  hours:     { selectors: ['.ap-hours'],                                 route: '/contact' },
  gallery:   { selectors: ['.ap-gallery'],                               route: '/' },
  reviews:   { selectors: ['.ap-reviews'],                               route: '/' },
} as const
function jumpTo(key: keyof typeof sectionTargets) {
  const t = sectionTargets[key]
  goto({ selectors: [...t.selectors], route: t.route })
}

/* ── Config export (mirrors the original archetype-project switcher) ── */
const copied = ref(false)
const currentSwatch = computed(() => SWATCH_LIST.find(s => s.name === swatchName.value))
const configSnippet = computed(() => JSON.stringify({
  theme: themeName.value,
  swatch: swatchName.value,
  variant: variant.value,
  alignment: alignment.value,
  heroStyle: heroStyle.value,
  subheroStyle: subheroStyle.value,
  footerStyle: footerStyle.value,
  siteStyle: siteStyle.value,
  sections: {
    contact: contactStyle.value,
    hours: hoursStyle.value,
    gallery: galleryStyle.value,
    reviews: reviewsStyle.value,
  },
}, null, 2))

function copyConfig() {
  navigator.clipboard.writeText(configSnippet.value).then(() => {
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  })
}

function downloadConfig() {
  const blob = new Blob([configSnippet.value], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `archetype-config-${themeName.value}-${swatchName.value}.json`
  a.click()
  URL.revokeObjectURL(url)
}

/* ── Single-source dimension animation ──
   We measure two intrinsic sizes:
     pillWidth   = the natural width of the collapsed pill
     panelHeight = the natural height of the open panel
   The wrapper then transitions `width` between pillWidth (closed) and
   the open width (640px capped to viewport), and `height` of the expand
   region between 0 and panelHeight. Both sides of the toggle animate.

   The pill is measured via a hidden ghost (`.ap-switcher__measure`) that
   is always present in the DOM. Measuring the real pill while it's
   transitioning (or while it's been pulled out of flow via
   `position: absolute`) yields jittery / inflated widths. */
const panelEl = ref<HTMLElement | null>(null)
const measureEl = ref<HTMLElement | null>(null)
const panelHeight = ref(0)
const pillWidth = ref(0)

async function measure() {
  await nextTick()
  if (panelEl.value) panelHeight.value = panelEl.value.scrollHeight
  if (measureEl.value) pillWidth.value = measureEl.value.scrollWidth
}

onMounted(() => {
  measure()
  if ('ResizeObserver' in window) {
    const ro = new ResizeObserver(() => {
      if (panelEl.value) panelHeight.value = panelEl.value.scrollHeight
      if (measureEl.value) pillWidth.value = measureEl.value.scrollWidth
    })
    if (panelEl.value) ro.observe(panelEl.value)
    if (measureEl.value) ro.observe(measureEl.value)
  }
})
watch([tab, open], () => { measure() })

/* Delay hiding the pill on open until the width transition has finished
   (so the wrapper visibly grows in width with the pill filling it, instead
   of momentarily collapsing to a zero-height bar). On close, restore the
   pill immediately so it's already in place when width snaps back. */
const pillHidden = ref(false)
const settled = ref(false)
let pillTimer: ReturnType<typeof setTimeout> | null = null
let settleTimer: ReturnType<typeof setTimeout> | null = null
watch(open, (v) => {
  if (pillTimer) { clearTimeout(pillTimer); pillTimer = null }
  if (settleTimer) { clearTimeout(settleTimer); settleTimer = null }
  if (v) {
    pillTimer = setTimeout(() => { pillHidden.value = true }, 360)
    settleTimer = setTimeout(() => { settled.value = true }, 880)
  } else {
    /* Keep the pill faded out while the panel collapses; restore it once the
       height transition (520ms) has finished so it can fade in over the
       width-collapse phase. */
    pillTimer = setTimeout(() => { pillHidden.value = false }, 520)
    settled.value = false
  }
})

/* ── Owner-driven publish ──
   When a signed-in site owner tweaks any setting we push the new values
   to the backend so other visitors render the same theme. In autosave mode
   we fire on the next tick (no debounce delay — settings appear instantly
   for new visitors). With autosave off the owner has to hit Save and the
   button surfaces a dirty/saving/saved/error state. Anonymous visitors
   never hit the network — they stay localStorage-only. */
const themeSnapshot = computed(() => ({
  theme: themeName.value,
  swatch: swatchName.value,
  variant: variant.value,
  alignment: alignment.value,
  style: {
    heroStyle: heroStyle.value,
    subheroStyle: subheroStyle.value,
    footerStyle: footerStyle.value,
    siteStyle: siteStyle.value,
    sections: {
      contact: contactStyle.value,
      hours: hoursStyle.value,
      gallery: galleryStyle.value,
      reviews: reviewsStyle.value,
    },
  },
}))

const canPublish = computed(() => !!auth.owner && content.isPlatform)
type SaveState = 'idle' | 'saving' | 'saved' | 'error'
const saveState = ref<SaveState>('idle')
const saveError = ref<string | null>(null)
const dirty = ref(false)
let publishTimer: number | null = null
let savedResetTimer: number | null = null
let publishedInitial = false

async function performSave() {
  if (!canPublish.value) return
  if (publishTimer) { clearTimeout(publishTimer); publishTimer = null }
  saveState.value = 'saving'
  saveError.value = null
  try {
    await content.saveThemePatch(themeSnapshot.value)
    dirty.value = false
    saveState.value = 'saved'
    if (savedResetTimer) clearTimeout(savedResetTimer)
    savedResetTimer = window.setTimeout(() => {
      if (saveState.value === 'saved') saveState.value = 'idle'
    }, 1800)
  } catch (e) {
    saveState.value = 'error'
    saveError.value = e instanceof Error ? e.message : String(e)
  }
}

watch(themeSnapshot, () => {
  // Skip the first emit so just mounting (or hydration syncing refs) doesn't
  // immediately push to the server.
  if (!publishedInitial) { publishedInitial = true; return }
  if (!canPublish.value) return
  dirty.value = true
  if (!prefs.value.themeAutosave) return
  // Autosave: coalesce only enough to merge synchronous bursts; effectively
  // immediate from a human's perspective.
  if (publishTimer) clearTimeout(publishTimer)
  publishTimer = window.setTimeout(() => { publishTimer = null; performSave() }, 0)
}, { deep: true })

// When the owner flips autosave back on while dirty, save right away.
watch(() => prefs.value.themeAutosave, (on) => {
  if (on && dirty.value && canPublish.value) performSave()
})
</script>

<template>
  <div
    class="ap-switcher"
    :class="{ 'is-open': open, 'is-settled': settled }"
    :style="{
      '--ap-switcher-h': panelHeight + 'px',
      '--ap-switcher-pill-w': pillWidth + 'px',
    }"
  >
    <!-- Hidden ghost pill used purely for width measurement. Lives in the
         DOM at all times so we always know the natural collapsed width,
         independent of whether the visible pill is showing or hidden. -->
    <span ref="measureEl" class="ap-switcher__measure" aria-hidden="true">
      <span class="ap-switcher__pill" tabindex="-1">
        <span class="ap-switcher__pill-chip">
          <span class="ap-switcher__pill-chip-half" />
          <span class="ap-switcher__pill-chip-half" />
        </span>
        <span class="ap-switcher__pill-info">
          <span class="ap-switcher__pill-line">{{ themeName }} · {{ swatchName }}</span>
          <span class="ap-switcher__pill-sub">{{ variant }} · {{ alignment }}</span>
        </span>
        <span class="ap-switcher__pill-icon"><Settings :size="16" /></span>
      </span>
    </span>

    <!-- Collapsed pill (kept in the DOM so width can animate; hidden when open) -->
    <button
      type="button"
      class="ap-switcher__pill"
      :class="{ 'is-hidden': pillHidden }"
      :aria-hidden="pillHidden"
      :tabindex="pillHidden ? -1 : 0"
      @click="toggle"
      aria-label="Open site settings"
    >
      <span class="ap-switcher__pill-chip" aria-hidden="true">
        <span class="ap-switcher__pill-chip-half" :style="{ background: currentSwatch?.primary }" />
        <span class="ap-switcher__pill-chip-half" :style="{ background: currentSwatch?.accent }" />
      </span>
      <span class="ap-switcher__pill-info">
        <span class="ap-switcher__pill-line">{{ themeName }} · {{ swatchName }}</span>
        <span class="ap-switcher__pill-sub">{{ variant }} · {{ alignment }}</span>
      </span>
      <span class="ap-switcher__pill-icon" aria-hidden="true"><Settings :size="16" /></span>
    </button>

    <!-- Expandable area — height transitions from 0 → measured px on the inner panel.
         Only the active tab panel mounts via v-show, so the wrapper sees one
         single height value at a time and animates in a single fluid motion. -->
    <div class="ap-switcher__expand">
      <div ref="panelEl" class="ap-switcher__panel-wrap">
        <div class="ap-switcher__head">
          <span class="ap-switcher__title">Site settings</span>
          <RouterLink
            v-if="auth.owner"
            to="/admin/account"
            class="ap-switcher__account"
            :title="`Signed in as ${auth.owner.email}`"
            @click="toggle"
          >
            <User :size="14" />
            <span>Account</span>
          </RouterLink>
          <button type="button" class="ap-switcher__close" @click="toggle" aria-label="Close">
            <ChevronDown :size="18" />
          </button>
        </div>

        <!-- Save / autosave row. Only owners on platform builds see this; the
             controls explicitly surface what the picker is doing with each
             tweak (silent failures used to leave owners thinking everything
             was saved when it wasn't). -->
        <div v-if="canPublish" class="ap-switcher__save">
          <button
            type="button"
            class="ap-switcher__save-btn"
            :class="{
              'is-saving': saveState === 'saving',
              'is-saved': saveState === 'saved',
              'is-error': saveState === 'error',
              'is-dirty': dirty && saveState !== 'saving',
            }"
            :disabled="saveState === 'saving' || (!dirty && saveState === 'idle')"
            :title="saveError || ''"
            @click="performSave"
          >
            <Loader2 v-if="saveState === 'saving'" :size="14" class="ap-switcher__spin" />
            <Check v-else-if="saveState === 'saved'" :size="14" />
            <AlertCircle v-else-if="saveState === 'error'" :size="14" />
            <Save v-else :size="14" />
            <span>
              {{ saveState === 'saving' ? 'Saving…'
                 : saveState === 'saved' ? 'Saved'
                 : saveState === 'error' ? 'Retry save'
                 : dirty ? 'Save changes' : 'Saved' }}
            </span>
          </button>
          <label class="ap-switcher__autosave" :title="prefs.themeAutosave ? 'Autosave on — changes publish instantly' : 'Autosave off — click Save to publish'">
            <input
              type="checkbox"
              :checked="prefs.themeAutosave"
              @change="setThemeAutosave(($event.target as HTMLInputElement).checked)"
            />
            <span>Autosave</span>
          </label>
        </div>
        <p v-if="canPublish && saveState === 'error' && saveError" class="ap-switcher__save-err">
          {{ saveError }}
        </p>

        <div class="ap-switcher__tabs" role="tablist">
          <button type="button" role="tab" class="ap-switcher__tab" :class="{ 'is-active': tab === 'theme' }" @click="tab = 'theme'"><Palette :size="14" /><span>theme</span></button>
          <button type="button" role="tab" class="ap-switcher__tab" :class="{ 'is-active': tab === 'style' }" @click="tab = 'style'"><LayoutTemplate :size="14" /><span>style</span></button>
          <button type="button" role="tab" class="ap-switcher__tab" :class="{ 'is-active': tab === 'sections' }" @click="tab = 'sections'"><LayoutGrid :size="14" /><span>sections</span></button>
          <button type="button" role="tab" class="ap-switcher__tab" :class="{ 'is-active': tab === 'global' }" @click="tab = 'global'"><Globe :size="14" /><span>global</span></button>
          <button type="button" role="tab" class="ap-switcher__tab" :class="{ 'is-active': tab === 'config' }" @click="tab = 'config'"><Code2 :size="14" /><span>config</span></button>
        </div>

        <!-- Theme -->
        <div v-show="tab === 'theme'" class="ap-switcher__panel">
          <div>
            <p class="ap-eyebrow">Theme</p>
            <div class="ap-switcher__row">
              <button v-for="t in THEME_LIST" :key="t.name" type="button" class="ap-switcher__chip" :class="{ 'is-active': themeName === t.name }" @click="setTheme(t.name)">{{ t.label }}</button>
            </div>
          </div>
          <div>
            <p class="ap-eyebrow">Variant</p>
            <div class="ap-switcher__row">
              <button v-for="v in VARIANTS" :key="v" type="button" class="ap-switcher__chip" :class="{ 'is-active': variant === v }" @click="setVariant(v)">{{ v }}</button>
            </div>
          </div>
          <div class="ap-switcher__span">
            <p class="ap-eyebrow">Swatch</p>
            <div class="ap-switcher__swatch-all">
              <template v-for="grp in swatchGroups" :key="grp.group">
                <span class="ap-switcher__group-label">{{ grp.label }}</span>
                <button
                  v-for="s in grp.items"
                  :key="s.name"
                  type="button"
                  class="ap-switcher__swatch-card"
                  :class="{ 'is-active': swatchName === s.name }"
                  :title="`${s.label} · ${grp.label}`"
                  @click="setSwatch(s.name)"
                >
                  <span class="ap-switcher__swatch-tile">
                    <span class="ap-switcher__swatch-chip" :style="{ background: s.primary }" />
                    <span class="ap-switcher__swatch-chip" :style="{ background: s.accent }" />
                  </span>
                  <span class="ap-switcher__swatch-name">{{ s.label }}</span>
                </button>
              </template>
            </div>
          </div>
        </div>

        <!-- Style -->
        <div v-show="tab === 'style'" class="ap-switcher__panel">
          <div class="ap-switcher__span">
            <button type="button" class="ap-switcher__group-head" @click="jumpTo('hero')">
              <span class="ap-eyebrow">Hero style</span>
              <CornerDownRight :size="12" />
            </button>
            <div class="ap-switcher__row">
              <button v-for="s in HERO_STYLES" :key="s" type="button" class="ap-switcher__chip" :class="{ 'is-active': heroStyle === s }" @click="setHeroStyle(s)">{{ HERO_STYLE_LABELS[s] }}</button>
            </div>
          </div>
          <div class="ap-switcher__span">
            <button type="button" class="ap-switcher__group-head" @click="jumpTo('subhero')">
              <span class="ap-eyebrow">Subpage hero</span>
              <CornerDownRight :size="12" />
            </button>
            <div class="ap-switcher__row">
              <button v-for="s in SUBHERO_STYLES" :key="s" type="button" class="ap-switcher__chip" :class="{ 'is-active': subheroStyle === s }" @click="setSubheroStyle(s)">{{ SUBHERO_STYLE_LABELS[s] }}</button>
            </div>
          </div>
          <div class="ap-switcher__span">
            <button type="button" class="ap-switcher__group-head" @click="jumpTo('footer')">
              <span class="ap-eyebrow">Footer style</span>
              <CornerDownRight :size="12" />
            </button>
            <div class="ap-switcher__row">
              <button v-for="s in FOOTER_STYLES" :key="s" type="button" class="ap-switcher__chip" :class="{ 'is-active': footerStyle === s }" @click="setFooterStyle(s)">{{ FOOTER_STYLE_LABELS[s] }}</button>
            </div>
          </div>
          <div class="ap-switcher__span">
            <button type="button" class="ap-switcher__group-head" @click="jumpTo('site')">
              <span class="ap-eyebrow">{{ SITE_STYLE_LABEL }}</span>
              <CornerDownRight :size="12" />
            </button>
            <div class="ap-switcher__row">
              <button v-for="s in SITE_STYLES" :key="s" type="button" class="ap-switcher__chip" :class="{ 'is-active': siteStyle === s }" @click="setSiteStyle(s)">{{ SITE_STYLE_LABELS[s] }}</button>
            </div>
          </div>
        </div>

        <!-- Sections -->
        <div v-show="tab === 'sections'" class="ap-switcher__panel">
          <div class="ap-switcher__span">
            <button type="button" class="ap-switcher__group-head" @click="jumpTo('contact')">
              <span class="ap-eyebrow">Contact section</span>
              <CornerDownRight :size="12" />
            </button>
            <div class="ap-switcher__row">
              <button v-for="s in CONTACT_STYLES" :key="s" type="button" class="ap-switcher__chip" :class="{ 'is-active': contactStyle === s }" @click="setContactStyle(s)">{{ CONTACT_STYLE_LABELS[s] }}</button>
            </div>
          </div>
          <div class="ap-switcher__span">
            <button type="button" class="ap-switcher__group-head" @click="jumpTo('hours')">
              <span class="ap-eyebrow">Hours section</span>
              <CornerDownRight :size="12" />
            </button>
            <div class="ap-switcher__row">
              <button v-for="s in HOURS_STYLES" :key="s" type="button" class="ap-switcher__chip" :class="{ 'is-active': hoursStyle === s }" @click="setHoursStyle(s)">{{ HOURS_STYLE_LABELS[s] }}</button>
            </div>
          </div>
          <div class="ap-switcher__span">
            <button type="button" class="ap-switcher__group-head" @click="jumpTo('gallery')">
              <span class="ap-eyebrow">Gallery section</span>
              <CornerDownRight :size="12" />
            </button>
            <div class="ap-switcher__row">
              <button v-for="s in GALLERY_STYLES" :key="s" type="button" class="ap-switcher__chip" :class="{ 'is-active': galleryStyle === s }" @click="setGalleryStyle(s)">{{ GALLERY_STYLE_LABELS[s] }}</button>
            </div>
          </div>
          <div class="ap-switcher__span">
            <button type="button" class="ap-switcher__group-head" @click="jumpTo('reviews')">
              <span class="ap-eyebrow">Reviews section</span>
              <CornerDownRight :size="12" />
            </button>
            <div class="ap-switcher__row">
              <button v-for="s in REVIEWS_STYLES" :key="s" type="button" class="ap-switcher__chip" :class="{ 'is-active': reviewsStyle === s }" @click="setReviewsStyle(s)">{{ REVIEWS_STYLE_LABELS[s] }}</button>
            </div>
          </div>
        </div>

        <!-- Global -->
        <div v-show="tab === 'global'" class="ap-switcher__panel">
          <div class="ap-switcher__span">
            <p class="ap-eyebrow">Content alignment</p>
            <p class="ap-switcher__hint">Applies globally across all themes, components, and pages.</p>
            <div class="ap-switcher__row">
              <button
                type="button"
                class="ap-switcher__chip ap-switcher__chip--icon"
                :class="{ 'is-active': alignment === 'left' }"
                @click="setAlignment('left')"
              >
                <AlignLeft :size="14" /> Left
              </button>
              <button
                type="button"
                class="ap-switcher__chip ap-switcher__chip--icon"
                :class="{ 'is-active': alignment === 'center' }"
                @click="setAlignment('center')"
              >
                <AlignCenter :size="14" /> Center
              </button>
            </div>
          </div>
        </div>

        <!-- Config -->
        <div v-show="tab === 'config'" class="ap-switcher__panel">
          <div class="ap-switcher__span">
            <p class="ap-eyebrow">Current configuration</p>
            <pre class="ap-switcher__code">{{ configSnippet }}</pre>
            <div class="ap-switcher__row">
              <button type="button" class="ap-switcher__chip ap-switcher__chip--icon" @click="copyConfig">
                <component :is="copied ? Check : Copy" :size="14" />
                {{ copied ? 'Copied' : 'Copy JSON' }}
              </button>
              <button type="button" class="ap-switcher__chip ap-switcher__chip--icon" @click="downloadConfig">
                <Download :size="14" />
                Download .json
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Single-source height animation: the wrapper measures its content via JS and
   sets --ap-switcher-h; the expand region transitions `height` from 0 → that
   value in one fluid motion. Switching tabs simply re-measures and animates
   to the new height. No grid-template-rows tricks → no bounce. */
.ap-switcher {
  position: fixed; bottom: 1rem; right: 1rem; z-index: 100;
  font-family: var(--ap-font-body); font-size: 0.85rem;
  /* rgba fallback first so prod CSS minifiers that fold/precompute color-mix
     don't collapse the panel to fully opaque; the color-mix below overrides
     it in modern browsers. */
  background: rgba(245, 244, 240, 0.72);
  background: color-mix(in srgb, var(--ap-surface) 72%, transparent);
  -webkit-backdrop-filter: blur(14px) saturate(140%);
  backdrop-filter: blur(14px) saturate(140%);
  /* Force our own stacking context so backdrop-filter always has a backdrop
     to sample, regardless of whatever ancestor compositing the prod build
     ends up with. */
  isolation: isolate;
  will-change: backdrop-filter;
  border: 1px solid color-mix(in srgb, var(--ap-line) 85%, transparent);
  border-radius: 999px;
  box-shadow: 0 10px 40px -10px color-mix(in srgb, var(--ap-ink) 35%, transparent),
              0 2px 8px -2px color-mix(in srgb, var(--ap-ink) 20%, transparent);
  overflow: hidden;
  /* Collapsed: width matches the measured pill width. Open: snap to 640px.
     Staged animation: opening goes width-then-height; closing height-then-width.
     The closed-state spec delays width by the height duration; the open-state
     spec removes that delay so width leads on the way in. */
  width: var(--ap-switcher-pill-w, max-content);
  max-width: min(640px, calc(100vw - 2rem));
  transition: width 360ms cubic-bezier(0.2, 0.7, 0.3, 1) 520ms,
              border-radius 360ms ease 520ms,
              border-color 360ms ease 520ms,
              background-color 360ms ease 520ms;
}
.ap-switcher.is-open {
  width: 640px;
  border-radius: 18px;
  transition: width 360ms cubic-bezier(0.2, 0.7, 0.3, 1) 0ms,
              border-radius 360ms ease 0ms,
              border-color 360ms ease 0ms,
              background-color 360ms ease 0ms;
}
/* When open, pill fades out (driven by JS pillHidden timer) so it gracefully
   disappears as the height grows. On close it fades back in over the
   width-collapse phase. Stays in grid flow so it contributes to height. */
.ap-switcher__pill.is-hidden {
  opacity: 0;
  pointer-events: none;
}
/* Offscreen ghost used only to measure the pill's natural width. Kept in
   the DOM at all times so width is always known, even while the visible
   pill is hidden. position: absolute removes it from layout entirely. */
.ap-switcher__measure {
  position: absolute; left: -99999px; top: -99999px;
  visibility: hidden; pointer-events: none;
  width: max-content;
}

/* ── Collapsed pill ────────────────────────────────────── */
.ap-switcher__pill {
  display: flex; align-items: center; gap: 0.75rem;
  width: 100%;
  background: transparent; border: 0; cursor: pointer;
  padding: 0.6rem 0.65rem 0.6rem 0.85rem;
  color: var(--ap-ink); font: inherit;
  text-align: left;
  opacity: 1;
  transition: opacity 320ms ease;
}
.ap-switcher__pill-chip {
  display: inline-flex;
  width: 26px; height: 26px;
  border-radius: var(--ap-radius, 6px);
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--ap-ink) 18%, transparent);
  flex-shrink: 0;
}
[data-theme='vibrant'] .ap-switcher__pill-chip { border-radius: 50%; }
.ap-switcher__pill-chip-half {
  flex: 1; display: block; min-width: 0;
  background: var(--ap-line);
}
.ap-switcher__pill-info {
  display: inline-flex; flex-direction: column; justify-content: center;
  gap: 0.05rem; min-width: 0;
}
.ap-switcher__pill-line {
  font-size: 0.82rem; font-weight: 600;
  color: var(--ap-ink);
  text-transform: lowercase;
  white-space: nowrap;
  letter-spacing: 0.01em;
}
.ap-switcher__pill-sub {
  font-size: 0.66rem; font-weight: 500;
  color: var(--ap-ink-muted);
  text-transform: lowercase;
  letter-spacing: 0.06em;
  white-space: nowrap;
}
.ap-switcher__pill-icon {
  margin-left: auto;
  display: flex; align-items: center; justify-content: center;
  width: 32px; height: 32px; border-radius: 50%;
  background: color-mix(in srgb, var(--ap-ink) 8%, transparent);
  color: var(--ap-ink);
  flex-shrink: 0;
  transition: background 160ms ease;
}
.ap-switcher__pill-icon :deep(svg) { display: block; width: 16px; height: 16px; flex-shrink: 0; }
.ap-switcher__pill:hover .ap-switcher__pill-icon { background: color-mix(in srgb, var(--ap-ink) 14%, transparent); }

/* ── Expand region ─ height transitions in sync with the pill leaving layout ─ */
.ap-switcher {
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: 1fr;
}
.ap-switcher__measure,
.ap-switcher__pill,
.ap-switcher__expand {
  grid-column: 1;
  grid-row: 1;
}
.ap-switcher__expand {
  height: 0;
  overflow: hidden;
  transition: height 520ms cubic-bezier(0.2, 0.7, 0.3, 1);
}
.ap-switcher.is-open .ap-switcher__expand {
  height: var(--ap-switcher-h, auto);
  transition: height 520ms cubic-bezier(0.2, 0.7, 0.3, 1) 360ms;
}
/* Once fully open, tab switches re-measure --ap-switcher-h; remove the
   opening-stage delay so the height retunes immediately. */
.ap-switcher.is-open.is-settled .ap-switcher__expand {
  transition: height 320ms cubic-bezier(0.2, 0.7, 0.3, 1);
}

/* ── Expanded wrapper ──────────────────────────────────── */
.ap-switcher__panel-wrap {
  display: flex; flex-direction: column;
  opacity: 0;
  transition: opacity 220ms ease;
}
/* Fade panel contents IN after width AND part of height have grown; fade
   OUT immediately on close so it clears before height collapses. */
.ap-switcher.is-open .ap-switcher__panel-wrap {
  opacity: 1;
  transition: opacity 360ms ease 520ms;
}
.ap-switcher__head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 0.7rem 0.9rem 0.5rem;
  border-bottom: 1px solid color-mix(in srgb, var(--ap-line) 60%, transparent);
}
.ap-switcher__title {
  font-family: var(--ap-font-heading);
  font-size: 0.88rem; letter-spacing: 0.08em;
  text-transform: uppercase; color: var(--ap-ink);
}
.ap-switcher__close {
  background: color-mix(in srgb, var(--ap-ink) 8%, transparent);
  border: 0; cursor: pointer;
  width: 32px; height: 32px; border-radius: 50%;
  display: inline-flex; align-items: center; justify-content: center;
  color: var(--ap-ink);
  flex-shrink: 0;
  transition: background 160ms ease, color 160ms ease, transform 240ms ease;
}
.ap-switcher__account {
  display: inline-flex; align-items: center; gap: 0.35rem;
  padding: 0.3rem 0.65rem;
  margin-left: auto; margin-right: 0.4rem;
  background: color-mix(in srgb, var(--ap-primary) 12%, transparent);
  color: var(--ap-primary);
  border: 1px solid color-mix(in srgb, var(--ap-primary) 35%, transparent);
  border-radius: 999px;
  font-size: 0.72rem; font-weight: 600;
  letter-spacing: 0.05em; text-transform: uppercase;
  text-decoration: none;
  transition: background 140ms ease, color 140ms ease, border-color 140ms ease;
}
.ap-switcher__account:hover {
  background: var(--ap-primary);
  color: var(--ap-surface);
  border-color: var(--ap-primary);
}
.ap-switcher__close :deep(svg) { display: block; margin: 0; }
.ap-switcher__close:hover {
  background: color-mix(in srgb, var(--ap-ink) 14%, transparent);
  color: var(--ap-ink);
}
/* Chevron points down by default (in open state — clicking collapses).
   Pre-rotate so the icon visually invites "click to close". */
.ap-switcher.is-open .ap-switcher__close { transform: rotate(0deg); }

/* ── Save / autosave row ───────────────────────────────── */
.ap-switcher__save {
  display: flex; align-items: center; gap: 0.5rem;
  padding: 0.55rem 0.85rem 0.5rem;
  border-bottom: 1px solid color-mix(in srgb, var(--ap-line) 50%, transparent);
}
.ap-switcher__save-btn {
  display: inline-flex; align-items: center; gap: 0.4rem;
  padding: 0.4rem 0.75rem;
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--ap-line) 70%, transparent);
  background: color-mix(in srgb, var(--ap-ink) 5%, transparent);
  color: var(--ap-ink);
  font: inherit; font-size: 0.72rem; font-weight: 600;
  letter-spacing: 0.04em; text-transform: uppercase;
  cursor: pointer;
  transition: background 140ms ease, color 140ms ease, border-color 140ms ease, opacity 140ms ease;
}
.ap-switcher__save-btn:disabled { cursor: default; opacity: 0.55; }
.ap-switcher__save-btn:not(:disabled):hover {
  background: color-mix(in srgb, var(--ap-ink) 10%, transparent);
}
.ap-switcher__save-btn.is-dirty {
  background: var(--ap-primary);
  border-color: var(--ap-primary);
  color: var(--ap-on-primary, var(--ap-surface));
  opacity: 1;
}
.ap-switcher__save-btn.is-dirty:not(:disabled):hover {
  background: color-mix(in srgb, var(--ap-primary) 88%, var(--ap-ink));
}
.ap-switcher__save-btn.is-saving { opacity: 0.85; }
.ap-switcher__save-btn.is-saved {
  background: color-mix(in srgb, var(--ap-primary) 18%, transparent);
  border-color: color-mix(in srgb, var(--ap-primary) 45%, transparent);
  color: var(--ap-primary);
  opacity: 1;
}
.ap-switcher__save-btn.is-error {
  background: rgba(220, 38, 38, 0.12);
  border-color: rgba(220, 38, 38, 0.45);
  color: rgb(185, 28, 28);
  opacity: 1;
}
.ap-switcher__save-btn :deep(svg) { display: block; }
.ap-switcher__spin { animation: ap-switcher-spin 0.9s linear infinite; }
@keyframes ap-switcher-spin { to { transform: rotate(360deg); } }

.ap-switcher__autosave {
  display: inline-flex; align-items: center; gap: 0.4rem;
  margin-left: auto;
  font-size: 0.72rem; font-weight: 600;
  letter-spacing: 0.04em; text-transform: uppercase;
  color: var(--ap-ink-muted, var(--ap-ink));
  cursor: pointer; user-select: none;
}
.ap-switcher__autosave input { accent-color: var(--ap-primary); cursor: pointer; }

.ap-switcher__save-err {
  margin: 0; padding: 0.4rem 0.85rem 0.55rem;
  font-size: 0.72rem; color: rgb(185, 28, 28);
  border-bottom: 1px solid color-mix(in srgb, var(--ap-line) 50%, transparent);
  word-break: break-word;
}

/* ── Tabs ──────────────────────────────────────────────── */
.ap-switcher__tabs {
  display: flex; gap: 0;
  padding: 0 0.6rem; margin: 0;
  border-bottom: 1px solid color-mix(in srgb, var(--ap-line) 60%, transparent);
}
.ap-switcher__tab {
  flex: 1;
  display: inline-flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 0.2rem;
  background: transparent; border: 0;
  padding: 0.6rem 0.3rem 0.55rem;
  font-family: inherit; font-size: 0.7rem;
  color: var(--ap-ink-muted); cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  letter-spacing: 0.04em;
  text-transform: lowercase;
  transition: color 160ms ease, border-color 160ms ease;
}
.ap-switcher__tab :deep(svg) { display: block; opacity: 0.8; }
.ap-switcher__tab:hover { color: var(--ap-ink); }
.ap-switcher__tab.is-active {
  color: var(--ap-ink);
  border-bottom-color: var(--ap-primary);
  font-weight: 600;
}
.ap-switcher__tab.is-active :deep(svg) { opacity: 1; color: var(--ap-primary); }

/* ── Panel (2-col by default; full-width groups via __span) ── */
.ap-switcher__panel {
  padding: 0.9rem 1rem 1.1rem;
  display: grid; grid-template-columns: 1fr 1fr;
  gap: 0.9rem 1.25rem;
  animation: ap-switcher-fade 360ms ease both;
}
@keyframes ap-switcher-fade {
  from { opacity: 0; transform: translateY(4px); }
  to   { opacity: 1; transform: none; }
}
@media (prefers-reduced-motion: reduce) {
  .ap-switcher__panel { animation: none; }
}

/* Clickable group head — jumps to the section the setting controls */
.ap-switcher__group-head {
  display: inline-flex; align-items: center; gap: 0.35rem;
  background: transparent; border: 0; padding: 0; margin: 0;
  color: inherit; cursor: pointer;
  border-bottom: 1px dashed transparent;
  transition: color 160ms ease, border-color 160ms ease;
}
.ap-switcher__group-head .ap-eyebrow { transition: color 160ms ease; }
.ap-switcher__group-head :global(svg) {
  opacity: 0.4;
  transition: opacity 160ms ease, transform 200ms ease;
}
.ap-switcher__group-head:hover { border-bottom-color: color-mix(in srgb, var(--ap-primary) 60%, transparent); }
.ap-switcher__group-head:hover .ap-eyebrow { color: var(--ap-primary); }
.ap-switcher__group-head:hover :global(svg) { opacity: 0.9; transform: translateX(2px); }
.ap-switcher__row { display: flex; flex-wrap: wrap; gap: 0.4rem; margin-top: 0.4rem; }
.ap-switcher__chip {
  background: transparent; color: var(--ap-ink);
  border: 1px solid color-mix(in srgb, var(--ap-line) 80%, transparent);
  border-radius: 999px;
  padding: 0.3rem 0.7rem; font-size: 0.78rem;
  cursor: pointer;
  transition: background 140ms ease, color 140ms ease, border-color 140ms ease;
}
.ap-switcher__chip:hover { border-color: var(--ap-ink); }
.ap-switcher__chip.is-active {
  background: var(--ap-ink); color: var(--ap-surface); border-color: var(--ap-ink);
}
.ap-switcher__chip--icon {
  display: inline-flex; align-items: center; gap: 0.4rem;
}
.ap-switcher__swatch {
  width: 28px; height: 28px; border-radius: 50%;
  border: 2px solid color-mix(in srgb, var(--ap-line) 70%, transparent);
  padding: 0; cursor: pointer;
}
.ap-switcher__swatch.is-active { outline: 2px solid; outline-offset: 2px; }

/* ── Swatch cards (flat inline wrapping layout) ──
   All groups and their swatches live in a single flex-wrap row.
   Group labels are inline flex items acting as visual separators.
   Each swatch card is a compact chip with two color dots + readable label. */
.ap-switcher__swatch-all {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem;
  margin-top: 0.4rem;
}
.ap-switcher__group-label {
  margin: 0;
  padding: 0.2rem 0.55rem;
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--ap-ink) 55%, transparent);
  background: color-mix(in srgb, var(--ap-ink) 8%, transparent);
  border-radius: 999px;
  white-space: nowrap;
  flex-shrink: 0;
}
.ap-switcher__swatch-card {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  padding: 0.35rem 0.55rem;
  background: transparent;
  border: 1px solid color-mix(in srgb, var(--ap-line) 75%, transparent);
  border-radius: var(--ap-radius, 6px);
  cursor: pointer;
  transition: border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease;
}
.ap-switcher__swatch-card:hover {
  border-color: color-mix(in srgb, var(--ap-primary) 55%, var(--ap-line));
  transform: translateY(-1px);
}
.ap-switcher__swatch-card.is-active {
  border-color: var(--ap-primary);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--ap-primary) 28%, transparent);
}
.ap-switcher__swatch-tile {
  display: flex;
  gap: 3px;
}
.ap-switcher__swatch-chip {
  display: block;
  width: 16px; height: 16px;
  border-radius: var(--ap-radius, 4px);
  border: 1px solid color-mix(in srgb, var(--ap-ink) 12%, transparent);
  flex-shrink: 0;
}
[data-theme='vibrant'] .ap-switcher__swatch-chip { border-radius: 50%; }
.ap-switcher__swatch-name {
  font-size: 0.67rem; font-weight: 500;
  color: var(--ap-ink);
  line-height: 1;
  text-transform: lowercase;
  white-space: nowrap;
}
.ap-switcher__hint {
  margin: 0.25rem 0 0.6rem; font-size: 0.78rem;
  color: var(--ap-ink-muted);
}
.ap-switcher__span { grid-column: 1 / -1; }

/* Config tab: code preview */
.ap-switcher__code {
  margin: 0.5rem 0 0.75rem;
  padding: 0.65rem 0.8rem;
  background: color-mix(in srgb, var(--ap-ink) 6%, transparent);
  border: 1px solid color-mix(in srgb, var(--ap-line) 70%, transparent);
  border-radius: 8px;
  font-family: var(--ap-font-mono, ui-monospace, monospace);
  font-size: 0.72rem;
  line-height: 1.55;
  max-height: 240px;
  overflow: auto;
  white-space: pre;
  color: var(--ap-ink);
}

@media (max-width: 720px) {
  .ap-switcher.is-open { width: calc(100vw - 2rem); }
  .ap-switcher__panel { grid-template-columns: 1fr; }
}
</style>