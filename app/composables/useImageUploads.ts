// Image list + page-wide drag-and-drop upload (Supabase Storage via /api/images).
export async function useImageUploads(
  options: {
    onUploaded?: (uploaded: ImageItem[]) => void | Promise<void>
    /** Storage folder for new uploads (must be allowed by /api/images). */
    prefix?: 'setups'
    /** Set to false to skip loading the bucket's image list (upload-only). */
    listImages?: boolean
    /** List every image in the bucket, including sub-folders like setups/ (default: bucket root only). */
    allImages?: boolean
  } = {},
) {
  const listImages = options.listImages ?? true
  // Not awaited yet: lifecycle hooks below must be registered before the first await,
  // or Vue loses the component instance.
  const fetching = listImages
    ? useFetch<ImageItem[]>('/api/images', {
        query: options.allImages ? { all: 1 } : undefined,
        default: () => [],
      })
    : null
  const images = fetching?.data ?? ref<ImageItem[]>([])
  const listError = fetching?.error ?? ref(null)
  const refreshImages = fetching?.refresh ?? (async () => {})
  const uploading = ref(0)
  const uploadError = ref<string | null>(null)
  const dragging = ref(false)
  let dragDepth = 0

  const imageError = computed(
    () => uploadError.value ?? (listError.value ? errorMessage(listError.value) : null),
  )

  function errorMessage(err: any) {
    return err?.data?.statusMessage || err?.statusMessage || err?.message || 'Something went wrong'
  }

  function hasFiles(e: DragEvent) {
    return !!e.dataTransfer && Array.from(e.dataTransfer.types).includes('Files')
  }

  async function uploadFiles(files: File[]) {
    const imagesOnly = files.filter((f) => f.type.startsWith('image/'))
    uploadError.value = imagesOnly.length < files.length ? 'Only image files can be uploaded.' : null
    if (!imagesOnly.length) return

    const body = new FormData()
    if (options.prefix) body.append('prefix', options.prefix)
    for (const file of imagesOnly) body.append('file', file)

    uploading.value += imagesOnly.length
    try {
      const uploaded = await $fetch<ImageItem[]>('/api/images', { method: 'POST', body })
      if (listImages) images.value = [...uploaded, ...images.value]
      await options.onUploaded?.(uploaded)
      await refreshImages()
    } catch (err) {
      uploadError.value = errorMessage(err)
    } finally {
      uploading.value -= imagesOnly.length
    }
  }

  // Capture phase so file drops never reach the browser default or editors like Milkdown/ProseMirror.
  function onDragEnter(e: DragEvent) {
    if (!hasFiles(e)) return
    e.preventDefault()
    dragDepth++
    dragging.value = true
  }
  function onDragOver(e: DragEvent) {
    if (!hasFiles(e)) return
    e.preventDefault()
    e.stopPropagation()
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy'
  }
  function onDragLeave(e: DragEvent) {
    if (!hasFiles(e)) return
    dragDepth = Math.max(0, dragDepth - 1)
    if (dragDepth === 0) dragging.value = false
  }
  function onDrop(e: DragEvent) {
    if (!hasFiles(e)) return
    e.preventDefault()
    e.stopPropagation()
    dragDepth = 0
    dragging.value = false
    uploadFiles(Array.from(e.dataTransfer!.files))
  }

  const dragListeners = [
    ['dragenter', onDragEnter],
    ['dragover', onDragOver],
    ['dragleave', onDragLeave],
    ['drop', onDrop],
  ] as const

  onMounted(() => {
    for (const [type, fn] of dragListeners) window.addEventListener(type, fn, true)
  })
  onBeforeUnmount(() => {
    for (const [type, fn] of dragListeners) window.removeEventListener(type, fn, true)
  })

  if (fetching) await fetching

  return { images, uploading, imageError, dragging, uploadFiles }
}
