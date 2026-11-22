import type { H3Event } from 'h3'
import { and, arrayContains, desc, eq, getTableColumns, ilike, or, sql, type SQL } from 'drizzle-orm'
import { setupExamples, setups } from '../database/schema'

const MAX_TAGS = 30
const MAX_TAG_LENGTH = 100

/** Trim, lowercase, collapse whitespace, drop empties and duplicates. */
export function normalizeTags(input: unknown): string[] {
  const raw = Array.isArray(input) ? input : typeof input === 'string' ? input.split(',') : []
  const tags = raw
    .filter((t): t is string => typeof t === 'string')
    .map((t) => t.trim().toLowerCase().replace(/\s+/g, ' ').slice(0, MAX_TAG_LENGTH))
    .filter(Boolean)
  return [...new Set(tags)].slice(0, MAX_TAGS)
}

/** Each non-empty line of the description is a tag. */
export function tagsFromDescription(description: string): string[] {
  return normalizeTags(description.split(/\r?\n/))
}

export function parseId(event: H3Event, param = 'id') {
  const id = Number(getRouterParam(event, param))
  if (!Number.isInteger(id) || id <= 0) throw createError({ statusCode: 400, statusMessage: `Invalid ${param}` })
  return id
}

export function normalizeTitle(input: unknown) {
  const title = typeof input === 'string' ? input.trim().replace(/\s+/g, ' ') : ''
  if (!title) throw createError({ statusCode: 400, statusMessage: 'Title is required' })
  if (title.length > 100) throw createError({ statusCode: 400, statusMessage: 'Title is too long' })
  return title
}

/** Only keys we created under the setups/ prefix may be referenced. */
export function validateImagePath(input: unknown): string | null {
  if (input == null || input === '') return null
  if (typeof input !== 'string' || !/^setups\/[\w.-]+$/.test(input)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid imagePath' })
  }
  return input
}

export function imageUrl(path: string | null) {
  return path ? useImageBucket().getPublicUrl(path).data.publicUrl : null
}

export async function removeImages(paths: (string | null)[]) {
  const keys = paths.filter((p): p is string => !!p)
  if (!keys.length) return
  const { error } = await useImageBucket().remove(keys)
  // The rows are already gone; a leftover file is not worth failing the request.
  if (error) console.warn('[setups] failed to remove images', keys, error.message)
}

/** Postgres unique_violation, possibly wrapped by drizzle. */
export function isUniqueViolation(err: any) {
  return err?.code === '23505' || err?.cause?.code === '23505'
}

// Everything except the generated tsvector, which the client never needs.
const { search: _search, ...exampleColumns } = getTableColumns(setupExamples)
export { exampleColumns }

type ExampleRow = Omit<typeof setupExamples.$inferSelect, 'search'> & { setupTitle: string }

export function toSetupExample(row: ExampleRow): SetupExample {
  return {
    id: row.id,
    setupId: row.setupId,
    setupTitle: row.setupTitle,
    imagePath: row.imagePath,
    imageUrl: imageUrl(row.imagePath),
    description: row.description,
    tags: row.tags,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

/** Read `?q=&tags=a,b` from the request. */
export function getExampleFilters(event: H3Event) {
  const query = getQuery(event)
  const q = typeof query.q === 'string' ? query.q.trim().slice(0, 200) : ''
  const tags = normalizeTags(query.tags)
  return { q, tags }
}

/**
 * Examples matching a text query (full-text on the description, or a
 * substring of the setup title) and containing all given tags.
 */
export async function findExamples(opts: { setupId?: number; q?: string; tags?: string[]; limit?: number }) {
  const { setupId, q, tags = [], limit = 200 } = opts
  const conditions: SQL[] = []
  const tsquery = sql`websearch_to_tsquery('simple', ${q ?? ''})`

  if (setupId) conditions.push(eq(setupExamples.setupId, setupId))
  if (tags.length) conditions.push(arrayContains(setupExamples.tags, tags))
  if (q) {
    const escaped = q.replace(/[\\%_]/g, '\\$&')
    conditions.push(or(sql`${setupExamples.search} @@ ${tsquery}`, ilike(setups.title, `%${escaped}%`))!)
  }

  const rows = await useDb()
    .select({ ...exampleColumns, setupTitle: setups.title })
    .from(setupExamples)
    .innerJoin(setups, eq(setups.id, setupExamples.setupId))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(
      ...(q ? [desc(sql`ts_rank(${setupExamples.search}, ${tsquery})`)] : []),
      desc(setupExamples.createdAt),
      desc(setupExamples.id),
    )
    .limit(limit)

  return rows.map(toSetupExample)
}
