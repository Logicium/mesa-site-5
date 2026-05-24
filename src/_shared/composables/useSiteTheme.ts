import { ref, computed, watchEffect } from 'vue'
import type { ThemeName, SwatchName, ThemeTokens, ColorSwatch, SiteVariant, Archetype, HeroStyle, FooterStyle, ContactStyle, HoursStyle, GalleryStyle, ReviewsStyle, SubheroStyle, SiteStyle, Alignment } from '../themes/tokens'
import { THEMES } from '../themes'
import { SWATCHES } from '../themes/swatches'
import { applyTheme } from '../themes/applyTheme'

const STORAGE_KEY = 'ap-theme-config'

function readStorage(): Partial<{
  theme: ThemeName; swatch: SwatchName; variant: SiteVariant;
  heroStyle: HeroStyle; footerStyle: FooterStyle;
  contactStyle: ContactStyle; hoursStyle: HoursStyle;
  galleryStyle: GalleryStyle; reviewsStyle: ReviewsStyle;
  subheroStyle: SubheroStyle;
  siteStyle: SiteStyle;
  alignment: Alignment;
}> {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') } catch { return {} }
}

const _saved = readStorage()

const themeRef = ref<ThemeName>(_saved.theme ?? 'studio')
const swatchRef = ref<SwatchName>(_saved.swatch ?? 'sand')
const variantRef = ref<SiteVariant>(_saved.variant ?? 'essentials')
const archetypeRef = ref<Archetype>('dine')
const heroStyleRef = ref<HeroStyle>(_saved.heroStyle ?? '1')
const footerStyleRef = ref<FooterStyle>(_saved.footerStyle ?? '1')
const contactStyleRef = ref<ContactStyle>(_saved.contactStyle ?? '1')
const hoursStyleRef = ref<HoursStyle>(_saved.hoursStyle ?? '1')
const galleryStyleRef = ref<GalleryStyle>(_saved.galleryStyle ?? '1')
const reviewsStyleRef = ref<ReviewsStyle>(_saved.reviewsStyle ?? '1')
const subheroStyleRef = ref<SubheroStyle>(_saved.subheroStyle ?? '1')
const siteStyleRef = ref<SiteStyle>(_saved.siteStyle ?? '1')
const alignmentRef = ref<Alignment>(_saved.alignment ?? 'left')

// Module-level effect — single instance, persists + syncs CSS vars on every change
watchEffect(() => {
  applyTheme(
    THEMES[themeRef.value],
    SWATCHES[swatchRef.value],
    variantRef.value,
    archetypeRef.value,
    heroStyleRef.value,
    footerStyleRef.value,
    contactStyleRef.value,
    hoursStyleRef.value,
    galleryStyleRef.value,
    reviewsStyleRef.value,
    subheroStyleRef.value,
    siteStyleRef.value,
    alignmentRef.value,
  )
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      theme: themeRef.value,
      swatch: swatchRef.value,
      variant: variantRef.value,
      heroStyle: heroStyleRef.value,
      footerStyle: footerStyleRef.value,
      contactStyle: contactStyleRef.value,
      hoursStyle: hoursStyleRef.value,
      galleryStyle: galleryStyleRef.value,
      reviewsStyle: reviewsStyleRef.value,
      subheroStyle: subheroStyleRef.value,
      siteStyle: siteStyleRef.value,
      alignment: alignmentRef.value,
    }))
  } catch { /* storage unavailable */ }
})

/**
 * Reactive theme + swatch + variant + archetype controller.
 * Call `init()` once at app boot from the site config; any
 * component can then call `setTheme()` / `setSwatch()` / `setVariant()`.
 * Settings are persisted to localStorage and restored on refresh.
 */
export function useSiteTheme() {
  const theme = computed<ThemeTokens>(() => THEMES[themeRef.value])
  const swatch = computed<ColorSwatch>(() => SWATCHES[swatchRef.value])

  function setTheme(name: ThemeName) { themeRef.value = name }
  function setSwatch(name: SwatchName) { swatchRef.value = name }
  function setVariant(v: SiteVariant) { variantRef.value = v }
  function setArchetype(a: Archetype) { archetypeRef.value = a }
  function setHeroStyle(s: HeroStyle) { heroStyleRef.value = s }
  function setFooterStyle(s: FooterStyle) { footerStyleRef.value = s }
  function setContactStyle(s: ContactStyle) { contactStyleRef.value = s }
  function setHoursStyle(s: HoursStyle) { hoursStyleRef.value = s }
  function setGalleryStyle(s: GalleryStyle) { galleryStyleRef.value = s }
  function setReviewsStyle(s: ReviewsStyle) { reviewsStyleRef.value = s }
  function setSubheroStyle(s: SubheroStyle) { subheroStyleRef.value = s }
  function setSiteStyle(s: SiteStyle) { siteStyleRef.value = s }
  function setAlignment(a: Alignment) { alignmentRef.value = a }
  function init(
    name: ThemeName,
    swatchName: SwatchName,
    variant: SiteVariant = 'essentials',
    archetype: Archetype = 'dine',
    heroStyle: HeroStyle = '1',
    footerStyle: FooterStyle = '1',
    contactStyle: ContactStyle = '1',
    hoursStyle: HoursStyle = '1',
    galleryStyle: GalleryStyle = '1',
    reviewsStyle: ReviewsStyle = '1',
    subheroStyle: SubheroStyle = '1',
    siteStyle: SiteStyle = '1',
    alignment: Alignment = 'left',
  ) {
    // Archetype is always from site config, never from user storage
    archetypeRef.value = archetype
    // User-configurable fields: only apply init defaults when nothing is saved
    if (!_saved.theme) themeRef.value = name
    if (!_saved.swatch) swatchRef.value = swatchName
    if (!_saved.variant) variantRef.value = variant
    if (!_saved.heroStyle) heroStyleRef.value = heroStyle
    if (!_saved.footerStyle) footerStyleRef.value = footerStyle
    if (!_saved.contactStyle) contactStyleRef.value = contactStyle
    if (!_saved.hoursStyle) hoursStyleRef.value = hoursStyle
    if (!_saved.galleryStyle) galleryStyleRef.value = galleryStyle
    if (!_saved.reviewsStyle) reviewsStyleRef.value = reviewsStyle
    if (!_saved.subheroStyle) subheroStyleRef.value = subheroStyle
    if (!_saved.siteStyle) siteStyleRef.value = siteStyle
    if (!_saved.alignment) alignmentRef.value = alignment
  }

  return {
    theme, swatch,
    themeName: themeRef, swatchName: swatchRef,
    variant: variantRef, archetype: archetypeRef,
    heroStyle: heroStyleRef, footerStyle: footerStyleRef,
    contactStyle: contactStyleRef, hoursStyle: hoursStyleRef,
    galleryStyle: galleryStyleRef, reviewsStyle: reviewsStyleRef,
    subheroStyle: subheroStyleRef,
    siteStyle: siteStyleRef,
    alignment: alignmentRef,
    setTheme, setSwatch, setVariant, setArchetype,
    setHeroStyle, setFooterStyle,
    setContactStyle, setHoursStyle, setGalleryStyle, setReviewsStyle, setSubheroStyle,
    setSiteStyle,
    setAlignment,
    init,
  }
}

