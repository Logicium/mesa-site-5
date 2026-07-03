import type { ThemeTokens } from './tokens'

/**
 * The Heritage — modern newspaper. High-contrast Playfair Display headlines
 * paired with the symmetrical, highly readable Source Serif body. Generous
 * whitespace, hairline rules, drop-cap accents.
 */
export const heritage: ThemeTokens = {
  name: 'heritage',
  label: 'The Heritage',
  description: 'Modern newspaper. Elegant Playfair Display headlines, refined Newsreader body.',
  fontHeading: '"Playfair Display", "Bodoni Moda", "Didot", Georgia, serif',
  fontBody: '"Newsreader", Georgia, "Times New Roman", serif',
  fontMono: '"IBM Plex Mono", ui-monospace, monospace',
  typeScale: 1.05,
  radius: '0px',
  radiusLg: '0px',
  shadow: 'none',
  shadowLg: 'none',
  letterSpacingHeading: '-0.015em',
  letterSpacingBody: '0.005em',
  uppercaseHeadings: false,
  sectionPaddingY: 'clamp(5rem, 11vw, 10rem)',
  containerMax: '1080px',
  headingWeight: 500,
  fontUrl:
    'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;1,6..72,400;1,6..72,500&display=swap',
}
