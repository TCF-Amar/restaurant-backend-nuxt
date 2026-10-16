<template>
  <div class="rounded-3xl glass-card p-6 sm:p-8 border border-white/10 space-y-6">
    <div class="border-b border-white/[0.08] pb-4">
      <h2 class="text-lg font-bold text-white">Profile Information</h2>
      <p class="text-xs text-slate-400">Update your account display details and personal contact information.</p>
    </div>

    <!-- Avatar Section -->
    <div class="flex items-center gap-4">
      <div
        class="w-16 h-16 rounded-2xl  flex items-center justify-center text-4xl font-bold text-white shadow-lg ring-2 ring-white/20">
        <span v-if="profileForm.name">{{ profileForm.name.charAt(0).toUpperCase() }}</span>
        <LucideUser v-else class="w-8 h-8" />
      </div>
      <div class="space-y-1">
        <p class="text-xs font-semibold text-white">Profile Avatar</p>
        <p class="text-[11px] text-slate-400">Generated from your display initials</p>
        <span
          class="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 uppercase">
          {{ user?.role || 'CUSTOMER' }}
        </span>
      </div>
    </div>

    <form @submit.prevent="handleSaveProfile" class="space-y-4">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <!-- Name -->
        <div class="space-y-1.5">
          <label class="block text-xs font-medium text-slate-300">Full Name</label>
          <input v-model="profileForm.name" type="text" required placeholder="Your full name"
            class="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50" />
        </div>

        <!-- Email with Verification Badge & Action -->
        <div class="space-y-1.5">
          <div class="flex items-center justify-between">
            <label class="block text-xs font-medium text-slate-300">Email Address</label>
            <div class="flex items-center gap-1.5">
              <span v-if="user?.email && user?.emailVerifiedAt" class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                <LucideCheckCircle2 class="w-2.5 h-2.5" />
                Verified
              </span>
              <span v-else-if="user?.email" class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 border border-amber-500/30 text-amber-300">
                <LucideAlertCircle class="w-2.5 h-2.5" />
                Unverified
              </span>
              <button
                v-if="profileForm.email && (!user?.emailVerifiedAt || profileForm.email !== user?.email)"
                @click="openVerifyModal('email', profileForm.email)"
                type="button"
                class="text-[10px] font-semibold text-indigo-300 hover:text-white underline underline-offset-2 transition cursor-pointer"
              >
                Verify OTP
              </button>
            </div>
          </div>
          <input v-model="profileForm.email" type="email" placeholder="name@example.com"
            class="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50" />
        </div>

        <!-- Phone with Verification Badge & Action -->
        <div class="space-y-1.5">
          <div class="flex items-center justify-between">
            <label class="block text-xs font-medium text-slate-300">Phone Number</label>
            <div class="flex items-center gap-1.5">
              <span v-if="user?.phone && user?.phoneVerifiedAt" class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                <LucideCheckCircle2 class="w-2.5 h-2.5" />
                Verified
              </span>
              <span v-else-if="user?.phone" class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 border border-amber-500/30 text-amber-300">
                <LucideAlertCircle class="w-2.5 h-2.5" />
                Unverified
              </span>
              <button
                v-if="profileForm.phone && (!user?.phoneVerifiedAt || profileForm.phone !== user?.phone)"
                @click="openVerifyModal('phone', profileForm.phone)"
                type="button"
                class="text-[10px] font-semibold text-indigo-300 hover:text-white underline underline-offset-2 transition cursor-pointer"
              >
                Verify OTP
              </button>
            </div>
          </div>
          <input v-model="profileForm.phone" type="tel" placeholder="+1 (555) 000-0000"
            class="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50" />
        </div>

        <!-- User ID (Read-only) -->
        <div class="space-y-1.5">
          <label class="block text-xs font-medium text-slate-300">Account ID</label>
          <input :value="user?.id || '—'" disabled
            class="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05] text-xs text-slate-500 font-mono cursor-not-allowed" />
        </div>
      </div>

      <div class="pt-2 flex justify-end">
        <button type="submit" :disabled="isSaving"
          class="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 border border-indigo-400/40 text-white text-xs font-semibold backdrop-blur-md shadow-lg transition active:scale-95 cursor-pointer disabled:opacity-50 flex items-center gap-2">
          <LucideLoader2 v-if="isSaving" class="w-3.5 h-3.5 animate-spin" />
          <LucideSave v-else class="w-3.5 h-3.5" />
          <span>{{ isSaving ? 'Saving Changes...' : 'Save Profile' }}</span>
        </button>
      </div>
    </form>

    <!-- Modal: OTP Verification for Email or Phone -->
    <div
      v-if="showVerifyModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
    >
      <div class="w-full max-w-sm rounded-3xl glass-card p-6 border border-white/20 shadow-2xl space-y-5">
        <div class="flex items-center justify-between border-b border-white/[0.08] pb-3">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300">
              <LucideSmartphone v-if="verifyType === 'phone'" class="w-4 h-4" />
              <LucideMail v-else class="w-4 h-4" />
            </div>
            <div>
              <h3 class="text-sm font-bold text-white">
                Verify {{ verifyType === 'phone' ? 'Phone Number' : 'Email Address' }}
              </h3>
              <p class="text-[11px] text-slate-400">One-time passcode verification</p>
            </div>
          </div>
          <button @click="showVerifyModal = false" class="text-slate-400 hover:text-white transition cursor-pointer">
            <LucideX class="w-4 h-4" />
          </button>
        </div>

        <div v-if="verifySuccessMsg" class="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-200 text-xs">
          {{ verifySuccessMsg }}
        </div>

        <div v-if="verifyErrorMsg" class="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-200 text-xs">
          {{ verifyErrorMsg }}
        </div>

        <!-- Step 1: Send OTP -->
        <div v-if="!verifyOtpSent" class="space-y-4">
          <div class="space-y-1">
            <p class="text-xs text-slate-300">
              We will send a 6-digit verification code to:
            </p>
            <p class="text-xs font-mono font-semibold text-white bg-white/[0.05] p-2 rounded-xl border border-white/10">
              {{ verifyValue }}
            </p>
          </div>

          <button
            @click="sendVerificationOtp"
            :disabled="isVerifying"
            type="button"
            class="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <LucideLoader2 v-if="isVerifying" class="w-3.5 h-3.5 animate-spin" />
            <LucideSend v-else class="w-3.5 h-3.5" />
            <span>Send Verification OTP</span>
          </button>
        </div>

        <!-- Step 2: Confirm OTP -->
        <div v-else class="space-y-4">
          <div class="space-y-1.5">
            <label class="block text-xs font-medium text-slate-300 text-center">Enter 6-Digit Code</label>
            <input
              v-model="verifyCode"
              type="text"
              inputmode="numeric"
              maxlength="6"
              placeholder="000000"
              class="w-full px-4 py-2.5 text-center font-mono text-lg tracking-[0.25em] rounded-xl glass-input text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <button
            @click="confirmVerificationOtp"
            :disabled="isVerifying || verifyCode.trim().length !== 6"
            type="button"
            class="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <LucideLoader2 v-if="isVerifying" class="w-3.5 h-3.5 animate-spin" />
            <LucideCheck class="w-3.5 h-3.5" />
            <span>Confirm & Verify</span>
          </button>

          <div class="text-center">
            <button
              v-if="verifyCooldown <= 0"
              @click="sendVerificationOtp"
              :disabled="isVerifying"
              type="button"
              class="text-[11px] text-indigo-300 hover:text-white underline transition cursor-pointer"
            >
              Resend verification code
            </button>
            <span v-else class="text-[11px] text-slate-400">
              Resend in {{ verifyCooldown }}s
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { User } from '~/composables/useAuth'

