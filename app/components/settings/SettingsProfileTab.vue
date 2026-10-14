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
const { user: authUser } = useAuth()

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
