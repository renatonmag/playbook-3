<script setup lang="ts">
useHead({ title: 'Markdown' })

const STORAGE_KEY = 'playbook:markdown-draft'

const content = ref('')
const ready = ref(false)
const saved = ref(true)
// Bumped on "Clear" to remount the editor with empty content.
const editorKey = ref(0)

onMounted(() => {
  try {
    content.value = localStorage.getItem(STORAGE_KEY) ?? ''
  } catch {}
  ready.value = true
})

let saveTimer: ReturnType<typeof setTimeout> | undefined
watch(content, (value) => {
  if (!ready.value) return
  saved.value = false
  clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    try {
      localStorage.setItem(STORAGE_KEY, value)
    } catch {}
    saved.value = true
  }, 500)
})

onBeforeUnmount(() => clearTimeout(saveTimer))

// --- Image uploads (Supabase Storage via /api/images) ---

const { images, uploading, imageError, dragging } = await useImageUploads()

function clearDraft() {
  if (!confirm('Clear the current draft?')) return
  clearTimeout(saveTimer)
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {}
  content.value = ''
  saved.value = true
  editorKey.value++
}
</script>

<template>
  <div>
    <div class="mx-auto max-w-6xl px-4 py-8 space-y-4">
      <header class="flex items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <h1 class="text-2xl font-semibold tracking-tight text-foreground">Markdown</h1>
        </div>
        <div class="flex items-center gap-3 text-sm">
          <span class="text-muted-foreground/70">{{ saved ? 'Saved' : 'Saving…' }}</span>
          <button
            type="button"
            class="rounded-md border border-input px-3 py-1 text-muted-foreground hover:bg-accent"
            @click="clearDraft"
          >
            Clear
          </button>
        </div>
      </header>

      <div class="grid gap-6 md:grid-cols-[16rem_minmax(0,1fr)]">
        <ImageList :images="images" :uploading="uploading" :error="imageError" />

        <div class="rounded-xl border border-border bg-card/50 min-h-[60vh]">
          <MarkdownEditor v-if="ready" :key="editorKey" v-model="content" />
          <p v-else class="p-6 text-muted-foreground/70">Loading editor…</p>
        </div>
      </div>
    </div>

    <ImageDropOverlay :visible="dragging" />
  </div>
</template>