const props = defineProps<{
  user?: User | null
}>()

const emit = defineEmits<{
  (e: 'notify', payload: { type: 'success' | 'error'; message: string }): void
}>()

const api = useApi()
const { user: authUser, fetchUser } = useAuth()

const profileForm = reactive({
  name: props.user?.name || '',
  email: props.user?.email || '',
  phone: props.user?.phone || '',
})

watch(() => props.user, (u) => {
  if (u) {
    profileForm.name = u.name || ''
    profileForm.email = u.email || ''
    profileForm.phone = u.phone || ''
  }
}, { immediate: true })

const isSaving = ref(false)

// Verification Modal State
const showVerifyModal = ref(false)
const verifyType = ref<'email' | 'phone'>('email')
const verifyValue = ref('')
const verifyCode = ref('')
const verifyOtpSent = ref(false)
const isVerifying = ref(false)
const verifyErrorMsg = ref('')
const verifySuccessMsg = ref('')
const verifyCooldown = ref(0)
let verifyTimer: any = null

function openVerifyModal(type: 'email' | 'phone', val: string) {
  if (!val.trim()) {
    emit('notify', {
      type: 'error',
      message: `Please enter a valid ${type === 'phone' ? 'phone number' : 'email address'} first.`,
    })
    return
  }
  verifyType.value = type
  verifyValue.value = val.trim()
  verifyCode.value = ''
  verifyOtpSent.value = false
  verifyErrorMsg.value = ''
  verifySuccessMsg.value = ''
  showVerifyModal.value = true
}

