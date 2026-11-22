<script setup lang="ts">
import { Badge } from '~/components/ui/badge'

const props = withDefaults(
  defineProps<{
    /** Selected tags. */
    selected: string[]
    allTags: TagCount[]
    /** Max number of tags shown (selected tags are always shown). */
    limit?: number
    /** From md up, list tags one per row (sidebar). Below md they wrap. */
    vertical?: boolean
  }>(),
  { limit: 15, vertical: false },
)

defineEmits<{ toggle: [tag: string] }>()

// Selected tags stay visible even when they're not among the most used.
const shown = computed(() => {
  const top = props.allTags.slice(0, props.limit)
  const missing = props.selected
    .filter((t) => !top.some((c) => c.tag === t))
    .map((tag) => props.allTags.find((c) => c.tag === tag) ?? { tag, count: 0 })
  return [...missing, ...top]
})
</script>

<template>
  <div v-if="shown.length" class="flex flex-wrap gap-1.5" :class="vertical && 'md:flex-col md:flex-nowrap md:gap-1'">
    <Badge
      v-for="t in shown"
      :key="t.tag"
      as="button"
      type="button"
      :variant="selected.includes(t.tag) ? 'default' : 'outline'"
      :aria-pressed="selected.includes(t.tag)"
      class="cursor-pointer"
      :class="vertical && 'md:h-7 md:w-full md:justify-between md:px-2.5'"
      @click="$emit('toggle', t.tag)"
    >
      <span class="truncate">{{ t.tag }}</span>
      <span v-if="t.count" class="opacity-60">{{ t.count }}</span>
    </Badge>
  </div>
</template>
