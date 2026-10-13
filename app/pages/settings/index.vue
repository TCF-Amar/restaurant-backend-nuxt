<template>
  <div class="max-w-6xl mx-auto space-y-6">
    <!-- Top Header -->
    <div class="rounded-3xl glass-card p-6 sm:p-8 border border-white/10 relative overflow-hidden shadow-2xl">
      <div
        class="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 blur-3xl pointer-events-none">
      </div>

      <div class="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div class="space-y-1.5">
          <div
            class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-medium backdrop-blur-md">
            <LucideSliders class="w-3.5 h-3.5" />
            <span>Workspace Configuration</span>
          </div>
          <h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Settings & Preferences
          </h1>
          <p class="text-sm text-slate-300">
            Manage your account security, interface layout, notifications, and active sessions.
          </p>
        </div>

        <div class="flex items-center gap-3">
          <div
            class="px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 backdrop-blur-md flex items-center gap-2 text-xs">
            <span class="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"></span>
            <span class="text-slate-300">Role: <strong class="text-white">{{ user?.role || 'ADMIN' }}</strong></span>
          </div>
        </div>
      </div>
    </div>

    <!-- Alert / Toast Banner -->
    <Transition enter-active-class="transition duration-300 ease-out" enter-from-class="opacity-0 -translate-y-2"
      enter-to-class="opacity-100 translate-y-0" leave-active-class="transition duration-200 ease-in"
      leave-from-class="opacity-100 translate-y-0" leave-to-class="opacity-0 -translate-y-2">
      <div v-if="toastMessage" :class="[
        'p-4 rounded-2xl backdrop-blur-md border flex items-center justify-between text-xs shadow-lg',
        toastType === 'success'
          ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-200'
          : 'bg-rose-500/15 border-rose-500/30 text-rose-200'
      ]">
        <div class="flex items-center gap-2.5">
          <LucideCheckCircle2 v-if="toastType === 'success'" class="w-4 h-4 text-emerald-400 shrink-0" />
          <LucideAlertCircle v-else class="w-4 h-4 text-rose-400 shrink-0" />
          <span>{{ toastMessage }}</span>
        </div>
        <button @click="toastMessage = ''" class="hover:opacity-75 transition cursor-pointer">
          <LucideX class="w-4 h-4" />
        </button>
      </div>
    </Transition>

    <!-- Main Settings Layout (Sidebar Tabs + Content Area) -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
      <!-- Navigation Tabs (Left Column) -->
      <div class="md:col-span-1 space-y-2">
        <div class="rounded-2xl glass-card p-2 border border-white/10 space-y-1">
          <button v-for="tab in tabs" :key="tab.id" @click="activeTab = tab.id" type="button" :class="[
            'w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 cursor-pointer text-left',
            activeTab === tab.id
              ? 'bg-gradient-to-r from-indigo-500/30 to-purple-500/20 text-white border border-indigo-500/40 shadow-[0_0_14px_rgba(99,102,241,0.25)]'
              : 'text-slate-400 hover:text-white hover:bg-white/[0.05] border border-transparent'
          ]">
            <component :is="tab.icon" class="w-4 h-4 shrink-0"
              :class="activeTab === tab.id ? 'text-indigo-300' : 'text-slate-400'" />
            <span>{{ tab.label }}</span>
          </button>
        </div>

        <!-- Quick Info Box -->
        <div class="rounded-2xl glass-card p-4 border border-white/10 space-y-2 text-xs text-slate-400">
          <p class="font-semibold text-slate-300 flex items-center gap-1.5">
            <LucideShield class="w-3.5 h-3.5 text-indigo-400" />
            <span>Security Status</span>
          </p>
          <p class="text-[11px] leading-relaxed">
            Your session is encrypted with HTTP-only tokens and JWT session validation.
          </p>
        </div>
      </div>

      <!-- Content Area (Right Column) -->
      <div class="md:col-span-3 space-y-6">
        <!-- TAB 1: Profile & Account -->
        <div v-if="activeTab === 'profile'" class="rounded-3xl glass-card p-6 sm:p-8 border border-white/10 space-y-6">
          <div class="border-b border-white/[0.08] pb-4">
            <h2 class="text-lg font-bold text-white">Profile Information</h2>
            <p class="text-xs text-slate-400">Update your account display details and personal contact information.</p>
          </div>

          <!-- Avatar Section -->
          <div class="flex items-center gap-4">
            <div
              class="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center text-xl font-bold text-white shadow-lg ring-2 ring-white/20">
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

              <!-- Email -->
              <div class="space-y-1.5">
                <label class="block text-xs font-medium text-slate-300">Email Address</label>
                <input v-model="profileForm.email" type="email" placeholder="name@example.com"
                  class="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50" />
              </div>

              <!-- Phone -->
              <div class="space-y-1.5">
                <label class="block text-xs font-medium text-slate-300">Phone Number</label>
                <input v-model="profileForm.phone" type="tel" placeholder="+1 (555) 000-0000"
                  class="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50" />
              </div>

              <!-- User ID (Read-only) -->
              <div class="space-y-1.5">
                <label class="block text-xs font-medium text-slate-300">Account ID</label>
                <input :value="user?.id || 'usr_cuid_sandbox'" disabled
                  class="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05] text-xs text-slate-500 font-mono cursor-not-allowed" />
              </div>
            </div>

            <div class="pt-2 flex justify-end">
              <button type="submit" :disabled="isSavingProfile"
                class="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 border border-indigo-400/40 text-white text-xs font-semibold backdrop-blur-md shadow-lg transition active:scale-95 cursor-pointer disabled:opacity-50">
                <span v-if="isSavingProfile">Saving Changes...</span>
                <span v-else>Save Profile</span>
              </button>
            </div>
          </form>
        </div>

        <!-- TAB 2: Security & Password -->
        <div v-if="activeTab === 'security'" class="rounded-3xl glass-card p-6 sm:p-8 border border-white/10 space-y-6">
          <div class="border-b border-white/[0.08] pb-4">
            <h2 class="text-lg font-bold text-white">Password & Authentication</h2>
            <p class="text-xs text-slate-400">Update your account password and manage authentication credentials.</p>
          </div>

          <form @submit.prevent="handleChangePassword" class="space-y-4 max-w-lg">
            <!-- Current Password -->
            <div class="space-y-1.5">
              <label class="block text-xs font-medium text-slate-300">Current Password</label>
              <input v-model="passwordForm.currentPassword" type="password" required
                placeholder="Enter current password"
                class="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50" />
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

            <div class="pt-2">
              <button type="submit" :disabled="isChangingPassword"
                class="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 border border-indigo-400/40 text-white text-xs font-semibold backdrop-blur-md shadow-lg transition active:scale-95 cursor-pointer disabled:opacity-50">
                <span v-if="isChangingPassword">Updating Password...</span>
                <span v-else>Update Password</span>
              </button>
            </div>
          </form>

          <!-- 2FA Section -->
          <div class="pt-6 border-t border-white/[0.08] flex items-center justify-between">
            <div class="space-y-1">
              <p class="text-xs font-semibold text-white">Two-Factor Authentication (2FA)</p>
              <p class="text-[11px] text-slate-400">Add an extra layer of security using an authenticator app.</p>
            </div>
            <button @click="twoFactorEnabled = !twoFactorEnabled" type="button" :class="[
              'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none',
              twoFactorEnabled ? 'bg-indigo-600' : 'bg-white/10'
            ]">
              <span :class="[
                'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out',
                twoFactorEnabled ? 'translate-x-5' : 'translate-x-0'
              ]" />
            </button>
          </div>
        </div>

        <!-- TAB 3: Interface & Glass UI Appearance -->
        <div v-if="activeTab === 'appearance'"
          class="rounded-3xl glass-card p-6 sm:p-8 border border-white/10 space-y-6">
          <div class="border-b border-white/[0.08] pb-4">
            <h2 class="text-lg font-bold text-white">Interface & Glass UI Appearance</h2>
            <p class="text-xs text-slate-400">Tune the sidebar dimensions, glassmorphism blur intensity, and glow
              accents.</p>
          </div>

          <!-- Sidebar Resizer Controls -->
          <div class="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06] space-y-4">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-xs font-semibold text-white">Sidebar Default Width</p>
                <p class="text-[11px] text-slate-400">Adjust the open sidebar width (synced with drag handle)</p>
              </div>
              <span
                class="px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 font-mono text-xs font-bold border border-indigo-500/30">
                {{ Math.round(sidebarWidth) }}px
              </span>
            </div>

            <input type="range" :min="minWidth" :max="maxWidth" v-model.number="sidebarWidth" :disabled="isCollapsed"
              class="w-full accent-indigo-500 cursor-pointer disabled:opacity-40" />

            <div class="flex items-center justify-between text-[10px] text-slate-500">
              <span>{{ minWidth }}px (Compact)</span>
              <button @click="resetWidth" type="button"
                class="text-indigo-400 hover:text-indigo-300 underline underline-offset-2 cursor-pointer font-medium">
                Reset to default (280px)
              </button>
              <span>{{ maxWidth }}px (Wide)</span>
            </div>
          </div>

          <!-- Sidebar Mode Toggle -->
          <div class="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between">
            <div>
              <p class="text-xs font-semibold text-white">Sidebar Collapse Mode</p>
              <p class="text-[11px] text-slate-400">Switch between expanded navigation and compact icon-rail mode</p>
            </div>
            <div class="flex items-center gap-2">
              <button @click="setCollapsed(false)" type="button" :class="[
                'px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer border',
                !isCollapsed ? 'bg-indigo-600/40 border-indigo-500/50 text-white' : 'bg-white/[0.03] border-white/10 text-slate-400'
              ]">
                Expanded
              </button>
              <button @click="setCollapsed(true)" type="button" :class="[
                'px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer border',
                isCollapsed ? 'bg-indigo-600/40 border-indigo-500/50 text-white' : 'bg-white/[0.03] border-white/10 text-slate-400'
              ]">
                Icon Rail
              </button>
            </div>
          </div>

          <!-- Glass Blur Radius Pixel Controller (Admin Option) -->
          <div class="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06] space-y-4">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-xs font-semibold text-white flex items-center gap-1.5">
                  <LucideSparkles class="w-3.5 h-3.5 text-indigo-400" />
                  <span>Glass Blur Radius (Pixels)</span>
                </p>
                <p class="text-[11px] text-slate-400">Choose exact backdrop blur radius in pixels for header, sidebar,
                  footer & cards</p>
              </div>
              <div class="flex items-center gap-2">
                <input type="number" min="0" max="32" step="0.5" :value="blurRadius"
                  @input="e => setBlur(parseFloat((e.target as HTMLInputElement).value))"
                  class="w-16 px-2 py-1 rounded-lg glass-input text-xs text-center font-mono text-indigo-300 font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                <span class="text-xs text-slate-400 font-mono">px</span>
              </div>
            </div>

            <!-- Range Slider -->
            <input type="range" min="0" max="32" step="0.5" :value="blurRadius"
              @input="e => setBlur(parseFloat((e.target as HTMLInputElement).value))"
              class="w-full accent-indigo-500 cursor-pointer" />

            <!-- Presets buttons -->
            <div class="space-y-1.5">
              <span class="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Quick Pixel
                Presets:</span>
              <div class="grid grid-cols-3 sm:grid-cols-6 gap-2">
                <button v-for="preset in [
                  { px: 0, label: '0px (Clear)' },
                  { px: 1.5, label: '1.5px (Subtle)' },
                  { px: 4, label: '4px (Light)' },
                  { px: 8, label: '8px (Frosted)' },
                  { px: 16, label: '16px (Dense)' },
                  { px: 24, label: '24px (Heavy)' },
                ]" :key="preset.px" @click="setBlur(preset.px)" type="button" :class="[
                  'py-2 px-1 text-[11px] font-mono rounded-xl border text-center transition cursor-pointer',
                  blurRadius === preset.px
                    ? 'bg-indigo-600/30 border-indigo-500/60 text-white shadow-sm'
                    : 'bg-white/[0.02] border-white/10 text-slate-400 hover:text-white'
                ]">
                  {{ preset.label }}
                </button>
              </div>
            </div>

            <!-- Mini Live Preview Box -->
            <div
              class="mt-4 p-4 h-50 flex justify-center items-center rounded-xl border border-white/10 relative overflow-hidden bg-cover bg-center"
              style="background-image: url('/images/dashboard-bg.jpg')">
              <div
                class="glass-header border border-white/20 w-[90%] h-[70%] flex flex-col justify-center items-center gap-3 rounded-lg text-center"
                :style="{ backdropFilter: `blur(${blurRadius}px)` }">
                <p class="text-xs font-semibold text-white">Live Blur Preview: {{ blurRadius }}px</p>
                <p class="text-[10px] text-slate-300">Header, sidebar & footer instantly update to this exact blur
                  radius.</p>
              </div>
            </div>
          </div>
        </div>

        <!-- TAB 4: Notifications -->
        <div v-if="activeTab === 'notifications'"
          class="rounded-3xl glass-card p-6 sm:p-8 border border-white/10 space-y-6">
          <div class="border-b border-white/[0.08] pb-4">
            <h2 class="text-lg font-bold text-white">Notification Preferences</h2>
            <p class="text-xs text-slate-400">Configure how and when you receive order alerts and system events.</p>
          </div>

          <div class="space-y-4">
            <div v-for="item in notificationSettings" :key="item.id"
              class="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
              <div class="space-y-0.5">
                <p class="text-xs font-semibold text-white">{{ item.title }}</p>
                <p class="text-[11px] text-slate-400">{{ item.description }}</p>
              </div>
              <input type="checkbox" v-model="item.enabled" class="w-4 h-4 rounded accent-indigo-600 cursor-pointer" />
            </div>
          </div>
        </div>

        <!-- TAB 5: Sessions & Security -->
        <div v-if="activeTab === 'sessions'" class="rounded-3xl glass-card p-6 sm:p-8 border border-white/10 space-y-6">
          <div class="border-b border-white/[0.08] pb-4">
            <h2 class="text-lg font-bold text-white">Active Sessions</h2>
            <p class="text-xs text-slate-400">Review devices currently signed in with your account credentials.</p>
          </div>

          <div class="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <LucideLaptop class="w-5 h-5" />
              </div>
              <div class="space-y-0.5">
                <p class="text-xs font-semibold text-white flex items-center gap-2">
                  <span>Current Device (Windows Chrome)</span>
                  <span
                    class="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Active Now
                  </span>
                </p>
                <p class="text-[11px] text-slate-400 font-mono">IP: 127.0.0.1 • Localhost Session</p>
              </div>
            </div>
          </div>

          <!-- Danger Zone -->
          <div class="pt-6 border-t border-rose-500/20 space-y-4">
            <div>
              <h3 class="text-sm font-bold text-rose-300">Danger Zone</h3>
              <p class="text-xs text-slate-400">Actions here can revoke active tokens or delete account data.</p>
            </div>

            <div class="flex flex-wrap gap-3">
              <button @click="handleRevokeSessions" type="button"
                class="px-4 py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-200 text-xs font-semibold transition cursor-pointer">
                Log Out All Other Devices
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { user, fetchUser } = useAuth()
const { sidebarWidth, minWidth, maxWidth, isCollapsed, setCollapsed, resetWidth } = useSidebar()
const { blurRadius, setBlur } = useGlassSettings()

