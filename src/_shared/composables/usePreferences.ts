import { ref, computed, watch } from 'vue'
import { useAdminAuthStore } from '../platform/adminAuthStore'

/**
 * User-level UI preferences persisted in localStorage. Currently controls the
 * theme picker visibility — defaults to ON for signed-in site owners and OFF
 * for anonymous visitors. The user can override either way from /admin/account.
 */
const STORAGE_KEY = 'archetype_prefs_v1'

type Prefs = {
  themePickerVisible: 'auto' | 'on' | 'off'
}

const DEFAULTS: Prefs = { themePickerVisible: 'auto' }

function load(): Prefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULTS }
    return { ...DEFAULTS, ...JSON.parse(raw) }
  } catch {
    return { ...DEFAULTS }
  }
}

const state = ref<Prefs>(load())

watch(state, (v) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(v)) } catch { /* ignore */ }
}, { deep: true })

export function usePreferences() {
  const auth = useAdminAuthStore()

  const themePickerVisible = computed(() => {
    const mode = state.value.themePickerVisible
    if (mode === 'on') return true
    if (mode === 'off') return false
    return !!auth.owner
  })

  function setThemePickerVisibility(mode: Prefs['themePickerVisible']) {
    state.value = { ...state.value, themePickerVisible: mode }
  }

  return {
    state,
    themePickerVisible,
    setThemePickerVisibility,
  }
}
