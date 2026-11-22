import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const id = parseId(event)
  const { setups, setupExamples } = schema
  const images = await useDb()
    .select({ path: setupExamples.imagePath })
    .from(setupExamples)
    .where(eq(setupExamples.setupId, id))
  // Examples are removed by ON DELETE CASCADE.
  const [row] = await useDb().delete(setups).where(eq(setups.id, id)).returning({ id: setups.id })
  if (!row) throw createError({ statusCode: 404, statusMessage: 'Setup not found' })
  await removeImages(images.map((i) => i.path))
  setResponseStatus(event, 204)
  return null
})
