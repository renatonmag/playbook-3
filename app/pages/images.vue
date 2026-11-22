<script setup lang="ts">
import { displayName, formatSize } from '~/lib/images'

useHead({ title: 'Image gallery' })

const { images, uploading, imageError, dragging } = await useImageUploads({ allImages: true })
</script>

<template>
  <div class="mx-auto max-w-6xl space-y-6 px-4 py-8">
    <header class="flex items-baseline gap-3">
      <h1 class="text-2xl font-semibold tracking-tight text-foreground">Image gallery</h1>
      <span class="text-sm text-muted-foreground/70">{{ images.length }} images</span>
    </header>

    <p v-if="imageError" class="rounded-md border border-red-900/60 bg-red-950/40 px-3 py-2 text-sm text-red-300">
      {{ imageError }}
    </p>

    <p v-if="uploading" class="rounded-md border border-border px-3 py-2 text-sm text-brand animate-pulse">
      Uploading {{ uploading }}…
    </p>

    <ul v-if="images.length" class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      <li v-for="image in images" :key="image.name">
        <a
          :href="image.url"
          target="_blank"
          rel="noopener"
          class="group block overflow-hidden rounded-xl border border-border bg-card hover:border-muted-foreground/40"
        >
          <img
            :src="image.url"
            :alt="displayName(image.name)"
            loading="lazy"
            class="aspect-square w-full bg-accent object-cover transition-opacity group-hover:opacity-90"
          >
          <div class="px-3 py-2 text-xs">
            <p class="truncate text-foreground" :title="displayName(image.name)">{{ displayName(image.name) }}</p>
            <p class="text-muted-foreground/70">{{ formatSize(image.size) }}</p>
          </div>
        </a>
      </li>
    </ul>

    <p
      v-else-if="!uploading"
      class="rounded-xl border border-dashed border-input px-3 py-16 text-center text-sm text-muted-foreground/70"
    >
      Drop images anywhere on the page
    </p>

    <ImageDropOverlay :visible="dragging" />
  </div>
</template>
