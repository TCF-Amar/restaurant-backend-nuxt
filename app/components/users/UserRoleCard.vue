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
    </div>

    <div class="space-y-2">
      <div
        v-for="roleOption in availableRoles"
        :key="roleOption.value"
        @click="$emit('update:selectedRole', roleOption.value)"
        :class="[
          'p-3 rounded-2xl border transition cursor-pointer flex items-center justify-between',
          selectedRole === roleOption.value
            ? 'bg-indigo-600/20 border-indigo-500/50 text-white shadow-md'
            : 'bg-white/[0.02] border-white/5 hover:border-white/15 text-slate-300'
        ]"
      >
        <div class="space-y-0.5">
          <div class="flex items-center gap-2">
            <span class="text-xs font-semibold">{{ roleOption.label }}</span>
            <span v-if="currentRole === roleOption.value" class="text-[9px] px-1.5 py-0.2 rounded bg-white/10 text-slate-300 uppercase">
              Current
            </span>
          </div>
          <p class="text-[11px] text-slate-400">{{ roleOption.description }}</p>
        </div>
        <div
          :class="[
            'w-4 h-4 rounded-full border flex items-center justify-center shrink-0',
            selectedRole === roleOption.value
              ? 'border-indigo-400 bg-indigo-500 text-white'
              : 'border-slate-600 bg-transparent'
          ]"
        >
          <LucideCheck v-if="selectedRole === roleOption.value" class="w-2.5 h-2.5" />
        </div>
      </div>
    </div>

    <button
      @click="$emit('save-role')"
      :disabled="isSubmitting || selectedRole === currentRole"
      type="button"
      class="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white text-xs font-bold transition shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
    >
      <LucideLoader2 v-if="isUpdatingRole" class="w-3.5 h-3.5 animate-spin" />
      <LucideSave v-else class="w-3.5 h-3.5" />
      <span>Update System Role</span>
    </button>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  currentRole: string
  selectedRole: string
  isSubmitting?: boolean
  isUpdatingRole?: boolean
}>()

defineEmits<{
  (e: 'update:selectedRole', role: string): void
  (e: 'save-role'): void
}>()

const availableRoles = [
  {
    value: 'CUSTOMER',
    label: 'Customer',
    description: 'Standard end-user browsing menus and placing food orders.',
  },
  {
    value: 'RESTAURANT_OWNER',
    label: 'Restaurant Owner / Staff',
    description: 'Manages assigned restaurant outlets, menus, and incoming orders.',
  },
  {
    value: 'DELIVERY_PARTNER',
    label: 'Delivery Partner',
    description: 'Accepts order deliveries and updates courier dispatch status.',
  },
  {
    value: 'ADMIN',
    label: 'System Administrator',
    description: 'Full administrative access across all restaurants, users, and settings.',
  },
]
</script>
