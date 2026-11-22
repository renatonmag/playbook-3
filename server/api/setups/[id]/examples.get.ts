export default defineEventHandler(async (event): Promise<SetupExample[]> => {
  const setupId = parseId(event)
  return findExamples({ setupId, ...getExampleFilters(event) })
})
