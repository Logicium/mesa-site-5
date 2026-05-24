<script setup lang="ts">
import OptimizedImage from '../OptimizedImage.vue'

defineProps<{
  eyebrow?: string
  title: string
  paragraphs: string[]
  image?: string
  imageAlt?: string
  /** Reverse the order: image left vs right. */
  reverse?: boolean
  facts?: Array<{ label: string; value: string }>
}>()
</script>

<template>
  <section class="ap-section ap-about" :class="{ 'is-reverse': reverse }">
    <div class="ap-container ap-about__grid">
      <div v-if="image" class="ap-about__media">
        <OptimizedImage v-if="image" :src="image" :alt="imageAlt || title" />
      </div>
      <div class="ap-about__body">
        <div class="ap-section-head">
          <span v-if="eyebrow" class="ap-eyebrow">{{ eyebrow }}</span>
          <h2>{{ title }}</h2>
        </div>
        <p v-for="(p, i) in paragraphs" :key="i">{{ p }}</p>
        <dl v-if="facts?.length" class="ap-about__facts">
          <div v-for="f in facts" :key="f.label">
            <dt>{{ f.label }}</dt>
            <dd>{{ f.value }}</dd>
          </div>
        </dl>
      </div>
    </div>
  </section>
</template>

<style scoped>
.ap-about__grid {
  display: grid; gap: clamp(2rem, 4vw, 4rem);
  grid-template-columns: 5fr 6fr; align-items: center;
}
.is-reverse .ap-about__grid { grid-template-columns: 6fr 5fr; direction: rtl; }
.is-reverse .ap-about__body { direction: ltr; }
.is-reverse .ap-about__media { direction: ltr; }
.ap-about__media img {
  width: 100%; aspect-ratio: 4 / 5; object-fit: cover;
  border-radius: var(--ap-radius-lg);
}
.ap-about__facts {
  margin-top: 1.5rem; display: grid; gap: 0.75rem 2rem;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  border-top: 1px solid var(--ap-line); padding-top: 1.25rem;
}
.ap-about__facts dt {
  font-size: 0.75rem; letter-spacing: 0.16em;
  text-transform: uppercase; color: var(--ap-ink-muted);
}
.ap-about__facts dd { margin: 0.2rem 0 0; font-family: var(--ap-font-heading); font-size: 1.1rem; }
@media (max-width: 820px) {
  .ap-about__grid, .is-reverse .ap-about__grid { grid-template-columns: 1fr; direction: ltr; }
}
</style>
