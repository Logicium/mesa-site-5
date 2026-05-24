<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { RouterView } from 'vue-router'
import { siteConfig } from './config/site.config'
import { useSiteTheme } from '@apotome/archetype-shared/composables/useSiteTheme'
import { useImagePreload } from '@apotome/archetype-shared/composables/useImagePreload'
import { useApScrollbar } from '@apotome/archetype-shared/composables/useApScrollbar'
import { usePreferences } from '@apotome/archetype-shared/composables/usePreferences'
import AppHeader from '@apotome/archetype-shared/components/layout/AppHeader.vue'
import AppFooter from '@apotome/archetype-shared/components/layout/AppFooter.vue'
import AppLoader from '@apotome/archetype-shared/components/AppLoader.vue'
import ThemeSwitcher from '@apotome/archetype-shared/components/ThemeSwitcher.vue'

const { init } = useSiteTheme()
const { isReady, preloadCritical } = useImagePreload()

onMounted(async () => {
  init(siteConfig.theme, siteConfig.swatch, siteConfig.variant, 'dine')
  useApScrollbar()
  await preloadCritical([
    siteConfig.photos.hero.src,
    siteConfig.photos.about.src,
    ...siteConfig.photos.gallery.map(p => p.src),
  ])
})

const showSwitcher = usePreferences().themePickerVisible

const navLinks = computed(() => {
  const base = [
    { to: '/', label: 'Home' },
    { to: '/menu', label: 'Menu' },
    { to: '/visit', label: 'Visit' },
  ]
  if (siteConfig.variant === 'portfolio') {
    base.splice(2, 0, { to: '/gallery', label: 'Gallery' })
  }
  return base
})
</script>

<template>
  <AppLoader :brand="siteConfig.brand" :visible="!isReady" />
  <AppHeader
    :brand="siteConfig.brand"
    :tagline="siteConfig.tagline"
    :links="navLinks"
    cta-label="Reserve"
    cta-to="/visit"
  />
  <main><RouterView /></main>
  <AppFooter
    :brand="siteConfig.brand"
    :blurb="siteConfig.blurb"
    :address="siteConfig.contact.address"
    :phone="siteConfig.contact.phone"
    :email="siteConfig.contact.email"
    :links="navLinks"
    :social="siteConfig.social"
  />
  <ThemeSwitcher v-if="showSwitcher" />
</template>
