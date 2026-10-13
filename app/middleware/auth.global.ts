export default defineNuxtRouteMiddleware(async (to) => {
  const {
    user,
    initialized,
    fetchUser,
    canAccessCategories,
    canAccessOrders,
    canAccessRestaurants,
  } = useAuth()

  if (!initialized.value) {
    await fetchUser()
  }

  const publicRoutes = ["/login", "/register", "/forgot-password", "/download"]
  const isPublicRoute = publicRoutes.some((route) => to.path === route || to.path.startsWith(`${route}/`))

  if (!user.value && !isPublicRoute) {
    return navigateTo({
      path: "/login",
      query: to.path !== "/" ? { redirect: to.fullPath } : undefined,
    })
  }

  if (["/login", "/register", "/forgot-password"].includes(to.path) && user.value) {
    if (user.value.role === "CUSTOMER") {
      return navigateTo("/download")
    }
    return navigateTo("/")
  }

  // Strict Customer Protection: Normal users (customers) cannot access ANY other route
  if (user.value?.role === "CUSTOMER") {
    if (to.path !== "/download") {
      return navigateTo("/download")
    }
    return
  }

  // Admin-only route protection: /users
  if (to.path.startsWith("/users") && user.value?.role !== "ADMIN") {
    return navigateTo("/")
  }

  // Permission-based route protection
  if (to.path.startsWith("/categories") && !canAccessCategories.value) {
    return navigateTo("/")
  }

  if (to.path.startsWith("/orders") && !canAccessOrders.value) {
    return navigateTo("/")
  }

  if (to.path.startsWith("/restaurants") && !canAccessRestaurants.value) {
    return navigateTo("/")
  }
})