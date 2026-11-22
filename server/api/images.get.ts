const PAGE_SIZE = 100

type Bucket = ReturnType<typeof useImageBucket>
type StorageFile = { id: string | null; name: string; created_at?: string | null; metadata?: Record<string, any> | null }

/** One page of a folder (Storage `list` is not recursive; sub-folders come back with `id: null`). */
async function listFolder(bucket: Bucket, folder: string, offset = 0) {
  const { data, error } = await bucket.list(folder, {
    limit: PAGE_SIZE,
    offset,
    sortBy: { column: 'created_at', order: 'desc' },
  })
  if (error) throw createError({ statusCode: 502, statusMessage: `Storage list failed: ${error.message}` })
  return data as StorageFile[]
}

/** Every file under `folder`, descending into sub-folders and paging past the 100-item limit. */
async function listAll(bucket: Bucket, folder = ''): Promise<ImageItem[]> {
  const items: ImageItem[] = []
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const page = await listFolder(bucket, folder, offset)
    for (const f of page) {
      const path = folder ? `${folder}/${f.name}` : f.name
      if (!f.id) items.push(...await listAll(bucket, path))
      else if (f.name !== '.emptyFolderPlaceholder') items.push(toImageItem(bucket, { ...f, name: path }))
    }
    if (page.length < PAGE_SIZE) break
  }
  return items
}

// GET /api/images        → latest 100 images in the bucket root
// GET /api/images?all=1  → every image in the bucket, including sub-folders (e.g. setups/), newest first
export default defineEventHandler(async (event) => {
  const bucket = useImageBucket()
  const { all } = getQuery(event)

  if (all === '1' || all === 'true') {
    const items = await listAll(bucket)
    return items.sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))
  }

  const data = await listFolder(bucket, '')
  return data
    .filter((f) => f.id && f.name !== '.emptyFolderPlaceholder')
    .map((f) => toImageItem(bucket, f))
})
