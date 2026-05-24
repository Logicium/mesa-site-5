import type { ThemeTokens } from './tokens'

/**
 * The Studio — high-tech modern. Tight grids, mono accents,
 * Inter Tight for display, hairline rules, almost no shadow.
 */
export const studio: ThemeTokens = {
  name: 'studio',
  label: 'The Studio',
  description: 'High-tech modern. Tight grids, monospaced metadata, hairline rules.',
  fontHeading: '"Inter Tight", "Inter", "Helvetica Neue", Arial, sans-serif',
  fontBody: '"Inter", "Helvetica Neue", Arial, sans-serif',
  fontMono: '"IBM Plex Mono", ui-monospace, monospace',
  typeScale: 1,
  radius: '2px',
  radiusLg: '6px',
  shadow: '0 1px 0 rgba(15, 23, 42, 0.04)',
  shadowLg: '0 24px 48px -28px rgba(15, 23, 42, 0.22)',
  letterSpacingHeading: '-0.035em',
  letterSpacingBody: '0',
  uppercaseHeadings: false,
  sectionPaddingY: 'clamp(4.5rem, 9vw, 8rem)',
  containerMax: '1240px',
  headingWeight: 600,
  fontUrl:
    'https://fonts.googleapis.com/css2?family=Inter+Tight:wght@500;600;700&family=Inter:wght@300;400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap',
}
