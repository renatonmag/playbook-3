<script setup lang="ts">
const props = defineProps<{
  example: SetupExample
  /** Show the setup title (cross-setup search results). */
  showSetup?: boolean
  /** Show the edit button. */
  editable?: boolean
  /** Open in edit mode (freshly created examples). */
  startEditing?: boolean
  /** Let the image fill the card at its natural height (no viewport cap). */
  wide?: boolean
}>()

const emit = defineEmits<{
  updated: [example: SetupExample]
  deleted: [id: number]
}>()

const editing = ref(!!props.startEditing)
const description = ref(props.example.description)
const saving = ref(false)
const error = ref<string | null>(null)
const fileInput = useTemplateRef<HTMLInputElement>('fileInput')

function errorMessage(err: any) {
  return err?.data?.statusMessage || err?.statusMessage || err?.message || 'Something went wrong'
}

async function patch(body: Partial<Pick<SetupExample, 'description' | 'imagePath'>>) {
  saving.value = true
  error.value = null
  try {
    const updated = await $fetch<SetupExample>(`/api/setups/examples/${props.example.id}`, { method: 'PATCH', body })
    emit('updated', updated)
  } catch (err) {
    error.value = errorMessage(err)
  } finally {
    saving.value = false
  }
}

// Description autosaves after a pause in typing; the server derives tags from its lines.
let saveTimer: ReturnType<typeof setTimeout> | undefined
watch(description, (value) => {
  clearTimeout(saveTimer)
  saveTimer = setTimeout(() => patch({ description: value }), 600)
})

function flush() {
  if (!saveTimer) return
  clearTimeout(saveTimer)
  saveTimer = undefined
  if (description.value !== props.example.description) patch({ description: description.value })
}

function done() {
  flush()
  editing.value = false
}

onBeforeUnmount(flush)

async function replaceImage(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  const body = new FormData()
  body.append('prefix', 'setups')
  body.append('file', file)
  saving.value = true
  try {
    const [uploaded] = await $fetch<ImageItem[]>('/api/images', { method: 'POST', body })
    if (uploaded) await patch({ imagePath: uploaded.name })
  } catch (err) {
    error.value = errorMessage(err)
  } finally {
    saving.value = false
    if (fileInput.value) fileInput.value.value = ''
  }
}

async function remove() {
  if (!confirm('Delete this example? Its image is deleted too.')) return
  try {
    await $fetch(`/api/setups/examples/${props.example.id}`, { method: 'DELETE' })
    emit('deleted', props.example.id)
  } catch (err) {
    error.value = errorMessage(err)
  }
}
</script>

<template>
  <article
    :id="`example-${example.id}`"
    class="scroll-mt-6 overflow-hidden rounded-xl border bg-card/50"
    :class="editing ? 'border-brand/60' : 'border-border'"
  >
    <a
      v-if="example.imageUrl"
      :href="example.imageUrl"
      target="_blank"
      rel="noopener"
      class="block bg-background"
      title="Open full size"
    >
      <img :src="example.imageUrl" alt="" loading="lazy" class="w-full object-contain" :class="{ 'max-h-[70vh]': !wide }">
    </a>
    <div v-else class="flex h-40 items-center justify-center bg-background text-sm text-muted-foreground/70">No image</div>

    <div class="space-y-3 p-4">
      <div class="flex items-center justify-between gap-3 text-xs text-muted-foreground/70">
        <NuxtLink
          v-if="showSetup"
          :to="{ path: `/setups/${example.setupId}`, query: { example: example.id } }"
          class="font-medium text-brand hover:text-brand/80"
        >
          {{ example.setupTitle }} →
        </NuxtLink>
        <span v-else>{{ new Date(example.createdAt).toLocaleDateString() }}</span>

        <div v-if="editable" class="flex items-center gap-3">
          <span v-if="saving" class="animate-pulse text-brand">Saving…</span>
          <template v-if="editing">
            <button type="button" class="hover:text-foreground" @click="fileInput?.click()">Replace image</button>
            <button type="button" class="text-red-400 hover:text-red-300" @click="remove">Delete</button>
            <button type="button" class="font-medium text-brand hover:text-brand/80" @click="done">Done</button>
          </template>
          <button v-else type="button" class="hover:text-foreground" @click="editing = true">Edit</button>
        </div>
      </div>

      <p v-if="error" class="rounded-md border border-red-900/60 bg-red-950/40 px-3 py-2 text-xs text-red-300">
        {{ error }}
      </p>

      <template v-if="editing">
        <textarea
          v-model="description"
          rows="5"
          aria-label="Description"
          placeholder="One tag per line: context, entry, stop, what to look for…"
          class="block min-h-28 w-full resize-y rounded-lg border border-input bg-background/60 px-3 py-2 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground/70 outline-none [field-sizing:content] focus:border-brand"
        />
        <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="replaceImage">
      </template>

      <template v-else>
        <p v-if="example.description.trim()" class="whitespace-pre-wrap break-words text-sm font-bold leading-relaxed text-white">{{ example.description }}</p>
        <p v-else class="text-sm italic text-muted-foreground/70">No description yet.</p>
      </template>
    </div>
  </article>
</template>
