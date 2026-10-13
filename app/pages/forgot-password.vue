<template>
  <div class="w-full flex items-center justify-center p-4 sm:p-6">
    <!-- Glass Overlay Card -->
    <div
      class="w-full max-w-md backdrop-blur bg-white/2 border border-white/20 rounded-3xl p-8 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] space-y-6 relative overflow-hidden"
    >
      <!-- Top Step Indicator -->
      <div class="flex items-center justify-between pb-2 border-b border-white/10 text-xs">
        <NuxtLink
          to="/login"
          class="text-white/60 hover:text-white transition flex items-center gap-1 font-medium"
        >
          <LucideArrowLeft class="w-3.5 h-3.5" />
          <span>Back to Sign In</span>
        </NuxtLink>
        <span class="text-white/40 font-mono text-[11px]">Step {{ currentStep }} of 3</span>
      </div>

      <!-- Header -->
      <div class="text-center space-y-1">
        <div class="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 flex items-center justify-center mx-auto mb-2 shadow-lg">
          <LucideKeyRound v-if="currentStep === 1" class="w-6 h-6 text-indigo-300" />
          <LucideShieldCheck v-else-if="currentStep === 2" class="w-6 h-6 text-purple-300" />
          <LucideLock v-else class="w-6 h-6 text-emerald-300" />
        </div>
        <h1 class="text-2xl font-bold text-white tracking-tight drop-shadow-sm">
          {{ stepTitle }}
        </h1>
        <p class="text-xs text-white/65">
          {{ stepSubtitle }}
        </p>
      </div>

      <!-- Alerts -->
      <div
        v-if="errorMessage"
        class="p-3 text-xs bg-rose-500/20 backdrop-blur-md border border-rose-500/30 text-rose-200 rounded-xl text-center"
      >
        {{ errorMessage }}
      </div>

      <div
        v-if="infoMessage"
        class="p-3 text-xs bg-indigo-500/20 backdrop-blur-md border border-indigo-500/30 text-indigo-200 rounded-xl text-center space-y-1"
      >
        <div>{{ infoMessage }}</div>
        <div v-if="debugCode" class="text-amber-300 font-mono font-bold tracking-widest text-sm pt-1">
          Demo Code: {{ debugCode }}
        </div>
      </div>

      <!-- STEP 1: Enter Identifier & Request OTP -->
      <form v-if="currentStep === 1" @submit.prevent="handleRequestOtp" class="space-y-4">
        <div class="space-y-1.5">
          <label class="block text-xs text-white/80 font-medium">Registered Email or Phone</label>
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/40">
              <LucideMail class="w-4 h-4" />
            </div>
            <input
              v-model="identifier"
              type="text"
              required
              placeholder="e.g. user@example.com"
              class="w-full pl-10 pr-4 py-2.5 bg-white/[0.08] backdrop-blur-md border border-white/20 rounded-xl text-sm text-white placeholder-white/40 focus:outline-none focus:border-white/50 focus:bg-white/[0.12] transition"
            />
          </div>
        </div>

        <button
          type="submit"
          :disabled="isLoading || !identifier.trim()"
          class="w-full py-2.5 px-4 bg-white/20 hover:bg-white/30 border border-white/30 disabled:opacity-50 text-white font-semibold text-sm rounded-xl backdrop-blur-md shadow-lg transition active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2"
        >
          <LucideLoader2 v-if="isLoading" class="w-4 h-4 animate-spin" />
          <LucideSend v-else class="w-4 h-4" />
          <span>{{ isLoading ? 'Sending Code...' : 'Send Verification Code' }}</span>
        </button>
      </form>

      <!-- STEP 2: Enter 6-Digit OTP Code -->
      <form v-else-if="currentStep === 2" @submit.prevent="handleVerifyOtp" class="space-y-4">
        <div class="space-y-2">
          <label class="block text-xs text-white/80 font-medium text-center">
            Enter 6-Digit Verification Code
          </label>
          <div class="relative">
            <input
              v-model="otpCode"
              type="text"
              maxlength="6"
              required
              pattern="[0-9]{6}"
              placeholder="123456"
              class="w-full tracking-[0.5em] text-center font-mono text-xl py-3 px-4 bg-white/[0.08] backdrop-blur-md border border-white/20 rounded-xl text-white placeholder-white/25 focus:outline-none focus:border-indigo-400 focus:bg-white/[0.12] transition"
            />
          </div>
          <p class="text-[11px] text-center text-white/50">
            A 6-digit security code was dispatched to <strong class="text-white">{{ identifier }}</strong>
          </p>
        </div>

        <button
          type="submit"
          :disabled="isLoading || otpCode.length !== 6"
          class="w-full py-2.5 px-4 bg-white/20 hover:bg-white/30 border border-white/30 disabled:opacity-50 text-white font-semibold text-sm rounded-xl backdrop-blur-md shadow-lg transition active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2"
        >
          <LucideLoader2 v-if="isLoading" class="w-4 h-4 animate-spin" />
          <LucideCheckCircle2 v-else class="w-4 h-4 text-emerald-400" />
          <span>{{ isLoading ? 'Verifying...' : 'Verify Security Code' }}</span>
        </button>

        <!-- Resend Code -->
        <div class="text-center pt-2">
          <button
            v-if="cooldown > 0"
            type="button"
            disabled
            class="text-xs text-white/40 cursor-not-allowed"
          >
            Resend code in {{ cooldown }}s
          </button>
          <button
            v-else
            @click="handleRequestOtp"
            type="button"
            class="text-xs text-indigo-300 hover:text-white underline transition cursor-pointer"
          >
            Didn't receive code? Resend
          </button>
        </div>
      </form>

      <!-- STEP 3: Set New Password -->
      <form v-else-if="currentStep === 3" @submit.prevent="handleResetPassword" class="space-y-4">
        <!-- New Password -->
        <div class="space-y-1.5">
          <label class="block text-xs text-white/80 font-medium">New Password</label>
          <div class="relative">
            <input
              v-model="newPassword"
              :type="showPassword ? 'text' : 'password'"
              required
              minlength="8"
              placeholder="Minimum 8 characters"
              class="w-full px-4 py-2.5 pr-10 bg-white/[0.08] backdrop-blur-md border border-white/20 rounded-xl text-sm text-white placeholder-white/40 focus:outline-none focus:border-white/50 focus:bg-white/[0.12] transition"
            />
            <button
              type="button"
              @click="showPassword = !showPassword"
              class="absolute inset-y-0 right-0 pr-3 flex items-center text-white/50 hover:text-white"
            >
              <LucideEyeOff v-if="showPassword" class="w-4 h-4" />
              <LucideEye v-else class="w-4 h-4" />
            </button>
          </div>
        </div>

        <!-- Confirm Password -->
        <div class="space-y-1.5">
          <label class="block text-xs text-white/80 font-medium">Confirm New Password</label>
          <input
            v-model="confirmPassword"
            :type="showPassword ? 'text' : 'password'"
            required
            minlength="8"
            placeholder="Re-enter new password"
            class="w-full px-4 py-2.5 bg-white/[0.08] backdrop-blur-md border border-white/20 rounded-xl text-sm text-white placeholder-white/40 focus:outline-none focus:border-white/50 focus:bg-white/[0.12] transition"
          />
        </div>

        <button
          type="submit"
          :disabled="isLoading || !newPassword || newPassword !== confirmPassword"
          class="w-full py-2.5 px-4 bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 border border-white/30 disabled:opacity-50 text-white font-semibold text-sm rounded-xl backdrop-blur-md shadow-lg transition active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2"
        >
          <LucideLoader2 v-if="isLoading" class="w-4 h-4 animate-spin" />
          <LucideSave v-else class="w-4 h-4" />
          <span>{{ isLoading ? 'Updating Password...' : 'Save New Password' }}</span>
        </button>
      </form>

      <!-- STEP 4: Success Screen -->
      <div v-else-if="currentStep === 4" class="text-center space-y-4 py-4">
        <div class="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-xl">
          <LucideCheck class="w-8 h-8" />
        </div>
        <div class="space-y-1">
          <h2 class="text-lg font-bold text-white">Password Updated!</h2>
          <p class="text-xs text-white/70">
            Your account security credentials have been updated. Please sign in with your new password.
          </p>
        </div>
        <NuxtLink
          to="/login"
          class="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-white/20 hover:bg-white/30 border border-white/30 text-white font-semibold text-sm rounded-xl backdrop-blur-md shadow-lg transition cursor-pointer"
        >
          <span>Sign In Now</span>
          <LucideArrowRight class="w-4 h-4" />
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'auth',
})

