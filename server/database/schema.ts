import { relations, sql } from 'drizzle-orm'
import { customType, index, integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core'

const tsvector = customType<{ data: string }>({
  dataType() {
    return 'tsvector'
  },
})

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

/** A setup is a bucket of examples, identified only by its title. */
export const setups = pgTable('setups', {
  id: serial('id').primaryKey(),
  title: text('title').notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const setupExamples = pgTable(
  'setup_examples',
  {
    id: serial('id').primaryKey(),
    setupId: integer('setup_id')
      .notNull()
      .references(() => setups.id, { onDelete: 'cascade' }),
    /** Storage key in the image bucket (not a URL). */
    imagePath: text('image_path'),
    /** Plain text, shown as typed. */
    description: text('description').notNull().default(''),
    /** Derived from the description's lines on write. Normalized: trimmed, lowercase, unique. */
    tags: text('tags').array().notNull().default(sql`'{}'::text[]`),
    search: tsvector('search').generatedAlwaysAs(sql`to_tsvector('simple', description)`),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('setup_examples_setup_idx').on(t.setupId),
    index('setup_examples_tags_gin').using('gin', t.tags),
    index('setup_examples_search_gin').using('gin', t.search),
  ],
)

export const setupsRelations = relations(setups, ({ many }) => ({
  examples: many(setupExamples),
}))

export const setupExamplesRelations = relations(setupExamples, ({ one }) => ({
  setup: one(setups, { fields: [setupExamples.setupId], references: [setups.id] }),
}))
