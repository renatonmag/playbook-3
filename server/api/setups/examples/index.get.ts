// Search examples across all setups.
export default defineEventHandler(async (event): Promise<SetupExample[]> => {
  return findExamples({ ...getExampleFilters(event), limit: 60 })
})
