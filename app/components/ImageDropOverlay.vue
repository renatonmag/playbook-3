<script setup lang="ts">
defineProps<{ visible: boolean }>()
</script>

<template>
  <div
    v-if="visible"
    class="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-background/70 p-6"
  >
    <div class="rounded-2xl border-2 border-dashed border-brand px-10 py-8 text-lg text-brand">
      Drop images to upload
    </div>
  </div>
</template>