async function sendVerificationOtp() {
  isVerifying.value = true
  verifyErrorMsg.value = ''
  verifySuccessMsg.value = ''

  try {
    const res = await api.post<any>('/api/v1/auth/otp/send', {
      identifier: verifyValue.value,
    })

    verifyOtpSent.value = true
    verifyCooldown.value = res?.cooldownSeconds || 60
    if (res?.otp) {
      verifySuccessMsg.value = `Verification code sent! (Dev code: ${res.otp})`
    } else {
      verifySuccessMsg.value = `Verification code sent to ${verifyValue.value}`
    }

    if (verifyTimer) clearInterval(verifyTimer)
    verifyTimer = setInterval(() => {
      if (verifyCooldown.value > 0) {
        verifyCooldown.value--
      } else {
        clearInterval(verifyTimer)
      }
    }, 1000)
  } catch (err: any) {
    verifyErrorMsg.value = err?.data?.statusMessage || err?.data?.message || 'Failed to send OTP'
  } finally {
    isVerifying.value = false
  }
}

async function confirmVerificationOtp() {
  if (verifyCode.value.trim().length !== 6) return
  isVerifying.value = true
  verifyErrorMsg.value = ''

  try {
    const res = await api.post<any>('/api/v1/auth/verify-contact', {
      type: verifyType.value,
      value: verifyValue.value,
      code: verifyCode.value.trim(),
    })

    await fetchUser()

    showVerifyModal.value = false
    emit('notify', {
      type: 'success',
      message: res?.message || `${verifyType.value === 'phone' ? 'Phone number' : 'Email address'} verified successfully!`,
    })
  } catch (err: any) {
    verifyErrorMsg.value = err?.data?.statusMessage || err?.data?.message || 'Invalid or expired OTP code'
  } finally {
    isVerifying.value = false
  }
}

async function handleSaveProfile() {
  if (!profileForm.name.trim()) {
    emit('notify', {
      type: 'error',
      message: 'Name cannot be empty.',
    })
    return
  }

  isSaving.value = true
  try {
    const res = await api.put<any>('/api/v1/auth/me', {
      name: profileForm.name.trim(),
      email: profileForm.email?.trim() || '',
      phone: profileForm.phone?.trim() || '',
    })

    if (res?.user) {
      authUser.value = { ...authUser.value, ...res.user }
    }

    emit('notify', {
      type: 'success',
      message: res?.message || 'Profile information saved successfully!',
    })
  } catch (err: any) {
    emit('notify', {
      type: 'error',
      message: err?.data?.statusMessage || err?.data?.message || err?.message || 'Failed to update profile.',
    })
  } finally {
    isSaving.value = false
  }
}
</script>
