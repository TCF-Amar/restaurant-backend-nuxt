import tailwindcss from "@tailwindcss/vite";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    'nuxt-lucide-icons',
    'nuxt-icons',
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
        title: "API Documentation",
        description:
          "REST API for authentication, account sessions, profile management, and verification.",
        version: "1.0.0",
      },
      production: false,
      ui: {
        scalar: { route: "/docs" },
        swagger: false,
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
