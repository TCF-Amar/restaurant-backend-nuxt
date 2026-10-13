<template>
  <div class="w-full flex items-center justify-center p-4 sm:p-6">
    <!-- Glass Overlay Card -->
    <div
      class="w-full max-w-sm backdrop-blur bg-white/2 border border-white/20 rounded-3xl p-8 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] space-y-6">
      
      <!-- HEADER -->
      <div class="text-center space-y-1">
        <div v-if="isTwoFactorStep" class="mx-auto w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 mb-2 shadow-[0_0_20px_rgba(99,102,241,0.3)]">
          <LucideShieldCheck class="w-6 h-6" />
        </div>
        <h1 class="text-2xl font-bold text-white tracking-tight drop-shadow-sm">
          {{ isTwoFactorStep ? 'Two-Factor Verification' : 'Sign In' }}
        </h1>
        <p class="text-xs text-white/65">
          {{ isTwoFactorStep ? 'Enter the 6-digit code from your authenticator app' : 'Enter your credentials or use biometrics to continue' }}
        </p>
      </div>

      <!-- Success Message -->
      <div v-if="successMessage"
        class="p-3 text-xs bg-emerald-500/20 backdrop-blur-md border border-emerald-500/40 text-emerald-200 rounded-xl text-center">
        {{ successMessage }}
      </div>

      <!-- Error Message -->
      <div v-if="errorMessage"
        class="p-3 text-xs bg-rose-500/20 backdrop-blur-md border border-rose-500/30 text-rose-200 rounded-xl text-center">
        {{ errorMessage }}
      </div>

      <!-- STEP 2: 2FA TOTP Form -->
      <div v-if="isTwoFactorStep" class="space-y-4">
        <form @submit.prevent="handleVerify2fa" class="space-y-4">
          <div class="space-y-1.5">
            <label class="block text-xs text-white/80 font-medium text-center">Authenticator 6-Digit Code</label>
            <input
              v-model="totpCode"
              type="text"
              inputmode="numeric"
              pattern="[0-9]*"
              maxlength="6"
              required
              autofocus
              placeholder="000000"
              class="w-full px-4 py-3 bg-white/[0.08] backdrop-blur-md border border-white/20 rounded-xl text-center font-mono text-xl tracking-[0.3em] text-white placeholder-white/20 focus:outline-none focus:border-indigo-400 focus:bg-white/[0.12] transition"
            />
          </div>

          <button
            type="submit"
            :disabled="isLoading || totpCode.length !== 6"
            class="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 border border-indigo-400/40 disabled:opacity-50 text-white font-semibold text-sm rounded-xl backdrop-blur-md shadow-lg transition active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2"
          >
            <LucideLoader2 v-if="isLoading" class="w-4 h-4 animate-spin" />
            <span>{{ isLoading ? 'Verifying Code...' : 'Verify & Sign In' }}</span>
          </button>
        </form>

        <button
          type="button"
          @click="resetToLogin"
          class="w-full text-center text-xs text-indigo-300 hover:text-white transition cursor-pointer"
        >
          ← Back to Email / Password
        </button>
      </div>

      <!-- STEP 1: Standard Login Form + Passkey Option -->
      <div v-else class="space-y-4">
        <form @submit.prevent="handleLogin" class="space-y-4">
          <!-- Identifier -->
          <div class="space-y-1.5">
            <label class="block text-xs text-white/80 font-medium">Email or Phone</label>
            <input v-model="identifier" type="text" required placeholder="name@example.com"
              class="w-full px-4 py-2.5 bg-white/[0.08] backdrop-blur-md border border-white/20 rounded-xl text-sm text-white placeholder-white/40 focus:outline-none focus:border-white/50 focus:bg-white/[0.12] transition" />
          </div>

          <!-- Password -->
          <div class="space-y-1.5">
            <div class="flex items-center justify-between">
              <label class="block text-xs text-white/80 font-medium">Password</label>
              <NuxtLink to="/forgot-password" class="text-xs text-indigo-300 hover:text-white transition">
                Forgot password?
              </NuxtLink>
            </div>
            <input v-model="password" type="password" required placeholder="••••••••"
              class="w-full px-4 py-2.5 bg-white/[0.08] backdrop-blur-md border border-white/20 rounded-xl text-sm text-white placeholder-white/40 focus:outline-none focus:border-white/50 focus:bg-white/[0.12] transition" />
          </div>

          <!-- Glass Submit Button -->
          <button type="submit" :disabled="isLoading"
            class="w-full py-2.5 px-4 bg-white/20 hover:bg-white/30 border border-white/30 disabled:opacity-50 text-white font-semibold text-sm rounded-xl backdrop-blur-md shadow-lg transition active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2">
            <LucideLoader2 v-if="isLoading && !isPasskeyLoading" class="w-4 h-4 animate-spin" />
            <span>{{ isLoading && !isPasskeyLoading ? 'Signing in...' : 'Sign In with Password' }}</span>
          </button>
        </form>

        <!-- Divider -->
        <div class="flex items-center gap-3 my-1">
          <div class="h-px flex-1 bg-white/10"></div>
          <span class="text-[11px] uppercase tracking-wider text-white/40 font-semibold">Or</span>
          <div class="h-px flex-1 bg-white/10"></div>
        </div>

        <!-- 1-Click Passkey Login Button -->
        <button
          type="button"
          @click="handlePasskeyLogin"
          :disabled="isPasskeyLoading || isLoading"
          class="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 hover:from-indigo-500/30 hover:via-purple-500/30 hover:to-pink-500/30 border border-indigo-400/30 text-white font-semibold text-xs backdrop-blur-md shadow-lg transition active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2.5 group"
        >
          <LucideLoader2 v-if="isPasskeyLoading" class="w-4 h-4 animate-spin text-indigo-300" />
          <LucideFingerprint v-else class="w-4 h-4 text-indigo-300 group-hover:scale-110 transition-transform" />
          <span>{{ isPasskeyLoading ? 'Waiting for Biometrics / Passkey...' : 'Sign In with Passkey / Biometrics' }}</span>
        </button>

        <!-- Switch to Register -->
        <p class="text-center text-xs text-white/65 pt-2">
          Don't have an account?
          <NuxtLink to="/register" class="text-white font-semibold hover:underline ml-1">Register</NuxtLink>
        </p>
      </div>

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
const isPasskeyLoading = ref(false)
const errorMessage = ref("")
const successMessage = ref("")

