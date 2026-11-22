<script setup lang="ts">
import { displayName, formatSize } from '~/lib/images'

defineProps<{
  images: ImageItem[]
  uploading: number
  error?: string | null
  /** When true, items emit `select` instead of opening the image in a new tab. */
  selectable?: boolean
  /** Name of the currently selected image (only used when `selectable`). */
  selected?: string | null
}>()

defineEmits<{ select: [image: ImageItem] }>()
</script>

<template>
  <aside class="space-y-3">
    <h2 class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Images</h2>

    <p v-if="error" class="rounded-md border border-red-900/60 bg-red-950/40 px-3 py-2 text-xs text-red-300">
      {{ error }}
    </p>

    <p v-if="uploading" class="rounded-md border border-border px-3 py-2 text-xs text-brand animate-pulse">
      Uploading {{ uploading }}…
    </p>

    <ul v-if="images.length" class="space-y-2 md:max-h-[calc(100vh-10rem)] md:overflow-y-auto pr-1">
      <li v-for="image in images" :key="image.name">
        <component
          :is="selectable ? 'button' : 'a'"
          v-bind="selectable
            ? { type: 'button', 'aria-pressed': image.name === selected }
            : { href: image.url, target: '_blank', rel: 'noopener' }"
          class="flex w-full items-center gap-3 rounded-lg border bg-card/50 p-2 text-left"
          :class="selectable && image.name === selected
            ? 'border-brand bg-brand/10'
            : 'border-border hover:border-muted-foreground/40'"
          @click="selectable && $emit('select', image)"
        >
          <img
            :src="image.url"
            :alt="displayName(image.name)"
            loading="lazy"
            class="size-12 shrink-0 rounded object-cover bg-accent"
          >
          <div class="min-w-0 text-xs">
            <p class="truncate text-foreground" :title="displayName(image.name)">{{ displayName(image.name) }}</p>
            <p class="text-muted-foreground/70">{{ formatSize(image.size) }}</p>
          </div>
        </component>
      </li>
    </ul>

    <p v-else-if="!uploading" class="rounded-lg border border-dashed border-input px-3 py-6 text-center text-xs text-muted-foreground/70">
      Drop images anywhere on the page
    </p>
  </aside>
</template>
