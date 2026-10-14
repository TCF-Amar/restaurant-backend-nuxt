export interface UserProfile {
  phone: string | null
  avatarUrl: string | null
}

export interface StaffAssignment {
  restaurantId: string
  permissions: string[]
  isPrimary: boolean
}

export interface User {
  id: string
  name: string
  email: string | null
  phone: string | null
  role: string
  twoFactorEnabled?: boolean
  createdAt: string
  profile: UserProfile | null
  restaurantStaff?: StaffAssignment[]
}

interface MeApiResponse {
  status: string
  user: User
}

export const useAuth = () => {
  const user = useState<User | null>("auth_user", () => null)
  const authError = useState<string | null>("auth_error", () => null)
  const initialized = useState<boolean>("auth_initialized", () => false)
  const fetchingUser = useState<boolean>("auth_fetching_user", () => false)

  const isAuthenticated = computed(() => !!user.value)
  const isSuperAdmin = computed(() => user.value?.role === "ADMIN")
  const isRestaurantOwner = computed(() => user.value?.role === "RESTAURANT_OWNER")
  const isCustomer = computed(() => user.value?.role === "CUSTOMER")

  function hasRestaurantPermission(permission: string, restaurantId?: string): boolean {
    if (isSuperAdmin.value) return true
    if (!isRestaurantOwner.value) return false
    const staff = user.value?.restaurantStaff || []
    if (restaurantId) {
      return staff.some((s) => s.restaurantId === restaurantId && s.permissions.includes(permission))
    }
    return staff.some((s) => s.permissions.includes(permission))
  }

  const canAccessRestaurants = computed(() => {
    if (isSuperAdmin.value) return true
    if (!isRestaurantOwner.value) return false
    const staff = user.value?.restaurantStaff || []
    return staff.length > 0
  })

  const canAccessCategories = computed(() => {
    if (isSuperAdmin.value) return true
    if (!isRestaurantOwner.value) return false
    return hasRestaurantPermission("MANAGE_CATEGORIES")
  })

  const canAccessOrders = computed(() => {
    if (isSuperAdmin.value) return true
    if (isRestaurantOwner.value) return hasRestaurantPermission("MANAGE_ORDERS")
    if (isCustomer.value) return true
    return false
  })

  const canAccessUsers = computed(() => {
    return isSuperAdmin.value
  })

  const canAccessDocs = computed(() => {
    return isSuperAdmin.value
  })

  async function fetchUser() {
    try {
      fetchingUser.value = true
      authError.value = null

      const api = useApi()
      const res = await api<MeApiResponse>("/api/v1/auth/me")
      user.value = res?.user ?? null
    } catch {
      user.value = null
      authError.value = "Failed to fetch user"
    } finally {
      initialized.value = true
      fetchingUser.value = false
    }
  }

  async function logout(redirectPath = "/login") {
    try {
      const api = useApi()
      await api.post("/api/v1/auth/logout")
    } catch (err) {
      console.warn("Logout error:", err)
    } finally {
      user.value = null
      initialized.value = true
      await navigateTo(redirectPath)
    }
  }

  return {
    user,
    isAuthenticated,
    isSuperAdmin,
    isRestaurantOwner,
    isCustomer,
    hasRestaurantPermission,
    canAccessRestaurants,
    canAccessCategories,
    canAccessOrders,
    canAccessUsers,
    canAccessDocs,
    authError,
    initialized,
    fetchingUser,
    fetchUser,
    logout,
  }
}