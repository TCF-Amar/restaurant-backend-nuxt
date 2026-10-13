export interface UserProfile {
  phone: string | null
  avatarUrl: string | null
}

export interface User {
  id: string
  name: string
  email: string | null
  phone: string | null
  role: string
  createdAt: string
  profile: UserProfile | null
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

  async function fetchUser() {
    try {
      fetchingUser.value = true
      authError.value = null

      // useRequestFetch forwards incoming cookies during SSR
      const res = await useRequestFetch()<MeApiResponse>("/api/v1/auth/me")
      user.value = res?.user ?? null
    } catch {
      user.value = null
      authError.value = "Failed to fetch user"
    } finally {
      initialized.value = true
      fetchingUser.value = false
    }
  }

  async function logout() {
    try {
      await $fetch("/api/v1/auth/logout", { method: "POST" })
    } catch (err) {
      console.warn("Logout error:", err)
    } finally {
      user.value = null
      initialized.value = true
      await navigateTo("/login")
    }
  }

  return {
    user,
    isAuthenticated,
    authError,
    initialized,
    fetchingUser,
    fetchUser,
    logout,
  }
}