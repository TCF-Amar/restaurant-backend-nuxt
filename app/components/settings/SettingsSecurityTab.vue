<template>
  <div class="rounded-3xl glass-card p-6 sm:p-8 border border-white/10 space-y-6">
    <!-- Password & Authentication Header -->
    <div class="border-b border-white/[0.08] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div>
        <h2 class="text-lg font-bold text-white">Password & Authentication</h2>
        <p class="text-xs text-slate-400">Update your account credentials using your current password or verification code.</p>
      </div>

      <!-- Mode Selector Tabs -->
      <div class="flex items-center gap-1 p-1 rounded-xl bg-white/[0.04] border border-white/10 text-xs self-start sm:self-auto">
        <button type="button" @click="passwordMode = 'current'" :class="[
          'px-3 py-1.5 rounded-lg font-medium transition cursor-pointer',
          passwordMode === 'current'
            ? 'bg-indigo-600 text-white shadow-md'
            : 'text-slate-400 hover:text-white'
        ]">
          Current Password
        </button>
        <button type="button" @click="passwordMode = 'otp'" :class="[
          'px-3 py-1.5 rounded-lg font-medium transition cursor-pointer flex items-center gap-1.5',
          passwordMode === 'otp'
            ? 'bg-purple-600 text-white shadow-md'
            : 'text-slate-400 hover:text-white'
        ]">
          <LucideKeyRound class="w-3.5 h-3.5" />
          <span>Forgot / Verify via OTP</span>
        </button>
      </div>
    </div>

    <!-- Password Change Form -->
    <form @submit.prevent="handleChangePassword" class="space-y-4 max-w-lg">
      <!-- Mode 1: Current Password -->
      <div v-if="passwordMode === 'current'" class="space-y-1.5">
        <div class="flex items-center justify-between">
          <label class="block text-xs font-medium text-slate-300">Current Password</label>
          <button type="button" @click="passwordMode = 'otp'"
            class="text-[11px] text-purple-400 hover:text-purple-300 transition cursor-pointer">
            Forgot current password?
          </button>
        </div>
        <input v-model="passwordForm.currentPassword" type="password" required
          placeholder="Enter current password"
          class="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50" />
      </div>

      <!-- Mode 2: Verify via OTP -->
      <div v-else-if="passwordMode === 'otp'"
        class="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 space-y-3">
        <div class="flex items-center justify-between gap-2">
          <div class="text-xs">
            <span class="text-slate-300 font-medium">Verify via OTP</span>
            <p class="text-[11px] text-purple-200 mt-0.5">
              Code will be sent to: <strong class="text-white">{{ userIdentifier }}</strong>
            </p>
          </div>
          <button type="button" @click="handleSendSettingsOtp" :disabled="isSendingOtp || otpCooldown > 0"
            class="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md transition cursor-pointer flex items-center gap-1.5 shrink-0">
            <LucideLoader2 v-if="isSendingOtp" class="w-3 h-3 animate-spin" />
            <LucideSend v-else class="w-3 h-3" />
            <span>{{ otpCooldown > 0 ? `Resend (${otpCooldown}s)` : 'Send Code' }}</span>
          </button>
        </div>

        <!-- Demo code alert in dev -->
        <div v-if="otpDebugCode"
          class="p-2 rounded-xl bg-purple-500/20 border border-purple-500/30 text-[11px] text-purple-200 flex items-center justify-between font-mono">
          <span>Demo Verification Code:</span>
          <span class="font-bold text-amber-300 tracking-wider">{{ otpDebugCode }}</span>
        </div>

        <div class="space-y-1.5">
          <label class="block text-xs font-medium text-slate-300">Enter 6-Digit Code *</label>
          <input v-model="passwordForm.otpCode" type="text" maxlength="6" required placeholder="123456"
            class="w-full tracking-widest font-mono text-center px-3.5 py-2.5 rounded-xl glass-input text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500/50" />
        </div>
      </div>

      <!-- New Password -->
      <div class="space-y-1.5">
        <label class="block text-xs font-medium text-slate-300">New Password</label>
        <input v-model="passwordForm.newPassword" type="password" required minlength="8"
          placeholder="Minimum 8 characters"
          class="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50" />
      </div>

      <!-- Confirm New Password -->
      <div class="space-y-1.5">
        <label class="block text-xs font-medium text-slate-300">Confirm New Password</label>
        <input v-model="passwordForm.confirmPassword" type="password" required placeholder="Re-enter new password"
          class="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50" />
      </div>

      <div class="pt-2 flex items-center justify-between">
        <button type="submit" :disabled="isChangingPassword"
          class="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 border border-indigo-400/40 text-white text-xs font-semibold backdrop-blur-md shadow-lg transition active:scale-95 cursor-pointer disabled:opacity-50 flex items-center gap-2">
          <LucideLoader2 v-if="isChangingPassword" class="w-3.5 h-3.5 animate-spin" />
          <LucideSave v-else class="w-3.5 h-3.5" />
          <span>{{ isChangingPassword ? 'Updating Password...' : 'Save Password & Sign Out' }}</span>
        </button>
      </div>
      <p class="text-[11px] text-slate-400 leading-relaxed">
        * For security, changing your password will immediately end all active sessions and require you to sign back in.
      </p>
    </form>

    <!-- ========================================== -->
    <!-- 2FA Authenticator App Section -->
    <!-- ========================================== -->
    <div class="pt-6 border-t border-white/[0.08] space-y-4">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div class="space-y-1">
          <div class="flex items-center gap-2">
            <h3 class="text-sm font-bold text-white flex items-center gap-2">
              <LucideQrCode class="w-4 h-4 text-indigo-400" />
              <span>Authenticator App (2FA)</span>
            </h3>
            <span :class="[
              'px-2 py-0.5 rounded-full text-[10px] font-semibold border',
              twoFactorEnabled
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                : 'bg-slate-500/20 text-slate-400 border-slate-500/30'
            ]">
              {{ twoFactorEnabled ? 'Enabled' : 'Disabled' }}
            </span>
          </div>
          <p class="text-[11px] text-slate-400">
            Protect your account with Google Authenticator, Microsoft Authenticator, or Authy.
          </p>
        </div>

        <div>
          <button v-if="!twoFactorEnabled" type="button" @click="open2faSetup"
            class="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 border border-indigo-400/30 transition cursor-pointer flex items-center gap-2">
            <LucideShieldCheck class="w-3.5 h-3.5" />
            <span>Set Up Authenticator</span>
          </button>
          <button v-else type="button" @click="show2faDisableModal = true"
            class="px-4 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 text-rose-300 text-xs font-semibold transition cursor-pointer flex items-center gap-2">
            <LucideShieldAlert class="w-3.5 h-3.5" />
            <span>Disable 2FA</span>
          </button>
        </div>
      </div>
    </div>

    <!-- ========================================== -->
    <!-- Passkeys (Biometric / FIDO2) Section -->
    <!-- ========================================== -->
    <div class="pt-6 border-t border-white/[0.08] space-y-4">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div class="space-y-1">
          <div class="flex items-center gap-2">
            <h3 class="text-sm font-bold text-white flex items-center gap-2">
              <LucideFingerprint class="w-4 h-4 text-purple-400" />
              <span>Passkeys & Biometrics</span>
            </h3>
            <span
              class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
              FIDO2 / WebAuthn
            </span>
          </div>
          <p class="text-[11px] text-slate-400">
            Sign in instantly using Touch ID, Face ID, Windows Hello, or physical security keys.
          </p>
        </div>

        <button type="button" @click="openAddPasskeyModal"
          class="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-purple-600/30 border border-purple-400/30 transition cursor-pointer flex items-center gap-2 self-start sm:self-auto shrink-0">
          <LucidePlus class="w-3.5 h-3.5" />
          <span>Add Passkey</span>
        </button>
      </div>

      <!-- List of Registered Passkeys -->
      <div v-if="isLoadingPasskeys" class="py-6 flex items-center justify-center text-slate-400 text-xs gap-2">
        <LucideLoader2 class="w-4 h-4 animate-spin text-purple-400" />
        <span>Loading registered passkeys...</span>
      </div>

      <div v-else-if="passkeys.length === 0"
        class="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-center space-y-2">
        <div
          class="w-10 h-10 mx-auto rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
          <LucideKey class="w-5 h-5" />
        </div>
        <p class="text-xs font-medium text-white">No Passkeys Registered</p>
        <p class="text-[11px] text-slate-400 max-w-sm mx-auto">
          Add a passkey to skip password prompts and log in seamlessly using your device biometrics.
        </p>
      </div>

      <div v-else class="space-y-2.5">
        <div v-for="pk in passkeys" :key="pk.id"
          class="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-between gap-3 hover:bg-white/[0.05] transition">
          <div class="flex items-center gap-3">
            <div class="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300">
              <LucideFingerprint class="w-5 h-5" />
            </div>
            <div class="space-y-0.5">
              <p class="text-xs font-semibold text-white flex items-center gap-2">
                <span>{{ pk.name }}</span>
                <span
                  class="px-2 py-0.5 rounded-full text-[9px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {{ pk.deviceType === 'singleDevice' ? 'Single Device' : 'Synced / Multi' }}
                </span>
              </p>
              <p class="text-[11px] text-slate-400">
                Added {{ new Date(pk.createdAt).toLocaleDateString() }}
                <span v-if="pk.lastUsedAt"> • Last used {{ new Date(pk.lastUsedAt).toLocaleDateString() }}</span>
                <span v-else> • Never used yet</span>
              </p>
            </div>
          </div>

          <button type="button" @click="handleDeletePasskey(pk.id, pk.name)"
            :disabled="deletingPasskeyId === pk.id"
            class="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
            title="Remove passkey">
            <LucideLoader2 v-if="deletingPasskeyId === pk.id" class="w-4 h-4 animate-spin text-rose-400" />
            <LucideTrash2 v-else class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

    <!-- ========================================== -->
    <!-- MODALS: 2FA Setup, 2FA Disable, Add Passkey -->
    <!-- ========================================== -->
    <!-- 2FA Setup Modal -->
    <div v-if="show2faSetupModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <div
        class="w-full max-w-md rounded-3xl glass-card p-6 border border-white/20 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <div class="p-2 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              <LucideQrCode class="w-5 h-5" />
            </div>
            <div>
              <h3 class="text-base font-bold text-white">Set Up Authenticator App</h3>
              <p class="text-[11px] text-slate-400">Step-by-step 2FA enrollment</p>
            </div>
          </div>
          <button @click="show2faSetupModal = false"
            class="p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer">
            <LucideX class="w-4 h-4" />
          </button>
        </div>

        <div v-if="isLoading2faSetup"
          class="py-12 flex flex-col items-center justify-center gap-3 text-slate-300 text-xs">
          <LucideLoader2 class="w-6 h-6 animate-spin text-indigo-400" />
          <span>Generating QR code and 2FA credentials...</span>
        </div>

        <div v-else-if="totpSetupData" class="space-y-4">
          <div class="p-4 rounded-2xl bg-white/[0.04] border border-white/10 text-center space-y-2">
            <p class="text-xs text-slate-300 font-medium">1. Scan with Google Authenticator or Authy</p>
            <div class="inline-block p-3 rounded-2xl bg-white shadow-xl">
              <img :src="totpSetupData.qrCode" alt="2FA QR Code" class="w-44 h-44 mx-auto" />
            </div>
          </div>

          <div class="space-y-1.5">
            <p class="text-[11px] text-slate-400">Can't scan? Enter this code manually in your app:</p>
            <div
              class="flex items-center justify-between p-2.5 rounded-xl bg-black/40 border border-white/10 font-mono text-xs">
              <span class="text-indigo-300 font-semibold tracking-wider select-all">{{ totpSetupData.secret }}</span>
              <button type="button" @click="copySecretToClipboard(totpSetupData.secret)"
                class="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[10px] font-medium transition cursor-pointer flex items-center gap-1 shrink-0">
                <LucideCheck v-if="hasCopiedSecret" class="w-3 h-3 text-emerald-400" />
                <LucideCopy v-else class="w-3 h-3" />
                <span>{{ hasCopiedSecret ? 'Copied' : 'Copy' }}</span>
              </button>
            </div>
          </div>

          <form @submit.prevent="handleEnable2fa" class="space-y-3">
            <div class="space-y-1.5">
              <label class="block text-xs font-medium text-slate-300">2. Enter the 6-digit confirmation code</label>
              <input v-model="totpVerificationCode" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="6"
                required placeholder="000000"
                class="w-full text-center font-mono tracking-[0.25em] text-lg px-3 py-2.5 rounded-xl glass-input text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/50" />
            </div>

            <div class="flex items-center justify-end gap-2 pt-2">
              <button type="button" @click="show2faSetupModal = false"
                class="px-4 py-2 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-white/10 transition cursor-pointer">
                Cancel
              </button>
              <button type="submit" :disabled="isEnabling2fa || totpVerificationCode.trim().length !== 6"
                class="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition cursor-pointer flex items-center gap-1.5">
                <LucideLoader2 v-if="isEnabling2fa" class="w-3.5 h-3.5 animate-spin" />
                <span>{{ isEnabling2fa ? 'Verifying...' : 'Enable 2FA' }}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- 2FA Disable Modal -->
    <div v-if="show2faDisableModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <div
        class="w-full max-w-md rounded-3xl glass-card p-6 border border-white/20 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <div class="p-2 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/30">
              <LucideShieldAlert class="w-5 h-5" />
            </div>
            <div>
              <h3 class="text-base font-bold text-white">Disable Two-Factor Auth</h3>
              <p class="text-[11px] text-slate-400">Confirm with authenticator code or password</p>
            </div>
          </div>
          <button @click="show2faDisableModal = false"
            class="p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer">
            <LucideX class="w-4 h-4" />
          </button>
        </div>

        <form @submit.prevent="handleDisable2fa" class="space-y-4">
          <div class="space-y-1.5">
            <label class="block text-xs font-medium text-slate-300">Authenticator 6-Digit Code</label>
            <input v-model="disable2faCode" type="text" maxlength="6" placeholder="123456"
              class="w-full text-center font-mono tracking-widest px-3 py-2.5 rounded-xl glass-input text-xs text-white focus:outline-none focus:ring-1 focus:ring-rose-500/50" />
          </div>

          <div class="flex items-center gap-3">
            <div class="h-px flex-1 bg-white/10"></div>
            <span class="text-[10px] uppercase tracking-wider text-slate-400">Or using password</span>
            <div class="h-px flex-1 bg-white/10"></div>
          </div>

          <div class="space-y-1.5">
            <label class="block text-xs font-medium text-slate-300">Current Password</label>
            <input v-model="disable2faPassword" type="password" placeholder="Enter current password"
              class="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs text-white focus:outline-none focus:ring-1 focus:ring-rose-500/50" />
          </div>

          <div class="flex items-center justify-end gap-2 pt-2">
            <button type="button" @click="show2faDisableModal = false"
              class="px-4 py-2 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-white/10 transition cursor-pointer">
              Cancel
            </button>
            <button type="submit" :disabled="isDisabling2fa || (!disable2faCode && !disable2faPassword)"
              class="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-semibold shadow-lg shadow-rose-600/30 transition cursor-pointer flex items-center gap-1.5">
              <LucideLoader2 v-if="isDisabling2fa" class="w-3.5 h-3.5 animate-spin" />
              <span>{{ isDisabling2fa ? 'Disabling...' : 'Disable 2FA' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Add Passkey Modal -->
    <div v-if="showAddPasskeyModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <div
        class="w-full max-w-md rounded-3xl glass-card p-6 border border-white/20 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <div class="p-2 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30">
              <LucideFingerprint class="w-5 h-5" />
            </div>
            <div>
              <h3 class="text-base font-bold text-white">Register Passkey</h3>
              <p class="text-[11px] text-slate-400">Use Touch ID, Face ID, or Windows Hello</p>
            </div>
          </div>
          <button @click="showAddPasskeyModal = false"
            class="p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer">
            <LucideX class="w-4 h-4" />
          </button>
        </div>

        <form @submit.prevent="handleRegisterPasskey" class="space-y-4">
          <div class="space-y-1.5">
            <label class="block text-xs font-medium text-slate-300">Device / Passkey Friendly Name</label>
            <input v-model="newPasskeyName" type="text" required placeholder="e.g. MacBook Pro Touch ID, Windows Hello"
              class="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs text-white focus:outline-none focus:ring-1 focus:ring-purple-500/50" />
            <p class="text-[11px] text-slate-400">
              A label to easily identify this device in your security settings.
            </p>
          </div>

          <div
            class="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-200 flex items-center gap-2.5">
            <LucideShield class="w-4 h-4 text-purple-300 shrink-0" />
            <span>When you click continue, your browser will prompt you to authenticate with your biometric sensor or PIN.</span>
          </div>

          <div class="flex items-center justify-end gap-2 pt-2">
            <button type="button" @click="showAddPasskeyModal = false"
              class="px-4 py-2 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-white/10 transition cursor-pointer">
              Cancel
            </button>
            <button type="submit" :disabled="isRegisteringPasskey || !newPasskeyName.trim()"
              class="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white text-xs font-semibold shadow-lg shadow-purple-600/30 transition cursor-pointer flex items-center gap-1.5">
              <LucideLoader2 v-if="isRegisteringPasskey" class="w-3.5 h-3.5 animate-spin" />
              <span>{{ isRegisteringPasskey ? 'Waiting for Biometrics...' : 'Continue to Register' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { User } from '~/composables/useAuth'

const props = defineProps<{
  user?: User | null
  userIdentifier?: string
}>()

const emit = defineEmits<{
  (e: 'notify', payload: { type: 'success' | 'error'; message: string }): void
}>()

const userIdentifier = computed(() => props.user?.email || props.user?.phone || props.userIdentifier || '')

const { logout } = useAuth()
const api = useApi()

// Password Form State
const passwordMode = ref<'current' | 'otp'>('current')
const passwordForm = reactive({
  currentPassword: '',
  otpCode: '',
  newPassword: '',
  confirmPassword: '',
})
const isChangingPassword = ref(false)
const isSendingOtp = ref(false)
const otpDebugCode = ref('')
const otpCooldown = ref(0)
let otpTimer: any = null

function startOtpCooldown(seconds = 60) {
  otpCooldown.value = seconds
  clearInterval(otpTimer)
  otpTimer = setInterval(() => {
    if (otpCooldown.value > 0) {
      otpCooldown.value--
    } else {
      clearInterval(otpTimer)
    }
  }, 1000)
}

onUnmounted(() => {
  clearInterval(otpTimer)
})

async function handleSendSettingsOtp() {
  const identifier = userIdentifier.value
  if (!identifier) {
    emit('notify', {
      type: 'error',
      message: 'No registered email or phone found on your profile to send code.',
    })
    return
  }

  isSendingOtp.value = true
  otpDebugCode.value = ''
  try {
    const res = await api.post<any>('/api/v1/auth/password/forgot', { identifier })
    emit('notify', {
      type: 'success',
      message: res.message || 'Verification code dispatched to your email.',
    })
    })
    if (res.debugOtp) {
      otpDebugCode.value = res.debugOtp
    }
    startOtpCooldown(res.cooldownSeconds || 60)
  } catch (err: any) {
    emit('notify', {
      type: 'error',
      message: err?.data?.statusMessage || err?.data?.message || err?.message || 'Failed to dispatch verification code.',
    })
  } finally {
    isSendingOtp.value = false
  }
}

async function handleChangePassword() {
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    emit('notify', {
      type: 'error',
      message: 'New password and confirmation password do not match.',
    })
    return
  }

  if (passwordMode.value === 'current' && !passwordForm.currentPassword) {
    emit('notify', {
      type: 'error',
      message: 'Please enter your current password.',
    })
    return
  }

  if (passwordMode.value === 'otp' && (!passwordForm.otpCode || passwordForm.otpCode.trim().length !== 6)) {
    emit('notify', {
      type: 'error',
      message: 'Please enter the 6-digit verification code.',
    })
    return
  }

  isChangingPassword.value = true
  try {
    await api.post('/api/v1/auth/password/change', {
      currentPassword: passwordMode.value === 'current' ? passwordForm.currentPassword : undefined,
      otpCode: passwordMode.value === 'otp' ? passwordForm.otpCode.trim() : undefined,
      newPassword: passwordForm.newPassword,
      confirmPassword: passwordForm.confirmPassword,
    })
    emit('notify', {
      type: 'success',
      message: 'Password updated successfully! Logging you out for security...',
    })

    setTimeout(async () => {
      await logout('/login?passwordChanged=true')
    }, 1200)
  } catch (err: any) {
    emit('notify', {
      type: 'error',
      message: err?.data?.statusMessage || err?.data?.message || err?.message || 'Failed to update password.',
    })
    isChangingPassword.value = false
  }
}

// 2FA Authenticator App State
const twoFactorEnabled = ref(false)
const show2faSetupModal = ref(false)
const show2faDisableModal = ref(false)
const isLoading2faSetup = ref(false)
const totpSetupData = ref<{ secret: string; qrCode: string; uri: string } | null>(null)
const totpVerificationCode = ref('')
const isEnabling2fa = ref(false)
const hasCopiedSecret = ref(false)
const disable2faCode = ref('')
const disable2faPassword = ref('')
const isDisabling2fa = ref(false)

async function open2faSetup() {
  show2faSetupModal.value = true
  isLoading2faSetup.value = true
  totpVerificationCode.value = ''
  hasCopiedSecret.value = false

  try {
    const res = await api.post<any>('/api/v1/auth/2fa/setup')
    totpSetupData.value = res
  } catch (err: any) {
    show2faSetupModal.value = false
    emit('notify', {
      type: 'error',
      message: err?.data?.statusMessage || err?.data?.message || 'Failed to initialize 2FA setup.',
    })
  } finally {
    isLoading2faSetup.value = false
  }
}

function copySecretToClipboard(text: string) {
  if (!text) return
  navigator.clipboard.writeText(text)
  hasCopiedSecret.value = true
  setTimeout(() => {
    hasCopiedSecret.value = false
  }, 2500)
}

async function handleEnable2fa() {
  if (totpVerificationCode.value.trim().length !== 6) return
  isEnabling2fa.value = true

  try {
    const res = await api.post<any>('/api/v1/auth/2fa/enable', {
      code: totpVerificationCode.value.trim(),
    })
    twoFactorEnabled.value = true
    show2faSetupModal.value = false
    totpVerificationCode.value = ''
    emit('notify', {
      type: 'success',
      message: res.message || 'Two-factor authentication successfully enabled!',
    })
  } catch (err: any) {
    emit('notify', {
      type: 'error',
      message: err?.data?.statusMessage || err?.data?.message || 'Invalid confirmation code. Please try again.',
    })
  } finally {
    isEnabling2fa.value = false
  }
}

async function handleDisable2fa() {
  if (!disable2faCode.value && !disable2faPassword.value) return
  isDisabling2fa.value = true

  try {
    const res = await api.post<any>('/api/v1/auth/2fa/disable', {
      code: disable2faCode.value ? disable2faCode.value.trim() : undefined,
      password: disable2faPassword.value || undefined,
    })
    twoFactorEnabled.value = false
    show2faDisableModal.value = false
    disable2faCode.value = ''
    disable2faPassword.value = ''
    emit('notify', {
      type: 'success',
      message: res.message || 'Two-factor authentication disabled.',
    })
  } catch (err: any) {
    emit('notify', {
      type: 'error',
      message: err?.data?.statusMessage || err?.data?.message || 'Failed to disable 2FA.',
    })
  } finally {
    isDisabling2fa.value = false
  }
}

// Passkeys (FIDO2 / WebAuthn) State
const passkeys = ref<any[]>([])
const isLoadingPasskeys = ref(false)
const showAddPasskeyModal = ref(false)
const newPasskeyName = ref('')
const isRegisteringPasskey = ref(false)
const deletingPasskeyId = ref<string | null>(null)

async function loadPasskeysAnd2FA() {
  isLoadingPasskeys.value = true
  try {
    const res = await api.get<any>('/api/v1/auth/passkey/list')
    passkeys.value = res.passkeys || []
    twoFactorEnabled.value = res.twoFactorEnabled ?? false
  } catch (err: any) {
    console.error('[Passkey] Failed to load passkeys:', err)
  } finally {
    isLoadingPasskeys.value = false
  }
}

function openAddPasskeyModal() {
  newPasskeyName.value = 'My Device'
  showAddPasskeyModal.value = true
}

async function handleRegisterPasskey() {
  if (!newPasskeyName.value.trim()) return
  isRegisteringPasskey.value = true

  try {
    const { startRegistration, browserSupportsWebAuthn } = await import('@simplewebauthn/browser')

    if (!browserSupportsWebAuthn()) {
      emit('notify', {
        type: 'error',
        message: 'Your browser does not support Passkey / WebAuthn.',
      })
      showAddPasskeyModal.value = false
      return
    }

    const options = await api.post<any>('/api/v1/auth/passkey/register/options')
    const regResponse = await startRegistration({ optionsJSON: options })
    const res = await api.post<any>('/api/v1/auth/passkey/register/verify', {
      response: regResponse,
      name: newPasskeyName.value.trim(),
    })

    showAddPasskeyModal.value = false
    newPasskeyName.value = ''
    emit('notify', {
      type: 'success',
      message: res.message || 'Passkey registered successfully!',
    })

    await loadPasskeysAnd2FA()
  } catch (err: any) {
    console.error('[Passkey:Register]', err)
    if (err.name === 'NotAllowedError') {
      emit('notify', {
        type: 'error',
        message: 'Passkey registration was canceled or timed out.',
      })
    } else {
      emit('notify', {
        type: 'error',
        message: err?.data?.statusMessage || err?.data?.message || err?.message || 'Failed to register passkey.',
      })
    }
  } finally {
    isRegisteringPasskey.value = false
  }
}

async function handleDeletePasskey(id: string, name: string) {
  if (!confirm(`Are you sure you want to remove the passkey "${name}"?`)) return
  deletingPasskeyId.value = id

  try {
    await api.delete(`/api/v1/auth/passkey/${id}`)
    emit('notify', {
      type: 'success',
      message: `Passkey "${name}" removed.`,
    })
    passkeys.value = passkeys.value.filter((p) => p.id !== id)
  } catch (err: any) {
    emit('notify', {
      type: 'error',
      message: err?.data?.statusMessage || err?.data?.message || 'Failed to remove passkey.',
    })
  } finally {
    deletingPasskeyId.value = null
  }
}

onMounted(() => {
  loadPasskeysAnd2FA()
})
</script>
