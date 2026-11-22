import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '../database/schema'

export { schema }

let _db: ReturnType<typeof drizzle<typeof schema>> | undefined

export function useDb() {
  if (!_db) {
    const url = process.env.DATABASE_URL
    if (!url) throw new Error('DATABASE_URL is not set')
    // prepare: false is required for Supabase's transaction pooler (port 6543)
    _db = drizzle(postgres(url, { prepare: false }), { schema })
  }
  return _db
}
