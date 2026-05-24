<script setup lang="ts">
import { ref } from 'vue'
import { contentClient } from '../../platform/contentClient'

const props = defineProps<{
  siteId: string
  field: string
  prompt: string
  context?: Record<string, unknown>
  /** Optional accent gradient stops; defaults to admin theme accent vars. */
  ariaLabel?: string
}>()

const emit = defineEmits<{
  (e: 'pick', value: string): void
}>()

const open = ref(false)
const loading = ref(false)
const options = ref<string[]>([])
const error = ref<string | null>(null)

async function run() {
  if (!props.siteId) return
  open.value = true
  loading.value = true
  error.value = null
  options.value = []
  try {
    const r = await contentClient.generateCopy(props.siteId, props.field, props.prompt || props.field, props.context)
    options.value = r.options ?? []
    if (!options.value.length) error.value = 'No suggestions returned.'
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
  } finally {
    loading.value = false
  }
}

function pick(opt: string) {
  emit('pick', opt)
  open.value = false
}

function close() { open.value = false }
</script>

<template>
  <span class="ai-btn-wrap">
    <button
      type="button"
      class="ai-btn"
      :title="ariaLabel || `Generate ${field} with AI`"
      :aria-label="ariaLabel || `Generate ${field} with AI`"
      @click="run"
    >
      <span class="ai-btn__spark">✦</span>
      <span class="ai-btn__label">AI</span>
    </button>
    <div v-if="open" class="ai-pop" @click.self="close">
      <div class="ai-pop__panel">
        <header class="ai-pop__head">
          <strong>AI suggestions · {{ field }}</strong>
          <button type="button" class="ai-pop__close" @click="close">×</button>
        </header>
        <p v-if="loading" class="ai-pop__muted">Generating…</p>
        <p v-if="error" class="ai-pop__err">{{ error }}</p>
        <ul v-if="!loading && options.length" class="ai-pop__list">
          <li v-for="(o, i) in options" :key="i">
            <button type="button" class="ai-pop__opt" @click="pick(o)">{{ o }}</button>
          </li>
        </ul>
        <footer class="ai-pop__foot">
          <button type="button" class="ai-pop__retry" :disabled="loading" @click="run">Regenerate</button>
        </footer>
      </div>
    </div>
  </span>
</template>

<style scoped>
.ai-btn-wrap { position: relative; display: inline-flex; }
.ai-btn {
  display: inline-flex; align-items: center; gap: 0.25rem;
  padding: 0.2rem 0.55rem;
  font-size: 0.7rem; font-weight: 700; letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #fff;
  border: 1px solid transparent;
  border-radius: 999px;
  cursor: pointer;
  background: linear-gradient(
    135deg,
    var(--adm-accent) 0%,
    color-mix(in srgb, var(--adm-accent-deep, var(--adm-accent)) 80%, #6d28d9) 100%
  );
  box-shadow: 0 1px 3px color-mix(in srgb, var(--adm-accent) 35%, transparent);
  transition: transform 120ms ease, box-shadow 120ms ease, filter 120ms ease;
}
.ai-btn:hover { transform: translateY(-1px); filter: brightness(1.08); box-shadow: 0 3px 10px color-mix(in srgb, var(--adm-accent) 45%, transparent); }
.ai-btn:active { transform: translateY(0); }
.ai-btn__spark { font-size: 0.85rem; line-height: 1; }
.ai-btn__label { line-height: 1; }

/* Popover */
.ai-pop {
  position: fixed; inset: 0; z-index: 2000;
  background: color-mix(in srgb, var(--adm-bg, #000) 50%, transparent);
  display: grid; place-items: center;
  padding: 1rem;
}
.ai-pop__panel {
  width: min(560px, 100%);
  max-height: 80vh; overflow: auto;
  background: var(--adm-surface);
  border: 1px solid var(--adm-border);
  border-radius: var(--adm-radius, 10px);
  padding: 1rem 1.1rem;
  box-shadow: var(--adm-shadow-lg, 0 12px 40px rgba(0,0,0,0.4));
  display: flex; flex-direction: column; gap: 0.75rem;
}
.ai-pop__head { display: flex; justify-content: space-between; align-items: center; }
.ai-pop__close {
  background: transparent; border: none; color: var(--adm-text-muted);
  font-size: 1.2rem; cursor: pointer; line-height: 1;
}
.ai-pop__close:hover { color: var(--adm-text); }
.ai-pop__muted { color: var(--adm-text-muted); margin: 0; }
.ai-pop__err { color: var(--adm-danger); margin: 0; }
.ai-pop__list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.5rem; }
.ai-pop__opt {
  width: 100%; text-align: left;
  padding: 0.65rem 0.8rem;
  background: var(--adm-surface-2);
  border: 1px solid var(--adm-border);
  border-radius: var(--adm-radius-sm, 6px);
  color: var(--adm-text);
  cursor: pointer; font: inherit; font-size: 0.88rem;
  line-height: 1.45; white-space: pre-wrap;
  transition: border-color 140ms ease, background 140ms ease;
}
.ai-pop__opt:hover { border-color: var(--adm-accent); background: color-mix(in srgb, var(--adm-accent) 8%, var(--adm-surface-2)); }
.ai-pop__foot { display: flex; justify-content: flex-end; }
.ai-pop__retry {
  padding: 0.35rem 0.75rem;
  background: var(--adm-surface-2);
  border: 1px solid var(--adm-border-strong);
  border-radius: var(--adm-radius-sm, 6px);
  color: var(--adm-text); cursor: pointer; font: inherit; font-size: 0.82rem;
}
.ai-pop__retry:hover { border-color: var(--adm-accent); color: var(--adm-accent); }
</style>
