import { existsSync } from 'node:fs'
import { defineConfig } from 'drizzle-kit'

// Load .env for drizzle-kit (Nuxt loads it itself at runtime)
if (existsSync('.env')) process.loadEnvFile('.env')

export default defineConfig({
  dialect: 'postgresql',
  schema: './server/database/schema.ts',
  out: './server/database/migrations',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
})
