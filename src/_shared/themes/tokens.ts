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

export type SwatchGroup = 'neutral' | 'earth' | 'warm' | 'bold' | 'dark' | 'neon'
export const SWATCH_GROUP_LABELS: Record<SwatchGroup, string> = {
  neutral: 'Neutral',
  earth: 'Earth',
  warm: 'Warm',
  bold: 'Bold',
  dark: 'Dark',
  neon: 'Neon',
}

export type SwatchName =
  // Light
  | 'sand'
  | 'forest'
  | 'sage'
  | 'sunset'
  | 'rose'
  | 'stone'
  | 'fiesta'
  | 'citrus'
  // Dark
  | 'midnight'
  | 'obsidian'
  | 'ember'
  | 'plum'
  // Bold & Neon
  | 'electric'
  | 'punch'
  | 'neon'
  | 'aurora'
  | 'carnival'
  | 'acid'
  | 'mango'
  | 'synthwave'

export interface ColorSwatch {
  name: SwatchName
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

export type SiteVariant = 'essentials' | 'portfolio'

export type Archetype = 'dine' | 'stay' | 'shop' | 'project' | 'utility'

/** How many photos each variant expects in each gallery slot. */
export const VARIANT_PHOTO_COUNT: Record<SiteVariant, { gallery: number; max: number }> = {
  essentials: { gallery: 6, max: 8 },
  portfolio: { gallery: 12, max: 16 },
}
