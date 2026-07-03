import type { ThemeName, ThemeTokens } from './tokens'
import { studio } from './studio'
import { heritage } from './heritage'
import { vibrant } from './vibrant'
import { ironwood } from './ironwood'

export const THEMES: Record<ThemeName, ThemeTokens> = {
  studio,
  heritage,
  vibrant,
  ironwood,
}

export const THEME_LIST: ThemeTokens[] = [studio, heritage, vibrant, ironwood]

export * from './tokens'
export * from './swatches'
export * from './customSwatches'
export * from './applyTheme'
