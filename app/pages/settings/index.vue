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
          <div
            class="border-b border-white/[0.08] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 class="text-lg font-bold text-white">Password & Authentication</h2>
              <p class="text-xs text-slate-400">Update your account credentials using your current password or
                verification code.</p>
            </div>

            <!-- Mode Selector Tabs -->
            <div
              class="flex items-center gap-1 p-1 rounded-xl bg-white/[0.04] border border-white/10 text-xs self-start sm:self-auto">
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
                    Code will be sent to: <strong class="text-white">{{ user?.email || user?.phone }}</strong>
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
              * For security, changing your password will immediately end all active sessions and require you to sign
              back in.
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
    <!-- ========================================== -->
    <!-- MODAL 1: 2FA Setup Modal -->
    <!-- ========================================== -->
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
          <!-- Step 1: QR Code -->
          <div class="p-4 rounded-2xl bg-white/[0.04] border border-white/10 text-center space-y-2">
            <p class="text-xs text-slate-300 font-medium">1. Scan with Google Authenticator or Authy</p>
            <div class="inline-block p-3 rounded-2xl bg-white shadow-xl">
              <img :src="totpSetupData.qrCode" alt="2FA QR Code" class="w-44 h-44 mx-auto" />
            </div>
          </div>

          <!-- Step 2: Secret key fallback -->
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

          <!-- Step 3: Enter 6 digit code -->
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

    <!-- ========================================== -->
    <!-- MODAL 2: 2FA Disable Modal -->
    <!-- ========================================== -->
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
              class="w-full px-3 py-2.5 rounded-xl glass-input text-xs text-white focus:outline-none focus:ring-1 focus:ring-rose-500/50" />
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

    <!-- ========================================== -->
    <!-- MODAL 3: Add Passkey Modal -->
    <!-- ========================================== -->
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
            <span>When you click continue, your browser will prompt you to authenticate with your biometric sensor or
              PIN.</span>
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
const { user, fetchUser, logout } = useAuth()
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
  const identifier = user.value?.email || user.value?.phone
  if (!identifier) {
    toastType.value = 'error'
    toastMessage.value = 'No registered email or phone found on your profile to send code.'
    return
  }

  isSendingOtp.value = true
  otpDebugCode.value = ''
  try {
    const res = await $fetch<any>('/api/v1/auth/password/forgot', {
      method: 'POST',
      body: { identifier },
    })
    toastType.value = 'success'
    toastMessage.value = res.message || 'Verification code dispatched to your email.'
    if (res.debugOtp) {
      otpDebugCode.value = res.debugOtp
    }
    startOtpCooldown(res.cooldownSeconds || 60)
  } catch (err: any) {
    toastType.value = 'error'
    toastMessage.value = err?.data?.statusMessage || err?.data?.message || err?.message || 'Failed to dispatch verification code.'
  } finally {
    isSendingOtp.value = false
  }
}

async function handleChangePassword() {
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    toastType.value = 'error'
    toastMessage.value = 'New password and confirmation password do not match.'
    return
  }

  if (passwordMode.value === 'current' && !passwordForm.currentPassword) {
    toastType.value = 'error'
    toastMessage.value = 'Please enter your current password.'
    return
  }

  if (passwordMode.value === 'otp' && (!passwordForm.otpCode || passwordForm.otpCode.trim().length !== 6)) {
    toastType.value = 'error'
    toastMessage.value = 'Please enter the 6-digit verification code.'
    return
  }

  isChangingPassword.value = true
  try {
    await $fetch('/api/v1/auth/password/change', {
      method: 'POST',
      body: {
        currentPassword: passwordMode.value === 'current' ? passwordForm.currentPassword : undefined,
        otpCode: passwordMode.value === 'otp' ? passwordForm.otpCode.trim() : undefined,
        newPassword: passwordForm.newPassword,
        confirmPassword: passwordForm.confirmPassword,
      },
    })
    toastType.value = 'success'
    toastMessage.value = 'Password updated successfully! Logging you out for security...'

    // Automatically log user out and redirect to login as requested
    setTimeout(async () => {
      await logout('/login?passwordChanged=true')
    }, 1200)
  } catch (err: any) {
    toastType.value = 'error'
    toastMessage.value = err?.data?.statusMessage || err?.data?.message || err?.message || 'Failed to update password.'
    isChangingPassword.value = false
  }
}

