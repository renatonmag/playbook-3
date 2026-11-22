import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const id = parseId(event)
  const setup = await useDb().query.setups.findFirst({ where: eq(schema.setups.id, id) })
  if (!setup) throw createError({ statusCode: 404, statusMessage: 'Setup not found' })
  return { id: setup.id, title: setup.title }
})
