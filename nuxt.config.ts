// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],
  app: {
    head: { htmlAttrs: { class: 'dark' } },
  },
  vite: {
    plugins: [tailwindcss()],
  },
  // Server-only; set via NUXT_SUPABASE_URL, NUXT_SUPABASE_SERVICE_ROLE_KEY, NUXT_SUPABASE_BUCKET
  runtimeConfig: {
    supabaseUrl: '',
    supabaseServiceRoleKey: '',
    supabaseBucket: 'markdown-images',
  },
})