// 2FA state
const isTwoFactorStep = ref(false)
const tempToken = ref("")
const totpCode = ref("")

onMounted(() => {
  if (route.query.passwordChanged) {
    successMessage.value = "Password changed successfully! Please sign in with your new password."
  } else if (route.query.reset) {
    successMessage.value = "Password reset successfully! Please sign in with your new password."
  }
})

function resetToLogin() {
  isTwoFactorStep.value = false
  tempToken.value = ""
  totpCode.value = ""
  errorMessage.value = ""
}

async function redirectAfterAuth() {
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
}

async function handleLogin() {
  errorMessage.value = ""
  isLoading.value = true

  try {
    const res = await $fetch<any>("/api/v1/auth/login", {
      method: "POST",
      body: {
        identifier: identifier.value,
        password: password.value,
      },
    })

    // If 2FA is required, transition to step 2
    if (res?.require2FA && res?.tempToken) {
      tempToken.value = res.tempToken
      isTwoFactorStep.value = true
      totpCode.value = ""
      return
    }

    await redirectAfterAuth()
  } catch (err: any) {
    errorMessage.value = err?.data?.statusMessage || err?.data?.message || "Invalid credentials"
  } finally {
    isLoading.value = false
  }
}

async function handleVerify2fa() {
  if (!tempToken.value || totpCode.value.trim().length !== 6) return
  errorMessage.value = ""
  isLoading.value = true

  try {
    await $fetch("/api/v1/auth/2fa/verify-login", {
      method: "POST",
      body: {
        tempToken: tempToken.value,
        code: totpCode.value.trim(),
      },
    })

    await redirectAfterAuth()
  } catch (err: any) {
    errorMessage.value = err?.data?.statusMessage || err?.data?.message || "Invalid authenticator code"
  } finally {
    isLoading.value = false
  }
}

async function handlePasskeyLogin() {
  errorMessage.value = ""
  isPasskeyLoading.value = true

  try {
    const { startAuthentication, browserSupportsWebAuthn } = await import("@simplewebauthn/browser")

    if (!browserSupportsWebAuthn()) {
      errorMessage.value = "Your browser does not support Passkey / WebAuthn authentication."
      return
    }

    // 1. Fetch authentication options from backend
    const options = await $fetch<any>("/api/v1/auth/passkey/login/options", {
      method: "POST",
      body: {
        identifier: identifier.value.trim() || undefined,
      },
    })

    // 2. Prompt user for biometrics or passkey
    const authResponse = await startAuthentication({ optionsJSON: options })

    // 3. Verify assertion on backend
    await $fetch("/api/v1/auth/passkey/login/verify", {
      method: "POST",
      body: {
        response: authResponse,
        challenge: options.challenge,
      },
    })

    await redirectAfterAuth()
  } catch (err: any) {
    console.error("[Passkey:Login]", err)
    if (err.name === "NotAllowedError") {
      errorMessage.value = "Passkey sign-in was canceled or timed out."
    } else {
      errorMessage.value = err?.data?.statusMessage || err?.data?.message || err?.message || "Passkey authentication failed."
    }
  } finally {
    isPasskeyLoading.value = false
  }
}
</script>
