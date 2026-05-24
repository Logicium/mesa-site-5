import type { ColorSwatch, SwatchName } from './tokens'

/**
 * Curated color swatches. Eight light + four dark.
 * Designed to read well across all three themes.
 */
export const SWATCHES: Record<SwatchName, ColorSwatch> = {
  // ── Light ────────────────────────────────────────────
  sand: {
    name: 'sand', label: 'Sand', mode: 'light', group: 'neutral',
    primary: '#B8794A', accent: '#E8B777',
    surface: '#FAF6F0', surfaceAlt: '#FFFFFF',
    ink: '#2A2118', inkMuted: '#6B5D4F', line: '#E5DDD0',
  },
  forest: {
    name: 'forest', label: 'Forest', mode: 'light', group: 'earth',
    primary: '#1F5132', accent: '#E0B048',
    surface: '#F2EFE8', surfaceAlt: '#FFFFFF',
    ink: '#161E18', inkMuted: '#4F5F50', line: '#D5D9CB',
  },
  sage: {
    name: 'sage', label: 'Sage', mode: 'light', group: 'earth',
    primary: '#7C8B6B', accent: '#D8A06A',
    surface: '#F6F4EC', surfaceAlt: '#FFFFFF',
    ink: '#2B2F26', inkMuted: '#6B7062', line: '#DCDDD0',
  },
  sunset: {
    name: 'sunset', label: 'Sunset', mode: 'light', group: 'warm',
    primary: '#D14628', accent: '#F4A23A',
    surface: '#FFF7EE', surfaceAlt: '#FFFFFF',
    ink: '#2A1410', inkMuted: '#7A4838', line: '#F0DCC4',
  },
  rose: {
    name: 'rose', label: 'Rose', mode: 'light', group: 'warm',
    primary: '#A83254', accent: '#E8A3B6',
    surface: '#FBF4F5', surfaceAlt: '#FFFFFF',
    ink: '#2C1218', inkMuted: '#7A4856', line: '#EFD8DC',
  },
  stone: {
    name: 'stone', label: 'Stone', mode: 'light', group: 'neutral',
    primary: '#2B3A45', accent: '#F0A04B',
    surface: '#EDEEEC', surfaceAlt: '#FFFFFF',
    ink: '#11161A', inkMuted: '#4F5860', line: '#D2D5D2',
  },
  fiesta: {
    name: 'fiesta', label: 'Fiesta', mode: 'light', group: 'bold',
    primary: '#E63946', accent: '#FFD23F',
    surface: '#FFF8F0', surfaceAlt: '#FFFFFF',
    ink: '#1D1B1A', inkMuted: '#6B4A40', line: '#F2D9C2',
  },
  citrus: {
    name: 'citrus', label: 'Citrus', mode: 'light', group: 'earth',
    primary: '#0E7C66', accent: '#F5C518',
    surface: '#F4F8F0', surfaceAlt: '#FFFFFF',
    ink: '#0F2620', inkMuted: '#536A60', line: '#D7E0CD',
  },

  // ── Dark ─────────────────────────────────────────────
  midnight: {
    name: 'midnight', label: 'Midnight', mode: 'dark', group: 'dark',
    primary: '#7AA2F7', accent: '#C5A572',
    surface: '#0F1424', surfaceAlt: '#1A2138',
    ink: '#F1F2F7', inkMuted: '#A0A6BD', line: '#2A3252',
  },
  obsidian: {
    name: 'obsidian', label: 'Obsidian', mode: 'dark', group: 'dark',
    primary: '#E8E6E1', accent: '#C49A4A',
    surface: '#0D0D0E', surfaceAlt: '#181818',
    ink: '#F2F1ED', inkMuted: '#9E9C95', line: '#2A2A2C',
  },
  ember: {
    name: 'ember', label: 'Ember', mode: 'dark', group: 'dark',
    primary: '#F26B3A', accent: '#FFD27A',
    surface: '#1A1210', surfaceAlt: '#241814',
    ink: '#F8EDE3', inkMuted: '#B8978A', line: '#3B2620',
  },
  plum: {
    name: 'plum', label: 'Plum', mode: 'dark', group: 'dark',
    primary: '#D58CFF', accent: '#FFC773',
    surface: '#191024', surfaceAlt: '#241734',
    ink: '#F4ECFA', inkMuted: '#B098C5', line: '#3A2A4F',
  },

  // ── Bold & Neon ───────────────────────────────────────
  electric: {
    name: 'electric', label: 'Electric', mode: 'light', group: 'bold',
    primary: '#1A5FFF', accent: '#FF5C00',
    surface: '#F0F4FF', surfaceAlt: '#FFFFFF',
    ink: '#080E2E', inkMuted: '#3A4E90', line: '#C4D3FC',
  },
  punch: {
    name: 'punch', label: 'Punch', mode: 'light', group: 'bold',
    primary: '#E0005E', accent: '#AEFF00',
    surface: '#FFF3F8', surfaceAlt: '#FFFFFF',
    ink: '#280010', inkMuted: '#7A2050', line: '#F7C0D8',
  },
  neon: {
    name: 'neon', label: 'Neon', mode: 'dark', group: 'neon',
    primary: '#00FF88', accent: '#FF3CAC',
    surface: '#050A08', surfaceAlt: '#0D1A12',
    ink: '#DFFFEE', inkMuted: '#70BF94', line: '#0A3020',
  },
  aurora: {
    name: 'aurora', label: 'Aurora', mode: 'dark', group: 'neon',
    primary: '#00D4FF', accent: '#CC00FF',
    surface: '#060810', surfaceAlt: '#0C1422',
    ink: '#E4F4FF', inkMuted: '#6AA8CC', line: '#0D2040',
  },
  carnival: {
    name: 'carnival', label: 'Carnival', mode: 'light', group: 'bold',
    primary: '#FF3D77', accent: '#00C9A7',
    surface: '#FFF6FA', surfaceAlt: '#FFFFFF',
    ink: '#2A0820', inkMuted: '#7A3060', line: '#FAD0DD',
  },
  acid: {
    name: 'acid', label: 'Acid', mode: 'dark', group: 'neon',
    primary: '#A3FF12', accent: '#FF1FB6',
    surface: '#0C1208', surfaceAlt: '#152012',
    ink: '#E8FFD4', inkMuted: '#88A06A', line: '#1E3010',
  },
  mango: {
    name: 'mango', label: 'Mango', mode: 'light', group: 'bold',
    primary: '#FF7A00', accent: '#FF1493',
    surface: '#FFF6EC', surfaceAlt: '#FFFFFF',
    ink: '#2A1408', inkMuted: '#8A4A20', line: '#F6D5B5',
  },
  synthwave: {
    name: 'synthwave', label: 'Synthwave', mode: 'dark', group: 'neon',
    primary: '#FF2EAA', accent: '#00F0FF',
    surface: '#0A0420', surfaceAlt: '#150A38',
    ink: '#FFE0F2', inkMuted: '#A878B8', line: '#2A1450',
  },
}

export const SWATCH_LIST: ColorSwatch[] = Object.values(SWATCHES)
