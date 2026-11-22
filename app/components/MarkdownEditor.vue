<script setup lang="ts">
// Client-only: render this inside a guard (e.g. after onMounted). Crepe is
// imported lazily so it never loads during SSR.
import type { Crepe } from '@milkdown/crepe'
import '@milkdown/crepe/theme/common/style.css'
import '@milkdown/crepe/theme/frame-dark.css'

const model = defineModel<string>({ default: '' })

const container = useTemplateRef<HTMLDivElement>('container')
let crepe: Crepe | null = null
let unmounted = false

onMounted(async () => {
  const { Crepe } = await import('@milkdown/crepe')
  if (unmounted || !container.value) return

  crepe = new Crepe({ root: container.value, defaultValue: model.value })
  crepe.on((listener) => {
    listener.markdownUpdated((_ctx, markdown) => {
      model.value = markdown
    })
  })
  try {
    await crepe.create()
  } catch (err) {
    console.error('[MarkdownEditor] failed to create editor', err)
  }
})

onBeforeUnmount(() => {
  unmounted = true
  crepe?.destroy()
  crepe = null
})
</script>

<template>
  <div ref="container" class="markdown-editor" />
</template>

<style scoped>
.markdown-editor :deep(.milkdown) {
  background: transparent;
  border-radius: 0.75rem;
}
</style>
