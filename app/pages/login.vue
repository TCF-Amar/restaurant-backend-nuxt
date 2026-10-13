<template>
  <div class="w-full flex items-center justify-center p-4 sm:p-6">
    <!-- Glass Overlay Card -->
    <div
      class="w-full max-w-sm backdrop-blur bg-white/2 border border-white/20 rounded-3xl p-8 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] space-y-6">
      <div class="text-center space-y-1">
        <h1 class="text-2xl font-bold text-white tracking-tight drop-shadow-sm">Sign In</h1>
        <p class="text-xs text-white/65">Enter your credentials to continue</p>
      </div>

      <form @submit.prevent="handleLogin" class="space-y-4">
        <!-- Error Message -->
        <div v-if="errorMessage"
          class="p-3 text-xs bg-rose-500/20 backdrop-blur-md border border-rose-500/30 text-rose-200 rounded-xl text-center">
          {{ errorMessage }}
        </div>

        <!-- Identifier -->
        <div class="space-y-1.5">
          <label class="block text-xs text-white/80 font-medium">Email or Phone</label>
          <input v-model="identifier" type="text" required placeholder="name@example.com"
            class="w-full px-4 py-2.5 bg-white/[0.08] backdrop-blur-md border border-white/20 rounded-xl text-sm text-white placeholder-white/40 focus:outline-none focus:border-white/50 focus:bg-white/[0.12] transition" />
        </div>

        <!-- Password -->
        <div class="space-y-1.5">
          <label class="block text-xs text-white/80 font-medium">Password</label>
          <input v-model="password" type="password" required placeholder="••••••••"
            class="w-full px-4 py-2.5 bg-white/[0.08] backdrop-blur-md border border-white/20 rounded-xl text-sm text-white placeholder-white/40 focus:outline-none focus:border-white/50 focus:bg-white/[0.12] transition" />
        </div>

        <!-- Glass Submit Button -->
        <button type="submit" :disabled="isLoading"
          class="w-full py-2.5 px-4 bg-white/20 hover:bg-white/30 border border-white/30 disabled:opacity-50 text-white font-semibold text-sm rounded-xl backdrop-blur-md shadow-lg transition active:scale-[0.99] cursor-pointer">
          <span v-if="isLoading">Signing in...</span>
          <span v-else>Sign In</span>
        </button>
      </form>

      <!-- Switch to Register -->
      <p class="text-center text-xs text-white/65">
        Don't have an account?
        <NuxtLink to="/register" class="text-white font-semibold hover:underline ml-1">Register</NuxtLink>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: "auth",
})

const { fetchUser, user } = useAuth()
const route = useRoute()

const identifier = ref("")
const password = ref("")
const isLoading = ref(false)
const errorMessage = ref("")

async function handleLogin() {
  errorMessage.value = ""
  isLoading.value = true

  try {
    await $fetch("/api/v1/auth/login", {
      method: "POST",
      body: {
        identifier: identifier.value,
        password: password.value,
      },
    })

    await fetchUser()

    if (user.value?.role === "CUSTOMER") {
      await navigateTo("/download")
      return
    }

    // Redirect to requested URL if valid, otherwise go to home dashboard '/'
    const redirectParam = typeof route.query.redirect === "string" ? route.query.redirect : null
    const isInvalidLegacyRoute = !redirectParam || redirectParam === "/admin" || redirectParam === "/owner"
    const target = isInvalidLegacyRoute ? "/" : redirectParam

    await navigateTo(target)
  } catch (err: any) {
    errorMessage.value = err?.data?.statusMessage || err?.data?.message || "Invalid credentials"
  } finally {
    isLoading.value = false
  }
}
</script>