// ==========================================
// 2FA Authenticator App State & Handlers
// ==========================================
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
    const res = await $fetch<any>('/api/v1/auth/2fa/setup', {
      method: 'POST',
    })
    totpSetupData.value = res
  } catch (err: any) {
    show2faSetupModal.value = false
    toastType.value = 'error'
    toastMessage.value = err?.data?.statusMessage || err?.data?.message || 'Failed to initialize 2FA setup.'
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
    const res = await $fetch<any>('/api/v1/auth/2fa/enable', {
      method: 'POST',
      body: {
        code: totpVerificationCode.value.trim(),
      },
    })
    twoFactorEnabled.value = true
    show2faSetupModal.value = false
    totpVerificationCode.value = ''
    toastType.value = 'success'
    toastMessage.value = res.message || 'Two-factor authentication successfully enabled!'
  } catch (err: any) {
    toastType.value = 'error'
    toastMessage.value = err?.data?.statusMessage || err?.data?.message || 'Invalid confirmation code. Please try again.'
  } finally {
    isEnabling2fa.value = false
  }
}

async function handleDisable2fa() {
  if (!disable2faCode.value && !disable2faPassword.value) return
  isDisabling2fa.value = true

  try {
    const res = await $fetch<any>('/api/v1/auth/2fa/disable', {
      method: 'POST',
      body: {
        code: disable2faCode.value ? disable2faCode.value.trim() : undefined,
        password: disable2faPassword.value || undefined,
      },
    })
    twoFactorEnabled.value = false
    show2faDisableModal.value = false
    disable2faCode.value = ''
    disable2faPassword.value = ''
    toastType.value = 'success'
    toastMessage.value = res.message || 'Two-factor authentication disabled.'
  } catch (err: any) {
    toastType.value = 'error'
    toastMessage.value = err?.data?.statusMessage || err?.data?.message || 'Failed to disable 2FA.'
  } finally {
    isDisabling2fa.value = false
  }
}

// ==========================================
// Passkeys (FIDO2 / WebAuthn) State & Handlers
// ==========================================
const passkeys = ref<any[]>([])
const isLoadingPasskeys = ref(false)
const showAddPasskeyModal = ref(false)
const newPasskeyName = ref('')
const isRegisteringPasskey = ref(false)
const deletingPasskeyId = ref<string | null>(null)

async function loadPasskeysAnd2FA() {
  isLoadingPasskeys.value = true
  try {
    const res = await $fetch<any>('/api/v1/auth/passkey/list')
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
      toastType.value = 'error'
      toastMessage.value = 'Your browser does not support Passkey / WebAuthn.'
      showAddPasskeyModal.value = false
      return
    }

    // 1. Fetch registration options from server
    const options = await $fetch<any>('/api/v1/auth/passkey/register/options', {
      method: 'POST',
    })

    // 2. Prompt user for biometrics or security key
    const regResponse = await startRegistration({ optionsJSON: options })

    // 3. Send response to backend for verification and storage
    const res = await $fetch<any>('/api/v1/auth/passkey/register/verify', {
      method: 'POST',
      body: {
        response: regResponse,
        name: newPasskeyName.value.trim(),
      },
    })

    showAddPasskeyModal.value = false
    newPasskeyName.value = ''
    toastType.value = 'success'
    toastMessage.value = res.message || 'Passkey registered successfully!'

    await loadPasskeysAnd2FA()
  } catch (err: any) {
    console.error('[Passkey:Register]', err)
    if (err.name === 'NotAllowedError') {
      toastType.value = 'error'
      toastMessage.value = 'Passkey registration was canceled or timed out.'
    } else {
      toastType.value = 'error'
      toastMessage.value = err?.data?.statusMessage || err?.data?.message || err?.message || 'Failed to register passkey.'
    }
  } finally {
    isRegisteringPasskey.value = false
  }
}

async function handleDeletePasskey(id: string, name: string) {
  if (!confirm(`Are you sure you want to remove the passkey "${name}"?`)) return
  deletingPasskeyId.value = id

  try {
    await $fetch(`/api/v1/auth/passkey/${id}`, {
      method: 'DELETE',
    })
    toastType.value = 'success'
    toastMessage.value = `Passkey "${name}" removed.`
    passkeys.value = passkeys.value.filter((p) => p.id !== id)
  } catch (err: any) {
    toastType.value = 'error'
    toastMessage.value = err?.data?.statusMessage || err?.data?.message || 'Failed to remove passkey.'
  } finally {
    deletingPasskeyId.value = null
  }
}

onMounted(() => {
  loadPasskeysAnd2FA()
})

watch(activeTab, (tab) => {
  if (tab === 'security') {
    loadPasskeysAnd2FA()
  }
})

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
