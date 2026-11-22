import { asc, eq, sql } from 'drizzle-orm'

export default defineEventHandler(async (): Promise<Setup[]> => {
  const { setups, setupExamples } = schema
  const rows = await useDb()
    .select({
      id: setups.id,
      title: setups.title,
      exampleCount: sql<number>`count(${setupExamples.id})::int`,
      // Newest example that has an image is the cover.
      coverPath: sql<string | null>`(array_agg(${setupExamples.imagePath} order by ${setupExamples.createdAt} desc)
        filter (where ${setupExamples.imagePath} is not null))[1]`,
    })
    .from(setups)
    .leftJoin(setupExamples, eq(setupExamples.setupId, setups.id))
    .groupBy(setups.id)
    .orderBy(asc(sql`lower(${setups.title})`))

  return rows.map(({ coverPath, ...row }) => ({ ...row, coverUrl: imageUrl(coverPath) }))
})
