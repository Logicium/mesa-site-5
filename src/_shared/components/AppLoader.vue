<script setup lang="ts">
defineProps<{ brand: string; visible: boolean }>()
</script>

<template>
  <Transition name="loader-fade">
    <div v-if="visible" class="ap-loader" aria-hidden="true">
      <div class="ap-loader__inner">
        <span class="ap-loader__brand">{{ brand }}</span>
        <span class="ap-loader__bar"><span class="ap-loader__fill" /></span>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.ap-loader {
  position: fixed; inset: 0; z-index: 9999;
  background: var(--ap-surface);
  display: flex; align-items: center; justify-content: center;
}
.ap-loader__inner {
  display: flex; flex-direction: column; align-items: center; gap: 1.5rem;
}
.ap-loader__brand {
  font-family: var(--ap-font-head, inherit);
  font-size: clamp(1.5rem, 4vw, 2.5rem);
  font-weight: 700;
  color: var(--ap-ink);
  letter-spacing: -0.02em;
}
.ap-loader__bar {
  width: clamp(120px, 20vw, 200px);
  height: 2px;
  background: var(--ap-line);
  border-radius: 999px;
  overflow: hidden;
}
.ap-loader__fill {
  display: block; height: 100%;
  width: 40%;
  background: var(--ap-brand);
  border-radius: 999px;
  animation: ap-loader-slide 1s ease-in-out infinite alternate;
}
@keyframes ap-loader-slide {
  from { transform: translateX(-100%); }
  to   { transform: translateX(300%); }
}

/* Fade-out transition */
.loader-fade-leave-active { transition: opacity 0.4s ease; }
.loader-fade-leave-to    { opacity: 0; }
</style>
