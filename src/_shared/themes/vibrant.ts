import type { ThemeTokens } from './tokens'

/**
 * The Vibrant — playful & bold. Bricolage Grotesque (medium weight),
 * chunky shapes, hard offset shadows, oversized type.
 */
export const vibrant: ThemeTokens = {
  name: 'vibrant',
  label: 'The Vibrant',
  description: 'Playful and bold. Big shapes, hard shadows, energetic typography.',
  fontHeading: '"Bricolage Grotesque", "Space Grotesk", system-ui, sans-serif',
  fontBody: '"Space Grotesk", "Inter", system-ui, sans-serif',
  fontMono: '"Space Mono", ui-monospace, monospace',
  typeScale: 1.1,
  radius: '18px',
  radiusLg: '32px',
  shadow: '5px 5px 0 rgba(0, 0, 0, 0.92)',
  shadowLg: '10px 10px 0 rgba(0, 0, 0, 0.92)',
  letterSpacingHeading: '-0.02em',
  letterSpacingBody: '0',
  uppercaseHeadings: false,
  sectionPaddingY: 'clamp(4rem, 8vw, 7rem)',
  containerMax: '1320px',
  headingWeight: 600,
  fontUrl:
    'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,600;12..96,700&family=Space+Grotesk:wght@400;500;600;700&display=swap',
}
