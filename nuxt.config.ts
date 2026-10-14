import tailwindcss from "@tailwindcss/vite";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@pinia/nuxt',
    'nuxt-lucide-icons',
    'nuxt-icons',
  ],
  components: [
    {
      path: '~/components',
      pathPrefix: false,
    },
  ],
  nitro: {
    imports: {
      dirs: ["server/utils/**"],
    },
    experimental: {
      openAPI: true,
    },
    openAPI: {
      meta: {
        title: "Artisan Delivery & Multi-Tenant Restaurant Platform API",
        description:
          "High-performance REST API powering the Flutter Mobile App (customer food ordering, address book, real-time checkout) and the Web Management Portal (admin oversight, kitchen pipeline, outlet staffing, and analytics).",
        version: "1.0.0",
      },

      ui: {
        scalar: { route: "/docs" },
        swagger: { route: "/swagger" },
      },
    },
  },
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  css: ["@/assets/css/main.css"],
  vite: {
    plugins: [tailwindcss()],
    server: {
      allowedHosts: true,

    }
  },
  plugins: [],
  runtimeConfig: {
    databaseUrl: "",
    redisUrl: "",
    jwtSecret: "",

    public: {
      amar: ""
    }

  },
})
