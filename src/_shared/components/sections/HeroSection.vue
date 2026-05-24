<script setup lang="ts">
import OptimizedImage from '../OptimizedImage.vue'

defineProps<{
  eyebrow?: string
  title: string
  subtitle?: string
  image: string
  imageAlt?: string
  ctaPrimary?: { label: string; to: string }
  ctaSecondary?: { label: string; to: string }
  /** Layout variant: 'split' shows image beside text, 'stage' is full-bleed image. */
  layout?: 'split' | 'stage'
  /** When true, this is a subpage hero header — uses data-subhero-style for layout selection. */
  subpage?: boolean
}>()
</script>

<!--
  HeroSection serves both the home hero (per-theme + data-hero-style)
  and subpage page-tops (when `subpage` is true) which respond to
  data-subhero-style on <html>:
    Style 1 · Compact     — short hairline-bordered head with eyebrow + title
    Style 2 · Banner      — full-bleed image with gradient overlay + bottom-aligned title
    Style 3 · Centered    — symmetrical centered title with rule, no image
    Style 4 · Broadsheet  — editorial newspaper masthead with rules, meta, oversized serif title
    Style 5 · Split       — title left / image right, simpler than home hero
-->
<template>
  <!-- ── Subpage hero variants (data-subhero-style on <html>) ── -->
  <section v-if="subpage" class="ap-subhero" :class="`ap-subhero--style-${'auto'}`">
    <!-- Style 1 · Compact -->
    <div class="ap-subhero__compact">
      <div class="ap-container">
        <p v-if="eyebrow" class="ap-eyebrow">{{ eyebrow }}</p>
        <h1 class="ap-subhero__title">{{ title }}</h1>
        <p v-if="subtitle" class="ap-subhero__subtitle">{{ subtitle }}</p>
        <div v-if="ctaPrimary || ctaSecondary" class="ap-subhero__ctas">
          <router-link v-if="ctaPrimary" :to="ctaPrimary.to" class="ap-btn">{{ ctaPrimary.label }}</router-link>
          <router-link v-if="ctaSecondary" :to="ctaSecondary.to" class="ap-btn ap-btn--ghost">{{ ctaSecondary.label }}</router-link>
        </div>
      </div>
    </div>
    <!-- Style 2 · Banner -->
    <div class="ap-subhero__banner">
      <div class="ap-subhero__banner-media" aria-hidden="true">
        <OptimizedImage :src="image" :alt="imageAlt || title" loading="eager" />
      </div>
      <div class="ap-subhero__banner-shade" aria-hidden="true" />
      <div class="ap-container ap-subhero__banner-content">
        <p v-if="eyebrow" class="ap-eyebrow">{{ eyebrow }}</p>
        <h1 class="ap-subhero__title ap-subhero__title--banner">{{ title }}</h1>
        <p v-if="subtitle" class="ap-subhero__subtitle ap-subhero__subtitle--banner">{{ subtitle }}</p>
        <div v-if="ctaPrimary || ctaSecondary" class="ap-subhero__ctas">
          <router-link v-if="ctaPrimary" :to="ctaPrimary.to" class="ap-btn">{{ ctaPrimary.label }}</router-link>
          <router-link v-if="ctaSecondary" :to="ctaSecondary.to" class="ap-btn ap-btn--ghost">{{ ctaSecondary.label }}</router-link>
        </div>
      </div>
    </div>
    <!-- Style 3 · Centered -->
    <div class="ap-subhero__centered">
      <div class="ap-container">
        <p v-if="eyebrow" class="ap-eyebrow">{{ eyebrow }}</p>
        <h1 class="ap-subhero__title ap-subhero__title--centered">{{ title }}</h1>
        <p v-if="subtitle" class="ap-subhero__subtitle ap-subhero__subtitle--centered">{{ subtitle }}</p>
        <div v-if="ctaPrimary || ctaSecondary" class="ap-subhero__ctas ap-subhero__ctas--centered">
          <router-link v-if="ctaPrimary" :to="ctaPrimary.to" class="ap-btn">{{ ctaPrimary.label }}</router-link>
          <router-link v-if="ctaSecondary" :to="ctaSecondary.to" class="ap-btn ap-btn--ghost">{{ ctaSecondary.label }}</router-link>
        </div>
      </div>
    </div>
    <!-- Style 4 · Broadsheet — mirrors home hero style 3 (poster statement) -->
    <div class="ap-subhero__broadsheet">
      <div class="ap-container">
        <p v-if="eyebrow" class="ap-eyebrow ap-subhero__broadsheet-eyebrow">{{ eyebrow }}</p>
        <h1 class="ap-subhero__title ap-subhero__title--broadsheet">{{ title }}</h1>
        <p v-if="subtitle" class="ap-subhero__subtitle ap-subhero__subtitle--broadsheet">{{ subtitle }}</p>
      </div>
    </div>
    <!-- Style 5 · Split -->
    <div class="ap-subhero__split">
      <div class="ap-container ap-subhero__split-grid">
        <div class="ap-subhero__split-text">
          <p v-if="eyebrow" class="ap-eyebrow">{{ eyebrow }}</p>
          <h1 class="ap-subhero__title ap-subhero__title--split">{{ title }}</h1>
          <p v-if="subtitle" class="ap-subhero__subtitle">{{ subtitle }}</p>
          <div v-if="ctaPrimary || ctaSecondary" class="ap-subhero__ctas">
            <router-link v-if="ctaPrimary" :to="ctaPrimary.to" class="ap-btn">{{ ctaPrimary.label }}</router-link>
            <router-link v-if="ctaSecondary" :to="ctaSecondary.to" class="ap-btn ap-btn--ghost">{{ ctaSecondary.label }}</router-link>
          </div>
        </div>
        <div class="ap-subhero__split-media" aria-hidden="true">
          <OptimizedImage :src="image" :alt="imageAlt || title" loading="eager" />
        </div>
      </div>
    </div>
  </section>

  <!-- ── Default home hero (existing behavior) ── -->
  <section v-else class="ap-hero" :class="`ap-hero--${layout || 'split'}`">
    <div class="ap-hero__deco" aria-hidden="true"></div>
    <div class="ap-container ap-hero__inner">
      <div class="ap-hero__content">
        <p v-if="eyebrow" class="ap-eyebrow ap-hero__eyebrow">{{ eyebrow }}</p>
        <h1 class="ap-hero__title">{{ title }}</h1>
        <p v-if="subtitle" class="ap-hero__subtitle">{{ subtitle }}</p>
        <div v-if="ctaPrimary || ctaSecondary" class="ap-hero__ctas">
          <router-link v-if="ctaPrimary" :to="ctaPrimary.to" class="ap-btn">{{ ctaPrimary.label }}</router-link>
          <router-link v-if="ctaSecondary" :to="ctaSecondary.to" class="ap-btn ap-btn--ghost">{{ ctaSecondary.label }}</router-link>
        </div>
      </div>
      <div class="ap-hero__media">
        <OptimizedImage :src="image" :alt="imageAlt || title" loading="eager" />
      </div>
    </div>
  </section>
