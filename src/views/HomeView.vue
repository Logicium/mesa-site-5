<script setup lang="ts">
import { computed } from 'vue'
import { siteConfig } from '../config/site.config'
import { VARIANT_PHOTO_COUNT } from '@apotome/archetype-shared/themes/tokens'
import HeroSection from '@apotome/archetype-shared/components/sections/HeroSection.vue'
import AboutSection from '@apotome/archetype-shared/components/sections/AboutSection.vue'
import GallerySection from '@apotome/archetype-shared/components/sections/GallerySection.vue'
import MenuSection from '../components/sections/MenuSection.vue'
import HoursSection from '@apotome/archetype-shared/components/sections/HoursSection.vue'
import TestimonialsSection from '@apotome/archetype-shared/components/sections/TestimonialsSection.vue'

const galleryLimit = computed(() => VARIANT_PHOTO_COUNT[siteConfig.variant].gallery)
const isPortfolio = computed(() => siteConfig.variant === 'portfolio')
</script>

<template>
  <HeroSection
    :eyebrow="siteConfig.tagline"
    :title="siteConfig.brand"
    :subtitle="siteConfig.blurb"
    :image="siteConfig.photos.hero.src"
    :image-alt="siteConfig.photos.hero.alt"
    :cta-primary="{ label: 'See the menu', to: '/menu' }"
    :cta-secondary="{ label: 'Find us', to: '/visit' }"
    :layout="isPortfolio ? 'stage' : 'split'"
  />
  <AboutSection
    eyebrow="Our story"
    :title="siteConfig.story.title"
    :paragraphs="siteConfig.story.paragraphs"
    :facts="siteConfig.story.facts"
    :image="siteConfig.photos.about.src"
    :image-alt="siteConfig.photos.about.alt"
  />
  <GallerySection
    eyebrow="From the kitchen"
    title="A look around"
    :photos="siteConfig.photos.gallery"
    :limit="galleryLimit"
    :layout="isPortfolio ? 'masonry' : 'grid'"
  />
  <MenuSection
    eyebrow="Tonight"
    title="A few favorites"
    :intro="siteConfig.menu.intro"
    :categories="siteConfig.menu.categories.slice(0, isPortfolio ? 3 : 2)"
    :full-menu-url="'/menu'"
  />
  <HoursSection
    eyebrow="Visit"
    :title="'When to come by'"
    :hours="siteConfig.hours"
    :note="'Brunch and dinner. Reservations recommended on weekends.'"
  />
  <TestimonialsSection
    eyebrow="Kind words"
    :items="siteConfig.testimonials"
  />
</template>
