<script setup lang="ts">
import { computed } from 'vue'
import { siteConfig } from '../config/site.config'
import HeroSection from '@apotome/archetype-shared/components/sections/HeroSection.vue'
import OrderingSection from '@apotome/archetype-shared/components/sections/OrderingSection.vue'
import MenuSection from '../components/sections/MenuSection.vue'
import { useSiteContentStore } from '@apotome/archetype-shared/platform/siteContentStore'

const store = useSiteContentStore()
const showOrdering = computed(() => store.hasAddOn('ordering'))
</script>

<template>
  <HeroSection
    subpage
    :eyebrow="siteConfig.sections.menuPage.eyebrow"
    :title="siteConfig.sections.menuPage.title"
    :subtitle="siteConfig.menu.intro"
    :image="siteConfig.photos.hero.src"
    :image-alt="siteConfig.photos.hero.alt"
  />

  <OrderingSection
    v-if="showOrdering"
    :eyebrow="siteConfig.sections.order.eyebrow"
    :title="siteConfig.sections.order.title"
    intro="Pick your items, choose a pickup time, and we'll have it ready."
  />

  <MenuSection
    v-else
    :categories="siteConfig.menu.categories"
    :full-menu-url="siteConfig.menu.fullMenuUrl"
  />
</template>