const currentStep = ref(1) // 1: request, 2: verify, 3: new password, 4: success
const identifier = ref('')
const otpCode = ref('')
const resetToken = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)

const isLoading = ref(false)
const errorMessage = ref('')
const infoMessage = ref('')
const debugCode = ref('')
const cooldown = ref(0)
let timer: any = null

const stepTitle = computed(() => {
  if (currentStep.value === 1) return 'Forgot Password'
  if (currentStep.value === 2) return 'Verify Security Code'
  if (currentStep.value === 3) return 'Create New Password'
  return 'Password Reset'
})

const stepSubtitle = computed(() => {
  if (currentStep.value === 1) return 'Enter your account email to receive a 6-digit verification code'
  if (currentStep.value === 2) return 'Check your inbox for the one-time verification code'
  if (currentStep.value === 3) return 'Choose a secure password with at least 8 characters'
  return 'Your password has been successfully updated'
})

function startCooldown(seconds = 60) {
  cooldown.value = seconds
  clearInterval(timer)
  timer = setInterval(() => {
    if (cooldown.value > 0) {
      cooldown.value--
    } else {
      clearInterval(timer)
    }
  }, 1000)
}

onUnmounted(() => {
  clearInterval(timer)
})

// Step 1: Request OTP
async function handleRequestOtp() {
  errorMessage.value = ''
  infoMessage.value = ''
  debugCode.value = ''
  isLoading.value = true

  try {
    const res = await $fetch<any>('/api/v1/auth/password/forgot', {
      method: 'POST',
      body: {
        identifier: identifier.value.trim(),
      },
    })

    currentStep.value = 2
    infoMessage.value = res.message || 'Verification code sent. Please check your email.'
    if (res.debugOtp) {
      debugCode.value = res.debugOtp
    }
    startCooldown(res.cooldownSeconds || 60)
  } catch (err: any) {
    errorMessage.value = err?.data?.statusMessage || err?.data?.message || err?.message || 'Failed to send verification code'
  } finally {
    isLoading.value = false
  }
}

