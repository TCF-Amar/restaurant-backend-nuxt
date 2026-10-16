<template>
  <div class="rounded-3xl glass-card p-6 border border-white/10 space-y-4">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <div class="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300">
          <LucideShield class="w-4 h-4" />
        </div>
        <div>
          <h2 class="text-sm font-bold text-white">System Role</h2>
          <p class="text-[11px] text-slate-400">Manage account authorization level</p>
        </div>
      </div>
      <div v-if="isAdminRole" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-rose-500/10 border border-rose-500/30 text-rose-300">
        <LucideLock class="w-3 h-3" />
        <span>Protected Role</span>
      </div>
    </div>

    <!-- Alert banner if user is ADMIN -->
    <div
      v-if="isAdminRole"
      class="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-rose-300 flex items-start gap-3 text-xs"
    >
      <LucideLock class="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
      <div class="space-y-0.5">
        <p class="font-bold text-rose-200">Admin Role Cannot Be Changed</p>
        <p class="text-[11px] text-rose-300/80 leading-relaxed">
          Administrator accounts are protected. Their role cannot be modified or demoted.
        </p>
      </div>
    </div>

    <div class="space-y-2">
      <div
        v-for="roleOption in availableRoles"
        :key="roleOption.value"
        @click="handleSelectRole(roleOption)"
        :class="[
          'p-3 rounded-2xl border transition flex items-center justify-between',
          isAdminRole
            ? (currentRole === roleOption.value
                ? 'bg-rose-500/10 border-rose-500/30 text-white cursor-not-allowed opacity-95'
                : 'bg-white/[0.01] border-white/5 text-slate-500 cursor-not-allowed opacity-40')
            : roleOption.restricted
              ? 'bg-white/[0.01] border-white/5 text-slate-500 cursor-not-allowed opacity-60'
              : (selectedRole === roleOption.value
                  ? 'bg-indigo-600/20 border-indigo-500/50 text-white shadow-md cursor-pointer'
                  : 'bg-white/[0.02] border-white/5 hover:border-white/15 text-slate-300 cursor-pointer')
        ]"
      >
        <div class="space-y-0.5">
          <div class="flex items-center gap-2">
            <span class="text-xs font-semibold">{{ roleOption.label }}</span>
            <span v-if="currentRole === roleOption.value" class="text-[9px] px-1.5 py-0.2 rounded bg-white/10 text-slate-300 uppercase">
              Current
            </span>
            <span
              v-if="roleOption.restricted && !isAdminRole"
              class="inline-flex items-center gap-1 text-[9px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300"
            >
              <LucideLock class="w-2.5 h-2.5" />
              Not Assignable
            </span>
          </div>
          <p class="text-[11px] text-slate-400">
            {{ roleOption.restricted && !isAdminRole ? 'Admins cannot assign the Admin role to any user.' : roleOption.description }}
          </p>
        </div>
        <div
          :class="[
            'w-4 h-4 rounded-full border flex items-center justify-center shrink-0',
            isAdminRole
              ? (currentRole === roleOption.value ? 'border-rose-400 bg-rose-500 text-white' : 'border-slate-700 bg-transparent')
              : roleOption.restricted
                ? 'border-slate-700 bg-transparent text-slate-600'
                : (selectedRole === roleOption.value
                    ? 'border-indigo-400 bg-indigo-500 text-white'
                    : 'border-slate-600 bg-transparent')
          ]"
        >
          <LucideCheck v-if="!isAdminRole && selectedRole === roleOption.value" class="w-2.5 h-2.5" />
          <LucideLock v-else-if="isAdminRole && currentRole === roleOption.value" class="w-2.5 h-2.5" />
          <LucideLock v-else-if="roleOption.restricted && !isAdminRole" class="w-2.5 h-2.5 text-slate-600" />
        </div>
      </div>
    </div>

    <button
      @click="isAdminRole || isSelectedRestricted ? null : $emit('save-role')"
      :disabled="isSubmitting || selectedRole === currentRole || isAdminRole || isSelectedRestricted"
      type="button"
      class="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white text-xs font-bold transition shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
    >
      <LucideLoader2 v-if="isUpdatingRole" class="w-3.5 h-3.5 animate-spin" />
      <LucideLock v-else-if="isAdminRole" class="w-3.5 h-3.5" />
      <LucideSave v-else class="w-3.5 h-3.5" />
      <span>{{ isAdminRole ? 'Admin Role Protected' : 'Update System Role' }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  currentRole: string
  selectedRole: string
  isSubmitting?: boolean
  isUpdatingRole?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:selectedRole', role: string): void
  (e: 'save-role'): void
}>()

const isAdminRole = computed(() => props.currentRole === 'ADMIN')
const isSelectedRestricted = computed(() => props.selectedRole === 'ADMIN' && props.currentRole !== 'ADMIN')

const availableRoles = [
  {
    value: 'CUSTOMER',
    label: 'Customer',
    description: 'Standard end-user browsing menus and placing food orders.',
    restricted: false,
  },
  {
    value: 'RESTAURANT_OWNER',
    label: 'Restaurant Owner / Staff',
    description: 'Manages assigned restaurant outlets, menus, and incoming orders.',
    restricted: false,
  },
  {
    value: 'DELIVERY_PARTNER',
    label: 'Delivery Partner',
    description: 'Accepts order deliveries and updates courier dispatch status.',
    restricted: false,
  },
  {
    value: 'ADMIN',
    label: 'System Administrator',
    description: 'Full administrative access across all restaurants, users, and settings.',
    restricted: true,
  },
]

function handleSelectRole(roleOption: (typeof availableRoles)[number]) {
  if (isAdminRole.value) return
  if (roleOption.restricted) return
  emit('update:selectedRole', roleOption.value)
}
</script>
