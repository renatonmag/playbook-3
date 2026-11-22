<script setup lang="ts">
import { Maximize2, Minimize2 } from '@lucide/vue'
import { Button } from '~/components/ui/button'

const route = useRoute()

// Wide view: images fill the whole content area instead of a centered column.
const wide = useCookie<boolean>('setup-wide-view', { default: () => false })
const setupId = computed(() => Number(route.params.id))

const { data: setup, error: setupError } = await useFetch<{ id: number; title: string }>(
  () => `/api/setups/${setupId.value}`,
)
if (setupError.value) {
  throw createError({ statusCode: setupError.value.statusCode ?? 404, statusMessage: 'Setup not found', fatal: true })
}

useHead({ title: () => setup.value?.title ?? 'Setup' })

const { q, tags, hasFilter, toggleTag, clearFilters, examples, allTags, setupTags } = useSetupExamples(setupId)
const { data: list, pending, error: listError, refresh } = examples
const { data: tagCounts, refresh: refreshAllTags } = allTags
const { data: setupTagCounts, refresh: refreshSetupTags } = setupTags

function refreshTags() {
  refreshAllTags()
  refreshSetupTags()
}

// Freshly created examples open in edit mode.
const editingIds = ref(new Set<number>())
const createErr = ref<string | null>(null)

const { uploading, imageError, dragging } = await useImageUploads({
  prefix: 'setups',
  listImages: false,
  onUploaded: async (uploaded) => {
    createErr.value = null
    for (const image of uploaded) {
      try {
        const example = await $fetch<SetupExample>('/api/setups/examples', {
          method: 'POST',
          body: { setupId: setupId.value, imagePath: image.name },
        })
        editingIds.value.add(example.id)
        list.value = [example, ...list.value]
      } catch (err: any) {
        createErr.value = err?.data?.statusMessage || err?.message || 'Could not create example'
      }
    }
  },
})

function onUpdated(example: SetupExample) {
  list.value = list.value.map((e) => (e.id === example.id ? example : e))
  refreshTags()
}

function onDeleted(id: number) {
  list.value = list.value.filter((e) => e.id !== id)
  refreshTags()
}

// --- Title rename ---
const title = ref(setup.value?.title ?? '')
const titleError = ref<string | null>(null)

async function rename() {
  const next = title.value.trim()
  if (!setup.value || !next || next === setup.value.title) {
    title.value = setup.value?.title ?? ''
    return
  }
  titleError.value = null
  try {
    setup.value = await $fetch(`/api/setups/${setupId.value}`, { method: 'PATCH', body: { title: next } })
    title.value = setup.value!.title
    refresh()
  } catch (err: any) {
    titleError.value = err?.data?.statusMessage || err?.message || 'Rename failed'
    title.value = setup.value.title
  }
}

// Deep link from cross-setup search: /setups/:id?example=:exampleId
onMounted(() => {
  const target = route.query.example
  if (typeof target === 'string') {
    nextTick(() => document.getElementById(`example-${target}`)?.scrollIntoView({ behavior: 'smooth' }))
  }
})
</script>

<template>
  <div>
    <div class="mx-auto space-y-6 px-4 py-8" :class="wide ? 'max-w-none' : 'max-w-6xl'">
      <header class="flex items-center gap-3">
        <NuxtLink to="/setups" class="text-muted-foreground hover:text-foreground">←</NuxtLink>
        <input
          v-model="title"
          aria-label="Setup title"
          maxlength="100"
          class="min-w-0 flex-1 rounded-md bg-transparent px-1 text-2xl font-semibold tracking-tight text-foreground outline-none hover:bg-card focus:bg-card"
          @keydown.enter="($event.target as HTMLInputElement).blur()"
          @keydown.esc="title = setup?.title ?? ''; ($event.target as HTMLInputElement).blur()"
          @blur="rename"
        >
        <Button
          variant="ghost"
          size="icon-sm"
          :title="wide ? 'Center images' : 'Expand images'"
          :aria-label="wide ? 'Center images' : 'Expand images'"
          :aria-pressed="wide"
          @click="wide = !wide"
        >
          <Minimize2 v-if="wide" />
          <Maximize2 v-else />
        </Button>
      </header>
      <p v-if="titleError" class="text-sm text-red-300">{{ titleError }}</p>

      <div class="grid gap-6 md:grid-cols-[242px_minmax(0,1fr)]">
        <!-- Tag sidebar: this setup's tags, stays in view while the examples scroll -->
        <aside class="space-y-2 md:sticky md:top-6 md:max-h-[calc(100vh-3rem)] md:self-start md:overflow-y-auto md:pr-1">
          <h2 class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tags</h2>
          <TagFilter
            v-if="setupTagCounts.length || tags.length"
            vertical
            :limit="Infinity"
            :selected="tags"
            :all-tags="setupTagCounts"
            @toggle="toggleTag"
          />
          <p v-else class="text-xs text-muted-foreground/70">Tags appear here once examples have them.</p>
        </aside>

        <div class="min-w-0 space-y-6" :class="{ 'max-w-3xl': !wide }">
          <SearchBar
            v-model:q="q"
            :tags="tags"
            :all-tags="tagCounts"
            :show-tags="false"
            :placeholder="`Search in ${setup?.title ?? 'this setup'}…`"
            @toggle="toggleTag"
            @clear="clearFilters"
          />

          <p v-if="imageError || createErr" class="rounded-md border border-red-900/60 bg-red-950/40 px-3 py-2 text-sm text-red-300">
            {{ imageError || createErr }}
          </p>
          <p v-if="uploading" class="animate-pulse rounded-md border border-border px-3 py-2 text-sm text-brand">
            Uploading {{ uploading }}…
          </p>
          <p v-if="listError" class="text-sm text-red-300">Could not load examples: {{ listError.statusMessage || listError.message }}</p>

          <p class="text-sm text-muted-foreground">
            <template v-if="pending">Loading…</template>
            <template v-else-if="hasFilter">{{ list.length }} matching example{{ list.length === 1 ? '' : 's' }}</template>
            <template v-else>{{ list.length }} example{{ list.length === 1 ? '' : 's' }} · drop images anywhere to add more</template>
          </p>

          <div v-if="list.length" class="space-y-6">
            <ExampleCard
              v-for="example in list"
              :key="example.id"
              :example="example"
              editable
              :wide="wide"
              :start-editing="editingIds.has(example.id)"
              @updated="onUpdated"
              @deleted="onDeleted"
            />
          </div>
          <p
            v-else-if="!pending && !hasFilter"
            class="rounded-lg border border-dashed border-input px-3 py-16 text-center text-sm text-muted-foreground/70"
          >
            Drop chart images anywhere on the page to add examples
          </p>
        </div>
      </div>
    </div>

    <ImageDropOverlay :visible="dragging" />
  </div>
</template>
