export default defineNuxtRouteMiddleware(async (to) => {
  const { user, initialized, fetchUser } = useAuth()

  if (!initialized.value) {
    await fetchUser()
  }

  const publicRoutes = ["/login", "/register", "/forgot-password"]
  const isPublicRoute = publicRoutes.some((route) => to.path === route || to.path.startsWith(`${route}/`))

  if (!user.value && !isPublicRoute) {
    return navigateTo({
      path: "/login",
      query: to.path !== "/" ? { redirect: to.fullPath } : undefined,
    })
  }

  if (isPublicRoute && user.value?.role === "ADMIN") {
    return navigateTo("/admin")
  }
})