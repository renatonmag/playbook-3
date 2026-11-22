import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const id = parseId(event)
  const body = await readBody<{ title?: unknown }>(event)
  const title = normalizeTitle(body?.title)
  try {
    const [row] = await useDb().update(schema.setups).set({ title }).where(eq(schema.setups.id, id)).returning()
    if (!row) throw createError({ statusCode: 404, statusMessage: 'Setup not found' })
    return { id: row.id, title: row.title }
  } catch (err) {
    if (isUniqueViolation(err)) throw createError({ statusCode: 409, statusMessage: `A setup named "${title}" already exists` })
    throw err
  }
})
