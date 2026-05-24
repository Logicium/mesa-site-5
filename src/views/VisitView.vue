<script setup lang="ts">
import { siteConfig } from '../config/site.config'
import HeroSection from '@apotome/archetype-shared/components/sections/HeroSection.vue'
import ContactSection from '../components/sections/ContactSection.vue'
import HoursSection from '@apotome/archetype-shared/components/sections/HoursSection.vue'
</script>

<template>
  <HeroSection
    subpage
    eyebrow="Visit"
    title="Find your seat"
    subtitle="We are easy to find on Main Street, with parking on the cross streets."
    :image="siteConfig.photos.hero.src"
    :image-alt="siteConfig.photos.hero.alt"
  />
  <ContactSection
    title="Reservations &amp; questions"
    :address="siteConfig.contact.address"
    :phone="siteConfig.contact.phone"
    :email="siteConfig.contact.email"
    :map-embed-url="siteConfig.contact.mapEmbedUrl"
  />
  <HoursSection :hours="siteConfig.hours" />
</template>
