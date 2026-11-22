import { refDebounced } from '@vueuse/core'

function parseTags(value: unknown) {
  const raw = Array.isArray(value) ? value.join(',') : typeof value === 'string' ? value : ''
  return raw.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean)
}

function sameTags(a: string[], b: string[]) {
  return a.length === b.length && a.every((t, i) => t === b[i])
}

/**
 * Examples filtered by a text query and tags, both mirrored in the URL
 * (`?q=…&tags=a,b`). Pass a setup id to search within one setup;
 * omit it to search across all setups.
 */
export function useSetupExamples(setupId?: MaybeRefOrGetter<number>) {
  const route = useRoute()
  const router = useRouter()

  const q = ref(typeof route.query.q === 'string' ? route.query.q : '')
  const tags = ref<string[]>(parseTags(route.query.tags))
  const qDebounced = refDebounced(q, 200)

  const hasFilter = computed(() => !!qDebounced.value.trim() || tags.value.length > 0)

  // Keep the URL in sync so filtered views can be bookmarked.
  watch([qDebounced, tags], ([qv, tv]) => {
    const query = { ...route.query, q: qv.trim() || undefined, tags: tv.length ? tv.join(',') : undefined }
    if (query.q === route.query.q && query.tags === route.query.tags) return
    router.replace({ query })
  })

  // Back/forward: pull the filters from the URL.
  watch(
    () => [route.query.q, route.query.tags] as const,
    ([qv, tv]) => {
      const nextQ = typeof qv === 'string' ? qv : ''
      if (nextQ !== qDebounced.value) q.value = nextQ
      const nextTags = parseTags(tv)
      if (!sameTags(nextTags, tags.value)) tags.value = nextTags
    },
  )

  function toggleTag(tag: string) {
    tags.value = tags.value.includes(tag) ? tags.value.filter((t) => t !== tag) : [...tags.value, tag]
  }

  function clearFilters() {
    q.value = ''
    tags.value = []
  }

  const url = computed(() => {
    const id = toValue(setupId)
    return id ? `/api/setups/${id}/examples` : '/api/setups/examples'
  })

  const examples = useFetch<SetupExample[]>(url, {
    query: computed(() => ({
      q: qDebounced.value.trim() || undefined,
      tags: tags.value.length ? tags.value.join(',') : undefined,
    })),
    default: () => [],
  })

  // All tags: autocomplete and the cross-setup filter.
  const allTags = useFetch<TagCount[]>('/api/setups/tags', { default: () => [], key: 'setup-tags' })

  // Tags used inside this setup (empty when searching across all setups).
  const setupTags = useFetch<TagCount[]>('/api/setups/tags', {
    query: computed(() => ({ setupId: toValue(setupId) })),
    default: () => [],
    immediate: !!toValue(setupId),
  })

  return { q, tags, hasFilter, toggleTag, clearFilters, examples, allTags, setupTags }
}
