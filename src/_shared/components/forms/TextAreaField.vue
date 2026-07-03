<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  // Accept undefined so call sites can bind optional fields directly without
  // forcing every parent to coalesce. The template guards with `?? ''`.
  modelValue: string | undefined
  rows?: number
  maxlength?: number
  placeholder?: string
  disabled?: boolean
}>(), {
  rows: 3,
  maxlength: 0,
  placeholder: '',
  disabled: false,
})

const emit = defineEmits<{ (e: 'update:modelValue', v: string): void }>()

const length = computed(() => (props.modelValue ?? '').length)
const showCounter = computed(() => props.maxlength > 0)
const isOver = computed(() => props.maxlength > 0 && length.value > props.maxlength)
</script>

<template>
  <div class="ta-field" :class="{ 'ta-field--over': isOver }">
    <textarea
      :value="modelValue"
      :rows="rows"
      :placeholder="placeholder"
      :disabled="disabled"
      :maxlength="maxlength > 0 ? maxlength : undefined"
      class="ta-field__input"
      @input="emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
    />
    <span v-if="showCounter" class="ta-field__counter" aria-hidden="true">
      {{ length }}/{{ maxlength }}
    </span>
  </div>
</template>

<style scoped>
.ta-field {
  position: relative;
  width: 100%;
  display: block;
}
.ta-field__input {
  display: block;
  width: 100%;
  margin: 0;
  padding: 0.55rem 0.75rem 1.4rem;
  background: var(--adm-surface-2);
  color: var(--adm-text);
  border: 1px solid var(--adm-border);
  border-radius: var(--adm-radius-sm, 6px);
  font: inherit;
  font-size: 0.9rem;
  line-height: 1.5;
  /* Preserve user-entered line breaks visually so paragraphs aren't squished. */
  white-space: pre-wrap;
  resize: vertical;
  box-sizing: border-box;
  transition: border-color 140ms ease, box-shadow 140ms ease;
}
.ta-field__input:focus {
  outline: none;
  border-color: var(--adm-accent);
  box-shadow: 0 0 0 3px var(--adm-accent-glow);
}
.ta-field__counter {
  position: absolute;
  right: 0.55rem;
  bottom: 0.35rem;
  padding: 0.05rem 0.4rem;
  font-size: 0.68rem;
  font-variant-numeric: tabular-nums;
  color: var(--adm-text-muted);
  background: color-mix(in srgb, var(--adm-surface) 75%, transparent);
  border-radius: 999px;
  pointer-events: none;
}
.ta-field--over .ta-field__counter {
  color: var(--adm-danger);
}
</style>
