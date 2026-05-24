<script setup lang="ts">
import { siteConfig } from '../config/site.config'
import HeroSection from '@apotome/archetype-shared/components/sections/HeroSection.vue'
import MenuSection from '../components/sections/MenuSection.vue'
</script>

<template>
  <HeroSection
    subpage
    eyebrow="Eat with us"
    title="The full menu"
    :subtitle="siteConfig.menu.intro"
    :image="siteConfig.photos.hero.src"
    :image-alt="siteConfig.photos.hero.alt"
  />
  <MenuSection
    :categories="siteConfig.menu.categories"
    :full-menu-url="siteConfig.menu.fullMenuUrl"
  />
</template>
