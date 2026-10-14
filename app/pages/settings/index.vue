<template>
  <div class="max-w-6xl mx-auto space-y-6">
    <!-- Top Header -->
    <SettingsHero :user-role="user?.role || 'ADMIN'" />

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
        <SettingsProfileTab
          v-if="activeTab === 'profile'"
          :user="user"
          @notify="onNotify"
        />

        <!-- TAB 2: Security & Password -->
        <SettingsSecurityTab
          v-if="activeTab === 'security'"
          :user="user"
          @notify="onNotify"
        />

        <!-- TAB 3: Interface & Glass UI Appearance -->
        <SettingsAppearanceTab v-if="activeTab === 'appearance'" />

        <!-- TAB 4: Notifications -->
        <SettingsNotificationsTab v-if="activeTab === 'notifications'" />

        <!-- TAB 5: Sessions & Security -->
        <SettingsSessionsTab
          v-if="activeTab === 'sessions'"
          @notify="onNotify"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import SettingsHero from '~/components/settings/SettingsHero.vue'
import SettingsProfileTab from '~/components/settings/SettingsProfileTab.vue'
import SettingsSecurityTab from '~/components/settings/SettingsSecurityTab.vue'
import SettingsAppearanceTab from '~/components/settings/SettingsAppearanceTab.vue'
import SettingsNotificationsTab from '~/components/settings/SettingsNotificationsTab.vue'
import SettingsSessionsTab from '~/components/settings/SettingsSessionsTab.vue'

const { user } = useAuth()

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

function onNotify(payload: { type: 'success' | 'error'; message: string }) {
  toastType.value = payload.type
  toastMessage.value = payload.message
}
</script>
