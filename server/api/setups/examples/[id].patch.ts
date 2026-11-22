import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event): Promise<SetupExample> => {
  const id = parseId(event)
  const body = await readBody<{ imagePath?: unknown; description?: unknown }>(event)
  const { setupExamples } = schema

  const existing = await useDb().query.setupExamples.findFirst({
    where: eq(setupExamples.id, id),
    columns: { imagePath: true },
    with: { setup: { columns: { title: true } } },
  })
  if (!existing) throw createError({ statusCode: 404, statusMessage: 'Example not found' })

  const changes: Partial<typeof setupExamples.$inferInsert> = { updatedAt: new Date() }
  if (body && 'imagePath' in body) changes.imagePath = validateImagePath(body.imagePath)
  if (typeof body?.description === 'string') {
    changes.description = body.description
    changes.tags = tagsFromDescription(body.description)
  }

  const [row] = await useDb()
    .update(setupExamples)
    .set(changes)
    .where(eq(setupExamples.id, id))
    .returning(exampleColumns)

  if ('imagePath' in changes && existing.imagePath && existing.imagePath !== changes.imagePath) {
    await removeImages([existing.imagePath])
  }
  return toSetupExample({ ...row!, setupTitle: existing.setup.title })
})
