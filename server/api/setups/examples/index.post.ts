import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event): Promise<SetupExample> => {
  const body = await readBody<{ setupId?: unknown; imagePath?: unknown; description?: unknown }>(event)
  const setupId = Number(body?.setupId)
  if (!Number.isInteger(setupId) || setupId <= 0) throw createError({ statusCode: 400, statusMessage: 'Invalid setupId' })

  const setup = await useDb().query.setups.findFirst({ where: eq(schema.setups.id, setupId) })
  if (!setup) throw createError({ statusCode: 404, statusMessage: 'Setup not found' })

  const description = typeof body?.description === 'string' ? body.description : ''

  const [row] = await useDb()
    .insert(schema.setupExamples)
    .values({
      setupId,
      imagePath: validateImagePath(body?.imagePath),
      description,
      tags: tagsFromDescription(description),
    })
    .returning(exampleColumns)

  setResponseStatus(event, 201)
  return toSetupExample({ ...row!, setupTitle: setup.title })
})
