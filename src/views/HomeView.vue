<script setup lang="ts">
import { computed } from 'vue'
import { siteConfig } from '../config/site.config'
import { VARIANT_PHOTO_COUNT, resolveVariant, variantAtLeast } from '@apotome/archetype-shared/themes/tokens'
import { useSiteContentStore } from '@apotome/archetype-shared/platform/siteContentStore'
import { useSiteTheme } from '@apotome/archetype-shared/composables/useSiteTheme'
import HeroSection from '@apotome/archetype-shared/components/sections/HeroSection.vue'
import AboutSection from '@apotome/archetype-shared/components/sections/AboutSection.vue'
import GallerySection from '@apotome/archetype-shared/components/sections/GallerySection.vue'
import MenuSection from '../components/sections/MenuSection.vue'
import HoursSection from '@apotome/archetype-shared/components/sections/HoursSection.vue'
import TestimonialsSection from '@apotome/archetype-shared/components/sections/TestimonialsSection.vue'

const { variant: liveVariant } = useSiteTheme()
const galleryLimit = computed(() => VARIANT_PHOTO_COUNT[resolveVariant(liveVariant.value)].gallery)
const isPortfolio = computed(() => variantAtLeast(liveVariant.value, 'portfolio'))
const content = useSiteContentStore()
const reviewItems = computed(() =>
  content.reviewsSource === 'google' && content.googleReviews.length
    ? content.googleReviews
    : siteConfig.testimonials,
)
</script>

<template>
  <HeroSection
    :eyebrow="siteConfig.tagline"
    :title="siteConfig.brand"
    :subtitle="siteConfig.blurb"
    :image="siteConfig.photos.hero.src"
    :image-alt="siteConfig.photos.hero.alt"
    :images="isPortfolio ? [siteConfig.photos.hero, ...siteConfig.photos.gallery.slice(0, 3)] : []"
    :cta-primary="{ label: 'See the menu', to: '/menu' }"
    :cta-secondary="{ label: 'Find us', to: '/visit' }"
    :layout="isPortfolio ? 'stage' : 'split'"
  />
  <AboutSection
    :eyebrow="siteConfig.sections.story.eyebrow"
    :title="siteConfig.story.title"
    :paragraphs="siteConfig.story.paragraphs"
    :facts="siteConfig.story.facts"
    :image="siteConfig.photos.about.src"
    :image-alt="siteConfig.photos.about.alt"
  />
  <GallerySection
    :eyebrow="siteConfig.sections.gallery.eyebrow"
    :title="siteConfig.sections.gallery.title"
    :photos="siteConfig.photos.gallery"
    :limit="galleryLimit"
    :layout="isPortfolio ? 'masonry' : 'grid'"
  />
  <MenuSection
    :eyebrow="siteConfig.sections.featured.eyebrow"
    :title="siteConfig.sections.featured.title"
    :intro="siteConfig.menu.intro"
    :categories="siteConfig.menu.categories.slice(0, isPortfolio ? 3 : 2)"
    :full-menu-url="'/menu'"
  />
  <HoursSection
    :eyebrow="siteConfig.sections.hours.eyebrow"
    :title="siteConfig.sections.hours.title"
    :hours="siteConfig.hours"
    :note="siteConfig.sections.hours.note"
  />
  <TestimonialsSection
    :eyebrow="siteConfig.sections.reviews.eyebrow"
    :items="reviewItems"
  />
</template>
