import { sql } from 'drizzle-orm'

// Distinct tags with usage counts, most used first.
// `?setupId=` limits them to one setup's examples.
export default defineEventHandler(async (event): Promise<TagCount[]> => {
  const raw = getQuery(event).setupId
  const setupId = raw === undefined ? null : Number(raw)
  if (setupId !== null && (!Number.isInteger(setupId) || setupId <= 0)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid setupId' })
  }
  const e = schema.setupExamples
  const rows = await useDb().execute<{ tag: string; count: number }>(sql`
    select tag, count(*)::int as count
    from ${e}, unnest(${e.tags}) as tag
    ${setupId ? sql`where ${e.setupId} = ${setupId}` : sql``}
    group by tag
    order by count desc, tag asc
  `)
  return [...rows]
})
