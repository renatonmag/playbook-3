import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let _supabase: SupabaseClient | undefined

/** Server-side Supabase client using the service-role key (bypasses RLS). */
export function useSupabase() {
  if (!_supabase) {
    const { supabaseUrl, supabaseServiceRoleKey } = useRuntimeConfig()
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Supabase is not configured: set NUXT_SUPABASE_URL and NUXT_SUPABASE_SERVICE_ROLE_KEY',
      })
    }
    _supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  }
  return _supabase
}

export function useImageBucket() {
  return useSupabase().storage.from(useRuntimeConfig().supabaseBucket)
}

export function toImageItem(
  bucket: ReturnType<typeof useImageBucket>,
  file: { name: string; created_at?: string | null; metadata?: Record<string, any> | null },
): ImageItem {
  return {
    name: file.name,
    url: bucket.getPublicUrl(file.name).data.publicUrl,
    size: file.metadata?.size ?? null,
    createdAt: file.created_at ?? null,
  }
}
