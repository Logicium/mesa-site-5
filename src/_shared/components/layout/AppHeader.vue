<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, useTemplateRef } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useSiteTheme } from '../../composables/useSiteTheme'

defineProps<{
  brand: string
  tagline?: string
  links: Array<{ to: string; label: string }>
  ctaLabel?: string
  ctaTo?: string
}>()

const route = useRoute()
const { heroStyle, subheroStyle } = useSiteTheme()
const open = ref(false)
const scrolled = ref(false)
const headerEl = useTemplateRef<HTMLElement>('headerEl')

/**
 * Header sits transparently OVER the page hero when:
 *  - on home (`/`) and the home hero is Overlay (heroStyle '2') or
 *    Broadsheet (heroStyle '3'), OR
 *  - on a subpage and the subhero is Banner ('2') or Broadsheet ('4').
 */
const transparentEligible = computed(() => {
  const isHome = route.path === '/'
  if (isHome) return heroStyle.value === '2' || heroStyle.value === '3'
  return subheroStyle.value === '2' || subheroStyle.value === '4'
})

/**
 * Light-on-dark text only over photo-backed heroes:
 *  - home Overlay ('2'), or subpage Banner ('2').
 * Broadsheet variants keep dark text since they sit on a colored panel.
 */
const lightOnDark = computed(() => {
  const isHome = route.path === '/'
  if (isHome) return heroStyle.value === '2'
  return subheroStyle.value === '2'
})

function onScroll() {
  scrolled.value = window.scrollY > 40
}

let ro: ResizeObserver | undefined
function publishHeight() {
  if (!headerEl.value) return
  const h = headerEl.value.offsetHeight
  document.documentElement.style.setProperty('--ap-header-h', h + 'px')
}

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true })
  publishHeight()
  if (headerEl.value) {
    ro = new ResizeObserver(publishHeight)
    ro.observe(headerEl.value)
  }
  window.addEventListener('resize', publishHeight)
})
onUnmounted(() => {
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('resize', publishHeight)
  ro?.disconnect()
})
</script>

<template>
  <header
    ref="headerEl"
    class="ap-header"
    :class="{
      'is-scrolled': scrolled,
      'is-transparent-eligible': transparentEligible,
      'is-transparent': transparentEligible && !scrolled,
      'is-light': lightOnDark && !scrolled,
    }"
  >
    <div class="ap-container ap-header__row">
      <RouterLink to="/" class="ap-header__brand" @click="open = false">
        <span class="ap-header__brand-name">{{ brand }}</span>
        <span v-if="tagline" class="ap-header__brand-tag">{{ tagline }}</span>
      </RouterLink>

      <button
        class="ap-header__toggle"
        :aria-expanded="open"
        aria-label="Toggle menu"
        @click="open = !open"
      >
        <span /><span /><span />
      </button>

      <nav class="ap-header__nav" :class="{ 'is-open': open }" @click="open = false">
        <RouterLink
          v-for="link in links"
          :key="link.to"
          :to="link.to"
          class="ap-header__link"
          :class="{ 'is-active': route.path === link.to }"
        >
          {{ link.label }}
        </RouterLink>
        <RouterLink v-if="ctaLabel && ctaTo" :to="ctaTo" class="ap-btn ap-header__cta">
          {{ ctaLabel }}
        </RouterLink>
      </nav>
    </div>
  </header>
</template>

<style scoped>
.ap-header {
  position: sticky; top: 0; z-index: 50;
  background: color-mix(in srgb, var(--ap-surface) 92%, transparent);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--ap-line);
  transition: background 300ms ease, border-color 300ms ease, box-shadow 300ms ease, color 300ms ease;
}
/* Transparent floating navbar for hero-eligible pages (until scrolled). */
.ap-header.is-transparent {
  position: fixed; top: 0; left: 0; right: 0;
  background: transparent;
  backdrop-filter: none;
  border-bottom-color: transparent;
}
/* Light-on-dark variant for nav over photo heroes (overlay/banner). */
.ap-header.is-light,
.ap-header.is-light .ap-header__brand-name,
.ap-header.is-light .ap-header__brand-tag,
.ap-header.is-light .ap-header__link { color: #fff; }
.ap-header.is-light .ap-header__brand-tag { color: rgba(255,255,255,0.78); }
.ap-header.is-light .ap-header__toggle span { background: #fff; }
.ap-header.is-light .ap-header__cta {
  background: rgba(255,255,255,0.12);
  border-color: rgba(255,255,255,0.6);
  color: #fff;
}
.ap-header.is-light .ap-header__link.is-active::after { background: #fff; }
.ap-header__row {
  display: flex; align-items: center; justify-content: space-between;
  padding-top: 1rem; padding-bottom: 1rem; gap: 1.5rem;
}
.ap-header__brand {
  display: flex; flex-direction: column; line-height: 1;
  color: var(--ap-ink); border-bottom: none;
}
.ap-header__brand-name {
  font-family: var(--ap-font-heading);
  font-size: 1.35rem; font-weight: 700;
  letter-spacing: var(--ap-tracking-heading);
  text-transform: var(--ap-heading-transform);
}
.ap-header__brand-tag {
  font-size: 0.72rem; letter-spacing: 0.16em;
  text-transform: uppercase; color: var(--ap-ink-muted);
  margin-top: 0.35rem;
}
.ap-header__nav {
  display: flex; align-items: center; gap: 1.75rem;
}
.ap-header__link {
  color: var(--ap-ink); border-bottom: none;
  font-family: var(--ap-font-heading);
  font-size: 0.95rem; font-weight: 500;
  letter-spacing: var(--ap-tracking-heading);
  text-transform: var(--ap-heading-transform);
  position: relative;
}
.ap-header__link.is-active::after {
  content: ''; position: absolute; left: 0; right: 0; bottom: -6px;
  height: 2px; background: var(--ap-primary);
}
.ap-header__cta { padding: 0.6rem 1.1rem; font-size: 0.85rem; }

.ap-header__toggle {
  display: none; background: none; border: 0;
  width: 36px; height: 36px; flex-direction: column;
  justify-content: center; gap: 5px; padding: 0;
}
.ap-header__toggle span {
  display: block; height: 2px; background: var(--ap-ink); width: 22px; margin: 0 auto;
}
@media (max-width: 760px) {
  .ap-header__toggle { display: inline-flex; }
  .ap-header__nav {
    position: absolute; top: 100%; left: 0; right: 0;
    flex-direction: column; align-items: stretch; gap: 0;
    background: var(--ap-surface);
    border-bottom: 1px solid var(--ap-line);
    padding: 1rem clamp(1rem, 4vw, 2.5rem);
    transform: translateY(-12px); opacity: 0; pointer-events: none;
    transition: opacity 160ms ease, transform 160ms ease;
  }
  .ap-header__nav.is-open { opacity: 1; transform: none; pointer-events: auto; }
  .ap-header__link { padding: 0.85rem 0; border-bottom: 1px solid var(--ap-line); }
  .ap-header__link:last-of-type { border-bottom: 0; }
  .ap-header__cta { margin-top: 0.75rem; align-self: flex-start; }
}
</style>