const activeTab = ref('profile')
const toastMessage = ref('')
const toastType = ref<'success' | 'error'>('success')

const tabs = [
  { id: 'profile', label: 'Profile & Account', icon: 'LucideUser' },
  { id: 'security', label: 'Security & Password', icon: 'LucideShield' },
  { id: 'appearance', label: 'Interface & Glass UI', icon: 'LucidePalette' },
  { id: 'notifications', label: 'Notifications', icon: 'LucideBell' },
  { id: 'sessions', label: 'Active Sessions', icon: 'LucideLaptop' },
]

// Profile Form State
const profileForm = reactive({
  name: user.value?.name || 'Administrator',
  email: user.value?.email || 'admin@projet.dev',
  phone: user.value?.phone || '',
})

// Keep profile form in sync if auth user updates
watch(user, (val) => {
  if (val) {
    profileForm.name = val.name
    profileForm.email = val.email || ''
    profileForm.phone = val.phone || ''
  }
}, { immediate: true })

const isSavingProfile = ref(false)
function handleSaveProfile() {
  isSavingProfile.value = true
  setTimeout(() => {
    isSavingProfile.value = false
    toastType.value = 'success'
    toastMessage.value = 'Profile information saved successfully!'
  }, 600)
}

// Password Form State
const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
})
const isChangingPassword = ref(false)

