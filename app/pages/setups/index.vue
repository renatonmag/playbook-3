<script setup lang="ts">
import { EllipsisVertical, Trash2 } from '@lucide/vue'
import { Button } from '~/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'

useHead({ title: 'Setups' })

const { q, tags, hasFilter, toggleTag, clearFilters, examples, allTags } = useSetupExamples()
const { data: results, pending: searching } = examples
const { data: tagCounts } = allTags

const { data: setups, error: setupsError } = await useFetch<Setup[]>('/api/setups', { default: () => [] })

const newTitle = ref('')
const createErr = ref<string | null>(null)

async function createSetup() {
  const title = newTitle.value.trim()
  if (!title) return
  createErr.value = null
  try {
    const setup = await $fetch<Setup>('/api/setups', { method: 'POST', body: { title } })
    await navigateTo(`/setups/${setup.id}`)
  } catch (err: any) {
    createErr.value = err?.data?.statusMessage || err?.message || 'Could not create setup'
  }
}

const deleteErr = ref<string | null>(null)

async function deleteSetup(setup: Setup) {
  const count = setup.exampleCount
  if (!confirm(`Delete "${setup.title}" and its ${count} example${count === 1 ? '' : 's'}? This cannot be undone.`)) return
  deleteErr.value = null
  try {
    await $fetch(`/api/setups/${setup.id}`, { method: 'DELETE' })
    setups.value = setups.value.filter((s) => s.id !== setup.id)
  } catch (err: any) {
    deleteErr.value = err?.data?.statusMessage || err?.message || 'Could not delete setup'
  }
}
</script>

<template>
  <div>
    <div class="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <header class="flex items-center gap-3">
        <h1 class="text-2xl font-semibold tracking-tight text-foreground">Setups</h1>
      </header>

      <div class="grid gap-6 md:grid-cols-[242px_minmax(0,1fr)]">
        <!-- Tag sidebar: stays in view while the list scrolls -->
        <aside class="space-y-2 md:sticky md:top-6 md:max-h-[calc(100vh-3rem)] md:self-start md:overflow-y-auto md:pr-1">
          <h2 class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tags</h2>
          <TagFilter
            v-if="tagCounts.length"
            vertical
            :limit="Infinity"
            :selected="tags"
            :all-tags="tagCounts"
            @toggle="toggleTag"
          />
          <p v-else class="text-xs text-muted-foreground/70">Tags appear here once examples have them.</p>
        </aside>

        <div class="min-w-0 space-y-6">
          <SearchBar
            v-model:q="q"
            :tags="tags"
            :all-tags="tagCounts"
            :show-tags="false"
            placeholder="Search all examples…"
            @toggle="toggleTag"
            @clear="clearFilters"
          />

          <!-- Search results across all setups -->
          <section v-if="hasFilter" class="space-y-4">
            <p class="text-sm text-muted-foreground">
              {{ searching ? 'Searching…' : `${results.length} example${results.length === 1 ? '' : 's'} found` }}
            </p>
            <div class="mx-auto max-w-3xl space-y-6">
              <ExampleCard
                v-for="example in results"
                :key="example.id"
                :example="example"
                show-setup
              />
            </div>
          </section>

          <!-- Setup buckets -->
          <section v-else class="space-y-4">
            <form class="flex flex-wrap items-center gap-2" @submit.prevent="createSetup">
              <input
                v-model="newTitle"
                type="text"
                placeholder="New setup title…"
                maxlength="100"
                class="w-64 rounded-lg border border-input bg-card/60 px-3 py-1.5 text-sm outline-none placeholder:text-muted-foreground/70 focus:border-brand"
              >
              <button
                type="submit"
                :disabled="!newTitle.trim()"
                class="rounded-lg bg-brand px-3 py-1.5 text-sm font-medium text-brand-foreground hover:bg-brand/90 disabled:opacity-40"
              >
                Add setup
              </button>
              <span v-if="createErr" class="text-sm text-red-300">{{ createErr }}</span>
            </form>

            <p v-if="setupsError" class="text-sm text-red-300">Could not load setups: {{ setupsError.statusMessage || setupsError.message }}</p>
            <p v-if="deleteErr" class="text-sm text-red-300">{{ deleteErr }}</p>

            <ul v-if="setups.length" class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <li v-for="setup in setups" :key="setup.id" class="relative">
                <NuxtLink
                  :to="`/setups/${setup.id}`"
                  class="group block overflow-hidden rounded-xl border border-border bg-card/50 hover:border-brand/60"
                >
                  <div class="aspect-video bg-background">
                    <img
                      v-if="setup.coverUrl"
                      :src="setup.coverUrl"
                      alt=""
                      loading="lazy"
                      class="h-full w-full object-cover opacity-90 group-hover:opacity-100"
                    >
                  </div>
                  <div class="flex items-baseline justify-between gap-2 p-3">
                    <h2 class="truncate font-medium text-foreground">{{ setup.title }}</h2>
                    <span class="shrink-0 text-xs text-muted-foreground/70">
                      {{ setup.exampleCount }} example{{ setup.exampleCount === 1 ? '' : 's' }}
                    </span>
                  </div>
                </NuxtLink>
                <DropdownMenu>
                  <DropdownMenuTrigger as-child>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Setup actions"
                      class="absolute top-2 right-2 bg-background/70 backdrop-blur hover:bg-background/90"
                    >
                      <EllipsisVertical />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem variant="destructive" @select="deleteSetup(setup)">
                      <Trash2 />
                      Delete setup
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </li>
            </ul>
            <p v-else-if="!setupsError" class="rounded-lg border border-dashed border-input px-3 py-10 text-center text-sm text-muted-foreground/70">
              No setups yet. Add one above.
            </p>
          </section>
        </div>
      </div>
    </div>
  </div>
</template>