</template>

<!--
  All visual treatment for the home hero lives in src/styles/themes.css so it
  can vary structurally per data-theme. Subpage hero visuals live below in
  this scoped style block, gated by data-subhero-style on <html>.
-->
<style scoped>
.ap-hero { position: relative; }
.ap-hero__inner {
  display: grid; gap: clamp(2rem, 4vw, 4rem);
  align-items: center;
}
.ap-hero__content { display: flex; flex-direction: column; gap: 1rem; }
.ap-hero__subtitle {
  font-size: clamp(1.05rem, 1.4vw, 1.25rem);
  color: var(--ap-ink-muted); max-width: 52ch;
}
.ap-hero__ctas { display: flex; gap: 0.75rem; flex-wrap: wrap; margin-top: 0.75rem; }
.ap-hero__media img {
  display: block; width: 100%; height: auto; object-fit: cover;
  aspect-ratio: 4 / 3; /* space reservation before image loads; overridden by themes.css */
}
@media (max-width: 820px) {
  .ap-hero__inner { grid-template-columns: 1fr !important; }
  .ap-hero__media { order: -1; }
}

/* ── Subpage hero variant gating ────────────────────── */
.ap-subhero__compact,
.ap-subhero__banner,
.ap-subhero__centered,
.ap-subhero__broadsheet,
.ap-subhero__split { display: none; }
[data-subhero-style='1'] .ap-subhero__compact     { display: block; }
[data-subhero-style='2'] .ap-subhero__banner      { display: flex; align-items: flex-end; }
[data-subhero-style='3'] .ap-subhero__centered    { display: block; }
[data-subhero-style='4'] .ap-subhero__broadsheet  { display: block; }
[data-subhero-style='5'] .ap-subhero__split       { display: block; }
:root:not([data-subhero-style]) .ap-subhero__compact { display: block; }

