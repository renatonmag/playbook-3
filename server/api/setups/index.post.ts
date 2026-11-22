export default defineEventHandler(async (event): Promise<Setup> => {
  const body = await readBody<{ title?: unknown }>(event)
  const title = normalizeTitle(body?.title)
  try {
    const [row] = await useDb().insert(schema.setups).values({ title }).returning()
    setResponseStatus(event, 201)
    return { id: row!.id, title: row!.title, exampleCount: 0, coverUrl: null }
  } catch (err) {
    if (isUniqueViolation(err)) throw createError({ statusCode: 409, statusMessage: `A setup named "${title}" already exists` })
    throw err
  }
})
