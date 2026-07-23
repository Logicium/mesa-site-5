<script setup lang="ts">
/**
 * Bespoke image input — drag-and-drop or click to upload (via the site's
 * media endpoint), live preview, replace/remove chips, paste-URL fallback.
 * v-model holds the image URL string.
 */
import { ref } from 'vue'
import { ImagePlus, Link2 } from 'lucide-vue-next'
import { contentClient } from '../../../platform/contentClient'

const props = withDefaults(defineProps<{
  label?: string
  hint?: string
  /** Site whose media library receives uploads. */
  siteId: string
  /** Preview aspect. Defaults to 16/9; use '1/1' for square product shots. */
  aspect?: string
  /** Allow removing the image entirely. */
  clearable?: boolean
}>(), { aspect: '16 / 9', clearable: true })

const model = defineModel<string>({ default: '' })

const uploading = ref(false)
const error = ref<string | null>(null)
const dragging = ref(false)
const fileEl = ref<HTMLInputElement | null>(null)
const showUrl = ref(false)

function readAsDataUrl(file: Blob): Promise<string> {
  return new Promise((res, rej) => {
    const fr = new FileReader()
    fr.onload = () => res(fr.result as string)
    fr.onerror = rej
    fr.readAsDataURL(file)
  })
}

async function upload(file: File) {
  if (!file.type.startsWith('image/')) { error.value = 'Please choose an image file.'; return }
  uploading.value = true
  error.value = null
  try {
    const dataUrl = await readAsDataUrl(file)
    const r = await contentClient.uploadMedia(props.siteId, file.name, file.type, dataUrl.split(',')[1] ?? '')
    model.value = r.url
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
  } finally {
    uploading.value = false
  }
}

function onPick(evt: Event) {
  const f = (evt.target as HTMLInputElement).files?.[0]
  if (f) void upload(f)
  ;(evt.target as HTMLInputElement).value = ''
}
function onDrop(evt: DragEvent) {
  dragging.value = false
  const f = evt.dataTransfer?.files?.[0]
  if (f) void upload(f)
}
</script>

<template>
  <div class="ai-field">
    <span v-if="label" class="ai-label">{{ label }}</span>
    <div
      class="ai-img"
      :class="{ 'ai-img--empty': !model, 'is-drag': dragging }"
      @click="!model && fileEl?.click()"
      @dragover.prevent="dragging = true"
      @dragleave="dragging = false"
      @drop.prevent="onDrop"
    >
      <template v-if="model">
        <div class="ai-img__preview" :style="{ aspectRatio: aspect }">
          <img :src="model" alt="" loading="lazy" />
        </div>
        <div class="ai-img__actions" @click.stop>
          <button type="button" class="ai-img__chip" @click="fileEl?.click()"><ImagePlus :size="12" /> Replace</button>
          <button type="button" class="ai-img__chip" @click="showUrl = !showUrl"><Link2 :size="12" /> URL</button>
          <button v-if="clearable" type="button" class="ai-img__chip" @click="model = ''">✕ Remove</button>
        </div>
      </template>
      <div v-else class="ai-img__cta">
        <ImagePlus :size="20" />
        <span><strong>Upload a photo</strong> — click or drag &amp; drop</span>
      </div>
      <div v-if="uploading" class="ai-img__busy">Uploading…</div>
    </div>
    <span v-if="model && showUrl" class="ai-control">
      <span class="ai-affix"><Link2 :size="13" /></span>
      <input v-model="model" placeholder="https://…" />
    </span>
    <input ref="fileEl" type="file" accept="image/*" hidden @change="onPick" />
    <span v-if="error" class="ai-hint" style="color: var(--adm-danger)">{{ error }}</span>
    <span v-else-if="hint" class="ai-hint">{{ hint }}</span>
  </div>
</template>
