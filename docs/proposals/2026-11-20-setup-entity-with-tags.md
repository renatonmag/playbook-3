# Setups and Setup Examples

**Date:** 2026-11-20

## Feature Request

A **setup** is a bucket identified only by its title (for example "Bull flag" or "ORB"). Inside it are **examples**. Each example has a chart image, a written description and its most important tags, and none has a title of its own. The app opens on a list of setups. Opening one shows its examples. The goal is to find the right example in seconds, either inside one setup or across all of them, by typing words or clicking tags.

## Findings

- **Relevant code:**
  - `server/database/schema.ts`: only has a `users` table. No domain tables yet, so these would be the first.
  - `server/utils/db.ts`: `useDb()` + `schema`, auto-imported. `server/api/users.get.ts` is the only DB-backed route.
  - `server/api/images.{get,post}.ts` + `server/utils/supabase.ts`: images are uploaded to the Supabase Storage bucket (`markdown-images`), get a unique key `<ts>-<id>-<name>`, and are returned as `ImageItem` (`shared/types/images.ts`) with a public URL.
  - `app/composables/useImageUploads.ts`: handles page-wide drag-and-drop upload, list loading and error state.
  - `app/pages/setup.vue`: a prototype. It's an image list and a large viewer over the *whole bucket*, with no data model behind it. Its layout is already close to the "inside a setup" page.
  - `app/components/MarkdownEditor.vue` (Milkdown Crepe), `ImageList.vue`, `ImageDropOverlay.vue`, `components/ui/button` (shadcn-vue).
- **Existing patterns:** Nitro file-based routes (`<name>.<method>.ts`) that check input by hand and use `createError({ statusCode, statusMessage })`, as in `images.post.ts`. Pages load data with `useFetch` and logic lives in `app/composables/`. Styling is Tailwind with a dark slate/emerald look. Migrations are generated with `pnpm db:generate`.
- **Integration points:** two new Drizzle tables plus a migration, new `server/api/setups/*` routes, the existing Storage bucket and upload helpers, and the `setup.vue` page, which would be replaced by the real setups UI. Later, trades will reference a setup (and maybe a specific example).

## Recommended Approach

**1. Data model: two tables. The setup is just a title, and examples hold everything else.**

```ts
// server/database/schema.ts
export const setups = pgTable('setups', {
  id: serial('id').primaryKey(),
  title: text('title').notNull().unique(),              // the bucket's identifier
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const setupExamples = pgTable('setup_examples', {
  id: serial('id').primaryKey(),
  setupId: integer('setup_id').notNull().references(() => setups.id, { onDelete: 'cascade' }),
  imagePath: text('image_path'),                         // Storage key, not URL
  description: text('description').notNull().default(''), // plain text
  tags: text('tags').array().notNull().default(sql`'{}'::text[]`),
  search: tsvector('search').generatedAlwaysAs(sql`to_tsvector('simple', description)`),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('setup_examples_setup_idx').on(t.setupId),
  index('setup_examples_tags_gin').using('gin', t.tags),
  index('setup_examples_search_gin').using('gin', t.search),
])
```

(`tsvector` is a small `customType` because Drizzle has no built-in for it.)

- **Tags sit on each example, as a `text[]` column.** Each example has only a few tags, so separate tag tables aren't needed. A GIN index makes "has all of these tags" (`tags @> $1`) fast. Autocomplete is `select distinct unnest(tags)`. Renaming a tag is one `array_replace` update. Tags are normalized on write: trimmed, lowercased and de-duplicated. That keeps `5m` and `5M ` from becoming two tags, which is what usually makes things hard to find.
- **Full-text search covers the example's description only.** The setup title is short, so the API also matches it with a plain `ILIKE`. Typing "flag" then brings up every example in the "Bull flag" setup, as well as examples from other setups whose descriptions mention a flag. The `'simple'` config avoids English stemming, which would mangle trading shorthand like "ORB" or "VWAP".
- **The title is unique,** because it is the setup's only identifier.
- **Store the Storage key, not the URL.** Build the URL when the response is sent, using `toImageItem` / `getPublicUrl`. Put example images under a `setups/` prefix in the bucket. The root listing in `images.get.ts` already skips folders, so these images won't show up in the Markdown page's image list.

**2. API** (`server/api/setups/`, following `images.post.ts`):

- `index.get.ts`: the setup list. Each item has its title, example count and the newest example's image as a cover thumbnail.
- `index.post.ts`, `[id].patch.ts` (rename), `[id].delete.ts`: create, rename and delete setups. Deleting a setup also removes its examples' images from Storage.
- `[id]/examples.get.ts`: a setup's examples, with an optional `?q=&tags=` filter.
- `examples/index.get.ts`: **search across all setups** with `?q=&tags=`. It returns examples together with their setup title, ranked by `ts_rank` or sorted by `updatedAt`. This is the "find an example fast" route.
- `examples/index.post.ts`, `examples/[id].patch.ts`, `examples/[id].delete.ts`: create, edit and delete examples. To upload, reuse `/api/images` with a `prefix` parameter, then save the returned key in `imagePath`.
- `tags.get.ts`: distinct tags with how often each is used, for the filter chips and autocomplete.
- Put `Setup` and `SetupExample` types in `shared/types/setups.ts`, next to `ImageItem`.

**3. UI: two levels, and search works from both.**

- `app/pages/setups/index.vue`: a grid of setup cards, each showing the title, a cover thumbnail and the number of examples. At the top sit a search box and a row of the most-used tags. As soon as you type or pick a tag, the grid switches to **matching examples from all setups**, each card labeled with its setup title. The filter state lives in the URL (`?q=…&tags=…`), so a view can be bookmarked and survives back/forward. Pressing `/` focuses the search box.
- `app/pages/setups/[id].vue`, the **examples page** (replaces the `setup.vue` prototype):
  - **Search bar at the top:** a text box plus tag chips (the same `SearchBar` as `/setups`), filtering only within this setup. The filters are kept in the URL.
  - **Below it, every matching example is shown in full.** Each one is a card with its image, its description (plain text, line breaks kept) and its tags. It's a single column, so you can read through them like a playbook. When no filter is active, every example in the setup is listed, newest first. Clicking a tag on a card adds it to the filter.
  - **Editing:** clicking a card's edit button switches that card to edit mode in place, with a plain textarea for the description, a tag input with autocomplete, a way to replace the image and a delete button. Changes are saved with a debounced PATCH. Clicking the image opens it full-size.
  - **Adding:** dropping an image anywhere on the page creates a new example in this setup, using `useImageUploads` with `onUploaded`. It appears at the top, already in edit mode.
  - The same example card component is reused for the cross-setup results on `/setups`, where it also shows the setup title.
- A `useSetupExamples` composable in `app/composables/` wraps `useFetch` with reactive `q`/`tags` params, and both pages use it.

**Order:** schema and migration → setup and example API → setup list page → setup detail page → search across all setups. Linking trades to a setup (`trades.setup_id`, and optionally `trades.example_id`) fits this design without changes.
