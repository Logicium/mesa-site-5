import type { ThemeTokens } from './tokens'

/**
 * The Heritage — minimalist rustic charm. Warm Fraunces serif,
 * generous whitespace, hairline rules, drop-cap accents.
 */
export const heritage: ThemeTokens = {
  name: 'heritage',
  label: 'The Heritage',
  description: 'Minimalist rustic charm. Warm serif, hairlines, generous whitespace.',
  fontHeading: '"Fraunces", "Cormorant Garamond", Georgia, serif',
  fontBody: '"Lora", Georgia, "Times New Roman", serif',
  fontMono: '"IBM Plex Mono", ui-monospace, monospace',
  typeScale: 1.05,
  radius: '0px',
  radiusLg: '0px',
  shadow: 'none',
  shadowLg: 'none',
  letterSpacingHeading: '-0.01em',
  letterSpacingBody: '0.01em',
  uppercaseHeadings: false,
  sectionPaddingY: 'clamp(5rem, 11vw, 10rem)',
  containerMax: '1080px',
  headingWeight: 400,
  fontUrl:
    'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Lora:wght@400;500;600&display=swap',
}
