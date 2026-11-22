const MAX_BYTES = 10 * 1024 * 1024
// Optional folder for the uploaded keys; anything else stays in the bucket root.
const ALLOWED_PREFIXES = new Set(['setups'])

function sanitize(filename: string) {
  return filename.normalize('NFKD').replace(/[^\w.-]+/g, '-').replace(/-+/g, '-').slice(-80) || 'image'
}

export default defineEventHandler(async (event) => {
  const form = await readMultipartFormData(event)
  const parts = form?.filter((p) => p.name === 'file' && p.filename)
  const prefix = form?.find((p) => p.name === 'prefix')?.data.toString('utf8').trim() || ''
  if (prefix && !ALLOWED_PREFIXES.has(prefix)) {
    throw createError({ statusCode: 400, statusMessage: `Unknown prefix: ${prefix}` })
  }
  if (!parts?.length) throw createError({ statusCode: 400, statusMessage: 'No files provided' })

  for (const part of parts) {
    if (!part.type?.startsWith('image/')) {
      throw createError({ statusCode: 400, statusMessage: `${part.filename} is not an image` })
    }
    if (part.data.length > MAX_BYTES) {
      throw createError({ statusCode: 413, statusMessage: `${part.filename} is larger than 10 MB` })
    }
  }

  const bucket = useImageBucket()
  const uploaded: ImageItem[] = []
  for (const part of parts) {
    const key = `${prefix ? `${prefix}/` : ''}${Date.now()}-${crypto.randomUUID().slice(0, 8)}-${sanitize(part.filename!)}`
    const { error } = await bucket.upload(key, part.data, { contentType: part.type, upsert: false })
    if (error) throw createError({ statusCode: 502, statusMessage: `Upload failed: ${error.message}` })
    uploaded.push(toImageItem(bucket, {
      name: key,
      created_at: new Date().toISOString(),
      metadata: { size: part.data.length },
    }))
  }
  return uploaded
})
