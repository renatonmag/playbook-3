import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const id = parseId(event)
  const { setupExamples } = schema
  const [row] = await useDb()
    .delete(setupExamples)
    .where(eq(setupExamples.id, id))
    .returning({ imagePath: setupExamples.imagePath })
  if (!row) throw createError({ statusCode: 404, statusMessage: 'Example not found' })
  await removeImages([row.imagePath])
  setResponseStatus(event, 204)
  return null
})
