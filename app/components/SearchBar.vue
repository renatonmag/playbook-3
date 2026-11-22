<script setup lang="ts">
const q = defineModel<string>('q', { required: true })
withDefaults(
  defineProps<{
    tags: string[]
    allTags: TagCount[]
    placeholder?: string
    /** Set to false when the page shows the tag filter elsewhere (e.g. a sidebar). */
    showTags?: boolean
  }>(),
  { showTags: true },
)
defineEmits<{ toggle: [tag: string]; clear: [] }>()

const input = useTemplateRef<HTMLInputElement>('input')

// "/" focuses the search box unless the user is already typing somewhere.
function onKeydown(e: KeyboardEvent) {
  if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return
  const target = e.target as HTMLElement | null
  if (target?.closest('input, textarea, select, [contenteditable="true"]')) return
  e.preventDefault()
  input.value?.focus()
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <div class="space-y-2">
    <div class="relative">
      <input
        ref="input"
        v-model="q"
        type="search"
        :placeholder="placeholder ?? 'Search examples…'"
        class="w-full rounded-lg border border-input bg-card/60 px-3 py-2 pr-16 text-sm text-foreground placeholder:text-muted-foreground/70 outline-none focus:border-brand"
        @keydown.esc="q = ''"
      >
      <kbd
        class="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded border border-input px-1.5 text-xs text-muted-foreground/70"
      >/</kbd>
    </div>
    <div
      v-if="showTags || q || tags.length"
      class="flex items-start gap-3"
      :class="showTags ? 'justify-between' : 'justify-end'"
    >
      <TagFilter v-if="showTags" :selected="tags" :all-tags="allTags" @toggle="$emit('toggle', $event)" />
      <button
        v-if="q || tags.length"
        type="button"
        class="shrink-0 text-xs text-muted-foreground hover:text-foreground"
        @click="$emit('clear')"
      >
        Clear filters
      </button>
    </div>
  </div>
</template>
