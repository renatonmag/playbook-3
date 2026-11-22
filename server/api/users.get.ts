export default defineEventHandler(async () => {
  return useDb().select().from(schema.users)
})
