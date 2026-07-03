import type { ColorSwatch, SwatchName } from './tokens'

/**
 * Curated color swatches, organized by color theory (see SWATCH_THEORIES).
 *
 * Every swatch is tuned so its *surface* carries a real tint — the page
 * background is part of the palette, not a default white. Within a theory
 * group the swatches share a harmony model but stake out clearly different
 * temperature / hue territory, so switching between them feels like a real
 * change of mood rather than a shuffle of the same page.
 */
export const SWATCHES: Record<SwatchName, ColorSwatch> = {
  // ── Earthen · analogous greens & ochres ─────────────────────
  sand: {
    name: 'sand', label: 'Sand', mode: 'light', group: 'earthen',
    feel: 'Warm adobe cream with caramel and honey',
    primary: '#A96F3D', accent: '#D9A45B',
    surface: '#F7EFE1', surfaceAlt: '#FFFCF5',
    ink: '#241B10', inkMuted: '#6E5C44', line: '#E6D7BC',
  },
  sage: {
    name: 'sage', label: 'Sage', mode: 'light', group: 'earthen',
    feel: 'Milky green herb garden, quiet and steady',
    primary: '#5F7550', accent: '#C89B5F',
    surface: '#EDF0E1', surfaceAlt: '#F9FAF2',
    ink: '#20261A', inkMuted: '#5C6650', line: '#D5DCC2',
  },
  forest: {
    name: 'forest', label: 'Forest', mode: 'light', group: 'earthen',
    feel: 'Deep pine over moss-tinted paper, gold seam',
    primary: '#1E5638', accent: '#D9A93C',
    surface: '#E6EDE4', surfaceAlt: '#F5F9F3',
    ink: '#11211A', inkMuted: '#46584C', line: '#C9D6C6',
  },
  citrus: {
    name: 'citrus', label: 'Citrus', mode: 'light', group: 'earthen',
    feel: 'Leaf green and lemon on citron-washed ground',
    primary: '#3E7C42', accent: '#F2C230',
    surface: '#F2F5E1', surfaceAlt: '#FBFCEF',
    ink: '#1B2414', inkMuted: '#59684C', line: '#DCE2BF',
  },

  // ── Serene · cool analogous blues, warm accents ─────────────
  stone: {
    name: 'stone', label: 'Stone', mode: 'light', group: 'serene',
    feel: 'Mineral slate and porcelain, copper warmth',
    primary: '#34505E', accent: '#D98E4A',
    surface: '#E9EDEE', surfaceAlt: '#F7F9FA',
    ink: '#131B1F', inkMuted: '#51616B', line: '#CDD6D9',
  },
  glacier: {
    name: 'glacier', label: 'Glacier', mode: 'light', group: 'serene',
    feel: 'Ice-blue calm with a low amber sun',
    primary: '#2E6E8E', accent: '#E29A5C',
    surface: '#E8F1F6', surfaceAlt: '#F6FAFC',
    ink: '#10222B', inkMuted: '#4D6674', line: '#CEDFE8',
  },
  tide: {
    name: 'tide', label: 'Tide', mode: 'light', group: 'serene',
    feel: 'Seafoam and deep teal, driftwood gold',
    primary: '#0E7373', accent: '#E8B45C',
    surface: '#E4F0EC', surfaceAlt: '#F3FAF7',
    ink: '#0E2320', inkMuted: '#44605B', line: '#C9DED8',
  },
  lilac: {
    name: 'lilac', label: 'Lilac', mode: 'light', group: 'serene',
    feel: 'Lavender mist, dusty violet, soft apricot',
    primary: '#6B5B95', accent: '#E3A587',
    surface: '#EFECF6', surfaceAlt: '#FAF8FD',
    ink: '#201A2E', inkMuted: '#615A74', line: '#DBD5E9',
  },

  // ── Warm · adjacent reds, oranges & pinks ───────────────────
  sunset: {
    name: 'sunset', label: 'Sunset', mode: 'light', group: 'warm',
    feel: 'Vermilion heat on peach-cream evening light',
    primary: '#C93F1D', accent: '#F2A73B',
    surface: '#FCEFE0', surfaceAlt: '#FFF9F0',
    ink: '#2B150C', inkMuted: '#7C4A34', line: '#F0D6BA',
  },
  rose: {
    name: 'rose', label: 'Rose', mode: 'light', group: 'warm',
    feel: 'Blush ground, wine rose, terracotta touch',
    primary: '#B03A5B', accent: '#E7A97E',
    surface: '#FAEDEF', surfaceAlt: '#FEF8F8',
    ink: '#2C151B', inkMuted: '#7D5560', line: '#EFD3D8',
  },
  fiesta: {
    name: 'fiesta', label: 'Fiesta', mode: 'light', group: 'warm',
    feel: 'Chili red and marigold on warm paper',
    primary: '#D7263D', accent: '#FFB400',
    surface: '#FDF2E0', surfaceAlt: '#FFFAF0',
    ink: '#241512', inkMuted: '#74503F', line: '#F1DBBA',
  },
  mango: {
    name: 'mango', label: 'Mango', mode: 'light', group: 'warm',
    feel: 'Ripe orange with a magenta bite, apricot ground',
    primary: '#E86A10', accent: '#D9308A',
    surface: '#FCF0DE', surfaceAlt: '#FFF8EC',
    ink: '#291607', inkMuted: '#82552F', line: '#F1D9B4',
  },

  // ── Bold · complementary pairs at full chroma ───────────────
  electric: {
    name: 'electric', label: 'Electric', mode: 'light', group: 'bold',
    feel: 'Cobalt against safety orange on periwinkle ice',
    primary: '#1B4FFF', accent: '#FF6A00',
    surface: '#ECF1FE', surfaceAlt: '#F8FAFF',
    ink: '#0A102E', inkMuted: '#3D4C86', line: '#D2DCFB',
  },
  punch: {
    name: 'punch', label: 'Punch', mode: 'light', group: 'bold',
    feel: 'Hot magenta with lime static on pink-white',
    primary: '#E0166E', accent: '#8FD400',
    surface: '#FCEFF5', surfaceAlt: '#FFF8FB',
    ink: '#250312', inkMuted: '#7A2B52', line: '#F4CBDE',
  },
  carnival: {
    name: 'carnival', label: 'Carnival', mode: 'light', group: 'bold',
    feel: 'Flamingo pink over cool mint, tropical opposites',
    primary: '#F72567', accent: '#00C9A7',
    surface: '#ECFAF4', surfaceAlt: '#F8FEFB',
    ink: '#0F2A23', inkMuted: '#3F6A5E', line: '#CDEBDF',
  },

  // ── Dark · low-key luxury with a jewel accent ───────────────
  midnight: {
    name: 'midnight', label: 'Midnight', mode: 'dark', group: 'dark',
    feel: 'Navy-black velvet, periwinkle glow, brass trim',
    primary: '#8CA9FF', accent: '#D8B36A',
    surface: '#0D1220', surfaceAlt: '#161D33',
    ink: '#EEF1FA', inkMuted: '#9BA4C4', line: '#26304F',
  },
  obsidian: {
    name: 'obsidian', label: 'Obsidian', mode: 'dark', group: 'dark',
    feel: 'True black gallery, bone type, old gold',
    primary: '#E4E1DA', accent: '#C09040',
    surface: '#0B0B0C', surfaceAlt: '#161617',
    ink: '#F1EFEA', inkMuted: '#98958D', line: '#262628',
  },
  ember: {
    name: 'ember', label: 'Ember', mode: 'dark', group: 'dark',
    feel: 'Charred cedar with live coals and honeyed light',
    primary: '#F0632F', accent: '#F8C77E',
    surface: '#170F0C', surfaceAlt: '#231510',
    ink: '#F9EDE4', inkMuted: '#B8937F', line: '#3A241B',
  },
  plum: {
    name: 'plum', label: 'Plum', mode: 'dark', group: 'dark',
    feel: 'Midnight orchid, candlelit amber, velvet depth',
    primary: '#CE8CF0', accent: '#F0B45F',
    surface: '#150E20', surfaceAlt: '#1F1530',
    ink: '#F3EBFA', inkMuted: '#A791BE', line: '#35244D',
  },

  // ── Neon · split-complementary brights on near-black ────────
  neon: {
    name: 'neon', label: 'Neon', mode: 'dark', group: 'neon',
    feel: 'Signal green burning through a dark room',
    primary: '#00F582', accent: '#FF3CAC',
    surface: '#04100A', surfaceAlt: '#0A1F14',
    ink: '#DCFFEE', inkMuted: '#67B98E', line: '#103A26',
  },
  aurora: {
    name: 'aurora', label: 'Aurora', mode: 'dark', group: 'neon',
    feel: 'Arctic cyan and violet sheets across night sky',
    primary: '#22CCFF', accent: '#B44CFF',
    surface: '#050912', surfaceAlt: '#0B1526',
    ink: '#E2F3FF', inkMuted: '#6FA3C4', line: '#12294A',
  },
  acid: {
    name: 'acid', label: 'Acid', mode: 'dark', group: 'neon',
    feel: 'Chartreuse strike with a magenta afterimage',
    primary: '#B4FF2B', accent: '#FF2BC9',
    surface: '#0B0F06', surfaceAlt: '#131C0C',
    ink: '#EDFFD6', inkMuted: '#8CA46B', line: '#223812',
  },
  synthwave: {
    name: 'synthwave', label: 'Synthwave', mode: 'dark', group: 'neon',
    feel: 'Hot pink horizon over chrome-cyan grid lines',
    primary: '#FF2EAA', accent: '#16F0E0',
    surface: '#0B0522', surfaceAlt: '#170C3B',
    ink: '#FFE2F3', inkMuted: '#A87CBC', line: '#2E1758',
  },
}

export const SWATCH_LIST: ColorSwatch[] = Object.values(SWATCHES)
