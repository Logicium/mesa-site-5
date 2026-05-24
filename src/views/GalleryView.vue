<script setup lang="ts">
import { siteConfig } from '../config/site.config'
import HeroSection from '@apotome/archetype-shared/components/sections/HeroSection.vue'
import GallerySection from '@apotome/archetype-shared/components/sections/GallerySection.vue'
</script>

<template>
  <HeroSection
    subpage
    eyebrow="Gallery"
    title="The kitchen, the room, the food"
    :image="siteConfig.photos.about.src"
    :image-alt="siteConfig.photos.about.alt"
  />
  <GallerySection :photos="siteConfig.photos.gallery" layout="masonry" />
</template>