// Step 2: Verify OTP and get resetToken
async function handleVerifyOtp() {
  errorMessage.value = ''
  infoMessage.value = ''
  isLoading.value = true

  try {
    const res = await $fetch<any>('/api/v1/auth/password/verify-reset-code', {
      method: 'POST',
      body: {
        identifier: identifier.value.trim(),
        code: otpCode.value.trim(),
      },
    })

    if (res?.resetToken) {
      resetToken.value = res.resetToken
      currentStep.value = 3
      infoMessage.value = 'Code verified successfully. Now choose your new password.'
      debugCode.value = ''
    } else {
      errorMessage.value = 'Could not verify code. Please try again.'
    }
  } catch (err: any) {
    errorMessage.value = err?.data?.statusMessage || err?.data?.message || err?.message || 'Invalid or expired verification code'
  } finally {
    isLoading.value = false
  }
}

// Step 3: Submit New Password
async function handleResetPassword() {
  errorMessage.value = ''
  infoMessage.value = ''

  if (newPassword.value !== confirmPassword.value) {
    errorMessage.value = 'Passwords do not match'
    return
  }

  isLoading.value = true
  try {
    const res = await $fetch<any>('/api/v1/auth/password/reset', {
      method: 'POST',
      body: {
        resetToken: resetToken.value,
        newPassword: newPassword.value,
        confirmPassword: confirmPassword.value,
      },
    })

    if (res?.status === 'ok') {
      currentStep.value = 4
      setTimeout(() => {
        navigateTo('/login?reset=true')
      }, 2500)
    }
  } catch (err: any) {
    errorMessage.value = err?.data?.statusMessage || err?.data?.message || err?.message || 'Failed to reset password'
  } finally {
    isLoading.value = false
  }
}
</script>