.ap-subhero__title {
  font-family: var(--ap-font-heading);
  letter-spacing: var(--ap-tracking-heading);
  text-transform: var(--ap-heading-transform);
  margin: 0.5rem 0;
}
.ap-subhero__subtitle {
  color: var(--ap-ink-muted);
  max-width: 52ch;
  margin: 0.5rem 0 0;
  font-size: clamp(1rem, 1.3vw, 1.15rem);
}
.ap-subhero__ctas { display: flex; gap: 0.75rem; flex-wrap: wrap; margin-top: 1.25rem; }

/* Style 1 · Compact */
.ap-subhero__compact {
  padding: clamp(2.5rem, 6vw, 5rem) 0 clamp(1.5rem, 3vw, 2.5rem);
  border-bottom: 1px solid var(--ap-line);
}
.ap-subhero__compact .ap-subhero__title {
  font-size: clamp(2rem, 5vw, 3.5rem);
  line-height: 1.05;
}

/* Style 2 · Banner */
.ap-subhero__banner {
  position: relative;
  min-height: clamp(320px, 52vh, 520px);
  overflow: hidden;
  isolation: isolate;
}
.ap-subhero__banner-media { position: absolute; inset: 0; z-index: 0; }
.ap-subhero__banner-media :deep(img),
.ap-subhero__banner-media img { width: 100%; height: 100%; object-fit: cover; aspect-ratio: auto; }
.ap-subhero__banner-shade {
  position: absolute; inset: 0; z-index: 1; pointer-events: none;
  background: linear-gradient(180deg,
    color-mix(in srgb, var(--ap-ink) 30%, transparent) 0%,
    color-mix(in srgb, var(--ap-ink) 5%, transparent) 40%,
    color-mix(in srgb, var(--ap-ink) 70%, transparent) 100%);
}
.ap-subhero__banner-content {
  position: relative; z-index: 2;
  padding: clamp(2rem, 5vw, 4rem) 0;
  width: 100%;
}
.ap-subhero__banner-content .ap-eyebrow { color: color-mix(in srgb, var(--ap-surface) 80%, transparent); }
.ap-subhero__title--banner {
  color: var(--ap-surface);
  font-size: clamp(2.5rem, 6vw, 4.5rem);
  line-height: 1; letter-spacing: -0.02em;
}
.ap-subhero__subtitle--banner { color: color-mix(in srgb, var(--ap-surface) 85%, transparent); }

/* Style 3 · Centered */
.ap-subhero__centered {
  padding: clamp(3rem, 7vw, 6rem) 0 clamp(2rem, 4vw, 3rem);
  text-align: center;
  position: relative;
}
.ap-subhero__centered .ap-container { text-align: center; }
.ap-subhero__centered .ap-eyebrow { display: block; }
.ap-subhero__centered::after {
  content: ''; display: block;
  width: 60px; height: 2px;
  background: var(--ap-primary);
  margin: clamp(1.25rem, 2.5vw, 2rem) auto 0;
}
.ap-subhero__title--centered {
  font-size: clamp(2.25rem, 5.5vw, 4rem);
  line-height: 1.05; max-width: 18ch; margin: 0.5rem auto;
}
.ap-subhero__subtitle--centered { margin: 0.75rem auto 0; max-width: 52ch; }
.ap-subhero__ctas--centered { justify-content: center; }

/* Style 4 · Broadsheet — poster statement that mirrors home hero Style 3.
   Per-theme tone is delegated to each theme's overrides below. Default tone
   is a quiet editorial block: small mono eyebrow, oversized serif title with
   single ink underline, restrained subtitle. No drop caps, no double rules. */
