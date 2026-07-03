/**
 * Theme token contracts shared across every Archetype site.
 * A "theme" defines feel (typography, spacing, shape).
 * A "swatch" defines color. They are composed at runtime.
 */

export type ThemeName = 'studio' | 'heritage' | 'vibrant' | 'ironwood'
export type HeroStyle = '1' | '2' | '3' | '4' | '5' | '6'
export type FooterStyle = '1' | '2' | '3' | '4' | '5'
export type ContactStyle = '1' | '2' | '3' | '4' | '5'
export type HoursStyle = '1' | '2' | '3' | '4' | '5'
export type GalleryStyle = '1' | '2' | '3' | '4' | '5'
export type ReviewsStyle = '1' | '2' | '3' | '4' | '5'
export type SubheroStyle = '1' | '2' | '3' | '4' | '5'
export type SiteStyle = '1' | '2' | '3' | '4' | '5'
export type Alignment = 'left' | 'center'

/**
 * Swatch groups are color *theories* — each one is a researched harmony
 * model with a distinct psychological register. Swatches inside a group
 * share the same harmony logic so they feel like siblings, not clones.
 */
export type SwatchGroup = 'earthen' | 'serene' | 'warm' | 'bold' | 'dark' | 'neon'
export const SWATCH_GROUP_LABELS: Record<SwatchGroup, string> = {
  earthen: 'Earthen',
  serene: 'Serene',
  warm: 'Warm',
  bold: 'Bold',
  dark: 'Dark',
  neon: 'Neon',
}

/** A color theory: the harmony model + the psychology behind a swatch group. */
export interface SwatchTheory {
  id: SwatchGroup
  label: string
  /** The harmony model the group is built on (color-wheel relationship). */
  harmony: string
  /** The documented psychological register the palette plays in. */
  psychology: string
  /** Who it tends to suit. */
  suits: string
}

export const SWATCH_THEORIES: SwatchTheory[] = [
  {
    id: 'earthen',
    label: 'Earthen',
    harmony: 'Analogous greens & ochres',
    psychology: 'Biophilic palettes lower stress and read as honest and grounded — nature hues signal restoration and trust.',
    suits: 'Farm-to-table dining, stays, wellness, craft trades',
  },
  {
    id: 'serene',
    label: 'Serene',
    harmony: 'Cool analogous blues, softened with warm accents',
    psychology: 'Blue is the most universally preferred hue; cool palettes signal competence, calm, and dependability.',
    suits: 'Professional services, lodging, galleries, healthcare-adjacent',
  },
  {
    id: 'warm',
    label: 'Warm',
    harmony: 'Adjacent reds, oranges & pinks',
    psychology: 'Warm hues raise energy and appetite — red-orange is the classic stimulant register for food and hospitality.',
    suits: 'Restaurants, cafés, bakeries, festive retail',
  },
  {
    id: 'bold',
    label: 'Bold',
    harmony: 'Complementary pairs at full chroma',
    psychology: 'Opposing hues create maximum simultaneous contrast — youthful, confident, impossible to ignore.',
    suits: 'Boutiques, makers, events, youth-facing brands',
  },
  {
    id: 'dark',
    label: 'Dark',
    harmony: 'Low-key monochrome with a metallic or jewel accent',
    psychology: 'Dark grounds read as premium and intimate — low-key lighting is the visual language of luxury.',
    suits: 'Fine dining, cocktail bars, high-end retail, venues',
  },
  {
    id: 'neon',
    label: 'Neon',
    harmony: 'Split-complementary brights on near-black',
    psychology: 'Maximum arousal palette — glowing chroma on darkness signals nightlife, music, and subculture energy.',
    suits: 'Nightlife, music venues, streetwear, gaming',
  },
]

export type SwatchName =
  // Earthen
  | 'sand'
  | 'sage'
  | 'forest'
  | 'citrus'
  // Serene
  | 'stone'
  | 'glacier'
  | 'tide'
  | 'lilac'
  // Warm
  | 'sunset'
  | 'rose'
  | 'fiesta'
  | 'mango'
  // Bold
  | 'electric'
  | 'punch'
  | 'carnival'
  // Dark
  | 'midnight'
  | 'obsidian'
  | 'ember'
  | 'plum'
  // Neon
  | 'neon'
  | 'aurora'
  | 'acid'
  | 'synthwave'

export interface ColorSwatch {
  /** Preset swatches use a SwatchName; user-built palettes use a free id. */
  name: string
  label: string
  mode: 'light' | 'dark'
  group: SwatchGroup
  primary: string
  accent: string
  surface: string
  surfaceAlt: string
  ink: string
  inkMuted: string
  line: string
  /** One-line feel description shown in pickers. */
  feel?: string
}

export interface ThemeTokens {
  name: ThemeName
  label: string
  description: string
  fontHeading: string
  fontBody: string
  fontMono: string
  /** Base scale modifier applied to type sizes. */
  typeScale: number
  radius: string
  radiusLg: string
  shadow: string
  shadowLg: string
  letterSpacingHeading: string
  letterSpacingBody: string
  uppercaseHeadings: boolean
  sectionPaddingY: string
  containerMax: string
  /** Optional google fonts URL. */
  fontUrl?: string
  /** Heading weight: themes vary intentionally. */
  headingWeight: number
}

export type SiteVariant = 'essentials' | 'portfolio' | 'extended'

export type Archetype = 'dine' | 'stay' | 'shop' | 'venue' | 'project' | 'utility'

/** How many photos each variant expects in each gallery slot. */
export const VARIANT_PHOTO_COUNT: Record<SiteVariant, { gallery: number; max: number }> = {
  essentials: { gallery: 6, max: 8 },
  portfolio: { gallery: 12, max: 16 },
  extended: { gallery: 20, max: 28 },
}

/**
 * Variants are a tier ladder — each unlocks everything below it plus more.
 * `extended` is a superset of `portfolio` (all its pages/sections + deeper
 * content and the largest galleries). Gate features with `variantAtLeast`
 * rather than `=== 'portfolio'` so `extended` inherits them automatically.
 */
export const VARIANT_RANK: Record<SiteVariant, number> = {
  essentials: 0,
  portfolio: 1,
  extended: 2,
}

export function variantAtLeast(variant: SiteVariant, min: SiteVariant): boolean {
  return VARIANT_RANK[variant] >= VARIANT_RANK[min]
}
