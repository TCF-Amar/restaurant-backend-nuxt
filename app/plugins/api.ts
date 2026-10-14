export default defineNuxtPlugin(() => {
  const apiFetch = $fetch.create({
    credentials: "include",
    onRequest({ options }) {
      // Forward cookies during SSR requests safely preserving existing headers
      if (import.meta.server) {
        const ssrHeaders = useRequestHeaders(["cookie"])
        if (ssrHeaders.cookie) {
          const headers = new Headers(options.headers)
          headers.set("cookie", ssrHeaders.cookie)
          options.headers = headers
        }
      }
    },
    onResponseError({ request, response }) {
      // Handle 401 Unauthorized on client
      if (response.status === 401 && import.meta.client) {
        const urlStr = typeof request === "string" ? request : (request as any)?.url || String(request)

        // Never auto-redirect on auth endpoints - let caller handle validation/auth responses directly
        // Examples: /auth/me, /auth/login, /auth/register, /auth/password/*, /auth/2fa/*, /auth/passkey/*
        if (urlStr.includes("/auth/")) {
          return
        }

        const route = useRoute()
        // Never auto-redirect if already on a public route
        const publicPages = ["/login", "/register", "/forgot-password", "/download"]
        const isPublicPage = publicPages.some((p) => route.path === p || route.path.startsWith(`${p}/`))
        if (isPublicPage) {
          return
        }

        // On protected routes, expired session should clear user state and redirect to login
        const { user } = useAuth()
        user.value = null
        navigateTo(`/login?redirect=${encodeURIComponent(route.fullPath)}`)
      }
    },
  })

  // Extended API client with convenient HTTP method shorthands
  const api = Object.assign(apiFetch, {
    get: <T = any>(url: string, opts?: any) => apiFetch<T>(url, { ...opts, method: "GET" }),
    post: <T = any>(url: string, body?: any, opts?: any) =>
      apiFetch<T>(url, { ...opts, method: "POST", ...(body !== undefined ? { body } : {}) }),
    put: <T = any>(url: string, body?: any, opts?: any) =>
      apiFetch<T>(url, { ...opts, method: "PUT", ...(body !== undefined ? { body } : {}) }),
    patch: <T = any>(url: string, body?: any, opts?: any) =>
      apiFetch<T>(url, { ...opts, method: "PATCH", ...(body !== undefined ? { body } : {}) }),
    delete: <T = any>(url: string, opts?: any) => apiFetch<T>(url, { ...opts, method: "DELETE" }),
  })

  return {
    provide: {
      api,
    },
  }
})
