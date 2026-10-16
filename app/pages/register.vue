<template>
  <div class="w-full flex items-center justify-center p-4 sm:p-6">
    <!-- Glass Overlay Card -->
    <div
      class="w-full max-w-sm backdrop-blur bg-white/2 border border-white/20 rounded-3xl p-8 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] space-y-6 my-4">
      <div class="text-center space-y-1">
        <h1 class="text-2xl font-bold text-white tracking-tight drop-shadow-sm">Create Account</h1>
        <p class="text-xs text-white/65">Sign up to get started</p>
      </div>

      <!-- Registration Mode Switcher -->
      <div class="flex items-center p-1 rounded-xl bg-white/[0.04] border border-white/10 text-xs">
        <button
          type="button"
          @click="registerMode = 'email'"
          :class="[
            'flex-1 py-1.5 rounded-lg font-semibold transition cursor-pointer text-center',
            registerMode === 'email'
              ? 'bg-indigo-600/40 text-white border border-indigo-500/50 shadow-sm'
              : 'text-white/60 hover:text-white'
          ]"
        >
          With Email
        </button>
        <button
          type="button"
          @click="registerMode = 'phone'"
          :class="[
            'flex-1 py-1.5 rounded-lg font-semibold transition cursor-pointer text-center',
            registerMode === 'phone'
              ? 'bg-indigo-600/40 text-white border border-indigo-500/50 shadow-sm'
              : 'text-white/60 hover:text-white'
          ]"
        >
          With Phone
        </button>
      </div>

      <form @submit.prevent="handleRegister" class="space-y-4">
        <!-- Error Message -->
        <div v-if="errorMessage"
          class="p-3 text-xs bg-rose-500/20 backdrop-blur-md border border-rose-500/30 text-rose-200 rounded-xl text-center">
          {{ errorMessage }}
        </div>

        <!-- Full Name -->
        <div class="space-y-1.5">
          <label class="block text-xs text-white/80 font-medium">Full Name</label>
          <input v-model="name" type="text" required placeholder="John Doe"
            class="w-full px-4 py-2.5 bg-white/[0.08] backdrop-blur-md border border-white/20 rounded-xl text-sm text-white placeholder-white/40 focus:outline-none focus:border-white/50 focus:bg-white/[0.12] transition" />
        </div>

        <!-- Email (if email mode) -->
        <div v-if="registerMode === 'email'" class="space-y-1.5">
          <label class="block text-xs text-white/80 font-medium">Email Address</label>
          <input v-model="email" type="email" required placeholder="name@example.com"
            class="w-full px-4 py-2.5 bg-white/[0.08] backdrop-blur-md border border-white/20 rounded-xl text-sm text-white placeholder-white/40 focus:outline-none focus:border-white/50 focus:bg-white/[0.12] transition" />
        </div>

        <!-- Phone (if phone mode) -->
        <div v-else class="space-y-1.5">
          <label class="block text-xs text-white/80 font-medium">Mobile Phone Number</label>
          <input v-model="phone" type="tel" required placeholder="+15551234567"
            class="w-full px-4 py-2.5 bg-white/[0.08] backdrop-blur-md border border-white/20 rounded-xl text-sm text-white placeholder-white/40 focus:outline-none focus:border-white/50 focus:bg-white/[0.12] transition" />
        </div>

        <!-- Password -->
        <div class="space-y-1.5">
          <label class="block text-xs text-white/80 font-medium">Password</label>
          <input v-model="password" type="password" required minlength="6" placeholder="Minimum 6 characters"
            class="w-full px-4 py-2.5 bg-white/[0.08] backdrop-blur-md border border-white/20 rounded-xl text-sm text-white placeholder-white/40 focus:outline-none focus:border-white/50 focus:bg-white/[0.12] transition" />
        </div>

        <!-- Glass Submit Button -->
        <button type="submit" :disabled="isLoading"
          class="w-full py-2.5 px-4 bg-white/20 hover:bg-white/30 border border-white/30 disabled:opacity-50 text-white font-semibold text-sm rounded-xl backdrop-blur-md shadow-lg transition active:scale-[0.99] cursor-pointer">
          <span v-if="isLoading">Creating account...</span>
          <span v-else>Register</span>
        </button>
      </form>

      <!-- Switch to Login -->
      <p class="text-center text-xs text-white/65">
        Already have an account?
        <NuxtLink to="/login" class="text-white font-semibold hover:underline ml-1">Sign in</NuxtLink>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: "auth",
})

const registerMode = ref<'email' | 'phone'>('email')
const name = ref("")
const email = ref("")
const phone = ref("")
const password = ref("")
const isLoading = ref(false)
const errorMessage = ref("")

async function handleRegister() {
  errorMessage.value = ""
  isLoading.value = true

  const identifierToLogin = registerMode.value === 'email' ? email.value.trim() : phone.value.trim()

  try {
    await $fetch("/api/v1/auth/register", {
      method: "POST",
      body: {
        name: name.value,
        email: registerMode.value === 'email' ? email.value.trim() : undefined,
        phone: registerMode.value === 'phone' ? phone.value.trim() : undefined,
        password: password.value,
      },
    })

    // Auto-login after registration
    await $fetch("/api/v1/auth/login", {
      method: "POST",
      body: {
        identifier: identifierToLogin,
        password: password.value,
      },
    })

    const { user, fetchUser } = useAuth()
    await fetchUser()

    if (user.value?.role === "CUSTOMER") {
      await navigateTo("/download")
    } else {
      await navigateTo("/")
    }
  } catch (err: any) {
    errorMessage.value = err?.data?.statusMessage || err?.data?.message || "Registration failed"
  } finally {
    isLoading.value = false
  }
}
</script>
