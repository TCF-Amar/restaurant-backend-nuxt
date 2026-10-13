<template>
  <div class="flex-1 flex items-center justify-center p-4">
    <div class="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-xl p-8">
      <div class="text-center mb-8">
        <h1 class="text-2xl font-bold tracking-tight text-white">Welcome back</h1>
        <p class="text-sm text-slate-400 mt-2">Sign in to your account to continue</p>
      </div>

      <form @submit.prevent="handleLogin" class="space-y-5">
        <div v-if="errorMessage" class="p-3 text-sm bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl">
          {{ errorMessage }}
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Email or Phone</label>
          <input v-model="identifier" type="text" required placeholder="name@example.com or phone"
            class="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition" />
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Password</label>
          <input v-model="password" type="password" required placeholder="••••••••"
            class="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition" />
        </div>

        <button type="submit" :disabled="isLoading"
          class="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition duration-200 shadow-md shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
          <span v-if="isLoading">Signing in...</span>
          <span v-else>Sign In</span>
        </button>
      </form>

      <div class="mt-6 text-center text-sm text-slate-400">
        Don't have an account?
        <NuxtLink to="/register" class="text-indigo-400 hover:text-indigo-300 font-medium">Create an account</NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { fetchUser } = useAuth()
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

    // Update client-side auth state
    await fetchUser()

    // Redirect to requested page or home
    const redirectTo = (route.query.redirect as string) || "/"
    await navigateTo(redirectTo)
  } catch (err: any) {
    errorMessage.value = err?.data?.statusMessage || err?.data?.message || "Invalid credentials"
  } finally {
    isLoading.value = false
  }
}
</script>
