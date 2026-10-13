<template>
  <div class="flex-1 flex items-center justify-center p-4 py-8">
    <div class="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-xl p-8">
      <div class="text-center mb-8">
        <h1 class="text-2xl font-bold tracking-tight text-white">Create an account</h1>
        <p class="text-sm text-slate-400 mt-2">Get started by creating your account</p>
      </div>

      <form @submit.prevent="handleRegister" class="space-y-4">
        <div v-if="errorMessage" class="p-3 text-sm bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl">
          {{ errorMessage }}
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Full Name</label>
          <input
            v-model="name"
            type="text"
            required
            placeholder="John Doe"
            class="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
          />
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Email Address</label>
          <input
            v-model="email"
            type="email"
            required
            placeholder="name@example.com"
            class="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
          />
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Phone (Optional)</label>
          <input
            v-model="phone"
            type="tel"
            placeholder="+1234567890"
            class="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
          />
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Password</label>
          <input
            v-model="password"
            type="password"
            required
            minlength="6"
            placeholder="Minimum 6 characters"
            class="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
          />
        </div>

        <button
          type="submit"
          :disabled="isLoading"
          class="w-full py-3 px-4 mt-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition duration-200 shadow-md shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          <span v-if="isLoading">Creating account...</span>
          <span v-else>Register</span>
        </button>
      </form>

      <div class="mt-6 text-center text-sm text-slate-400">
        Already have an account?
        <NuxtLink to="/login" class="text-indigo-400 hover:text-indigo-300 font-medium">Sign in</NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const name = ref("")
const email = ref("")
const phone = ref("")
const password = ref("")
const isLoading = ref(false)
const errorMessage = ref("")

async function handleRegister() {
  errorMessage.value = ""
  isLoading.value = true

  try {
    await $fetch("/api/v1/auth/register", {
      method: "POST",
      body: {
        name: name.value,
        email: email.value,
        password: password.value,
        phone: phone.value ? phone.value : undefined,
      },
    })

    // Auto-login after successful registration
    await $fetch("/api/v1/auth/login", {
      method: "POST",
      body: {
        identifier: email.value,
        password: password.value,
      },
    })

    const { fetchUser } = useAuth()
    await fetchUser()
    await navigateTo("/")
  } catch (err: any) {
    errorMessage.value = err?.data?.statusMessage || err?.data?.message || "Registration failed"
  } finally {
    isLoading.value = false
  }
}
</script>