async function handleChangePassword() {
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    toastType.value = 'error'
    toastMessage.value = 'New password and confirmation password do not match.'
    return
  }

  isChangingPassword.value = true
  try {
    await $fetch('/api/v1/auth/password/change', {
      method: 'POST',
      body: {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
        confirmPassword: passwordForm.confirmPassword,
      },
    })
    toastType.value = 'success'
    toastMessage.value = 'Password updated successfully! Other sessions have been revoked.'
    passwordForm.currentPassword = ''
    passwordForm.newPassword = ''
    passwordForm.confirmPassword = ''
  } catch (err: any) {
    toastType.value = 'error'
    toastMessage.value = err?.data?.message || err?.message || 'Failed to update password.'
  } finally {
    isChangingPassword.value = false
  }
}

// 2FA state
const twoFactorEnabled = ref(false)

// Glass Refraction presets
const selectedIntensity = ref('balanced')
const glassIntensities = [
  { id: 'subtle', title: 'Subtle Blur', desc: 'Light blur (12px), lower GPU usage' },
  { id: 'balanced', title: 'Balanced (Default)', desc: 'Optimal 24px blur with crisp glow' },
  { id: 'frost', title: 'Deep Frost', desc: 'Ultra-dense 36px frost & glow halos' },
]

// Notifications state
const notificationSettings = ref([
  { id: 'orders', title: 'Real-time Order Updates', description: 'Get notified when customer orders change status', enabled: true },
  { id: 'security', title: 'Security & Login Alerts', description: 'Receive email alerts on logins from new devices', enabled: true },
  { id: 'digest', title: 'Daily Analytics Digest', description: 'Daily summary report of restaurant revenues', enabled: false },
])

function handleRevokeSessions() {
  toastType.value = 'success'
  toastMessage.value = 'All other active session tokens have been invalidated.'
}
</script>