.ap-subhero__broadsheet {
  padding: calc(var(--ap-header-h, 72px) + clamp(2rem, 5vw, 3.5rem)) 0 clamp(2rem, 4vw, 3rem);
  background: var(--ap-surface);
}
.ap-subhero__broadsheet-eyebrow {
  display: inline-block;
  margin-bottom: clamp(1rem, 2vw, 1.5rem);
}
.ap-subhero__title--broadsheet {
  font-family: var(--ap-font-heading);
  font-size: clamp(2.5rem, 8vw, 6rem);
  line-height: 0.92; letter-spacing: -0.03em;
  text-align: left;
  margin: 0;
  padding-bottom: clamp(0.75rem, 1.5vw, 1rem);
  border-bottom: 1px solid var(--ap-ink);
  font-weight: var(--ap-heading-weight, 700);
  color: var(--ap-ink);
}
.ap-subhero__subtitle--broadsheet {
  margin: clamp(1rem, 2vw, 1.5rem) 0 0;
  font-size: 1.05rem; line-height: 1.65;
  color: var(--ap-ink-muted);
  max-width: 64ch;
}
@media (max-width: 760px) {
  .ap-subhero__title--broadsheet { font-size: clamp(2rem, 9vw, 3.25rem); }
}

/* Vibrant theme: poster statement mirroring the home hero broadsheet exactly.
   Accent background, oversized ink title with heavy ink underline rule,
   inverted ink-on-accent eyebrow chip. No double rules, no decorations. */
[data-theme='vibrant'] .ap-subhero__broadsheet {
  background: var(--ap-accent);
  padding: calc(var(--ap-header-h, 72px) + clamp(2.5rem, 5vw, 4rem)) 0 clamp(2.5rem, 5vw, 4rem);
}
[data-theme='vibrant'] .ap-subhero__broadsheet-eyebrow {
  background: var(--ap-ink); color: var(--ap-accent);
  padding: 0.3rem 0.7rem;
  font-weight: 700;
  width: fit-content;
}
[data-theme='vibrant'] .ap-subhero__title--broadsheet {
  font-size: clamp(3rem, 10vw, 7rem);
  line-height: 0.88;
  letter-spacing: -0.035em;
  color: var(--ap-ink);
  border-bottom: 3px solid var(--ap-ink);
  padding-bottom: 1rem;
  font-weight: var(--ap-heading-weight, 800);
  word-break: break-word;
}
[data-theme='vibrant'] .ap-subhero__subtitle--broadsheet {
  color: var(--ap-ink);
  font-size: 1.1rem;
  max-width: 60ch;
  margin-top: clamp(1rem, 2vw, 1.5rem);
}

/* Heritage theme: literary centerpiece, centered serif with light rules. */
[data-theme='heritage'] .ap-subhero__broadsheet { text-align: center; }
[data-theme='heritage'] .ap-subhero__broadsheet .ap-container > * { margin-left: auto; margin-right: auto; }
[data-theme='heritage'] .ap-subhero__title--broadsheet {
  font-weight: 300;
  border-top: 1px solid var(--ap-line);
  border-bottom: 1px solid var(--ap-line);
  padding: clamp(1rem, 2vw, 1.5rem) 0;
  max-width: 18ch;
  text-align: center;
}
[data-theme='heritage'] .ap-subhero__subtitle--broadsheet {
  font-style: italic;
  max-width: 50ch;
  text-align: center;
}

/* Style 5 · Split */
.ap-subhero__split {
  padding: clamp(2rem, 5vw, 4rem) 0;
}
.ap-subhero__split-grid {
  display: grid; grid-template-columns: 1fr 1fr;
  gap: clamp(2rem, 4vw, 4rem);
  align-items: center;
}
.ap-subhero__split-text { display: flex; flex-direction: column; gap: 0.75rem; }
.ap-subhero__title--split {
  font-size: clamp(2.25rem, 5vw, 3.75rem);
  line-height: 1.05;
}
.ap-subhero__split-media {
  position: relative;
  border-radius: var(--ap-radius-lg);
  overflow: hidden;
  border: 1px solid var(--ap-line);
}
.ap-subhero__split-media :deep(img),
.ap-subhero__split-media img {
  width: 100%; height: 100%;
  aspect-ratio: 4 / 3;
  object-fit: cover;
  display: block;
}
@media (max-width: 820px) {
  .ap-subhero__split-grid { grid-template-columns: 1fr; }
  .ap-subhero__split-media { order: -1; }
}
</style>
