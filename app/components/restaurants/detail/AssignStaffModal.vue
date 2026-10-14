<template>
  <Teleport to="body">
    <transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0"
      leave-active-class="transition duration-150 ease-in" leave-to-class="opacity-0">
      <div v-if="show"
        class="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto">
        <div
          class="w-full max-w-lg rounded-3xl glass-card border border-white/20 p-6 sm:p-7 space-y-5 shadow-2xl relative my-auto max-h-[85vh] overflow-y-auto">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <div
              class="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300">
              <LucideUserPlus class="w-4 h-4" />
            </div>
            <h3 class="text-base font-bold text-white">Assign Staff Member</h3>
          </div>
          <button @click="$emit('close')" class="text-slate-400 hover:text-white p-1">
            <LucideX class="w-4 h-4" />
          </button>
        </div>

        <div class="space-y-4">
          <div class="space-y-1.5">
            <label class="text-xs font-semibold text-slate-300">Select User Account</label>
            <select v-model="form.userId"
              class="w-full px-3.5 py-2.5 text-xs rounded-xl glass-input text-white focus:outline-none focus:ring-1 focus:ring-purple-500/50 bg-[#141226] border border-white/10">
              <option value="" disabled class="bg-slate-900 text-slate-400">Choose user...</option>
              <option v-for="u in candidateUsers" :key="u.id" :value="u.id" class="bg-slate-900 text-white">
                {{ u.name }} ({{ u.email || u.phone || u.role }})
              </option>
            </select>
          </div>

          <!-- Granular Permissions Checklist -->
          <div class="space-y-2">
            <label class="text-xs font-semibold text-slate-300">Operational Permissions</label>
            <div class="space-y-2">
              <label v-for="perm in permissionOptions" :key="perm.id" :class="[
                'p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition',
                form.permissions.includes(perm.id)
                  ? 'bg-purple-600/15 border-purple-500/40 text-white'
                  : 'bg-white/[0.02] border-white/5 hover:border-white/15 text-slate-300'
              ]">
                <input type="checkbox" :value="perm.id" v-model="form.permissions"
                  class="mt-0.5 rounded border-white/20 bg-white/5 text-purple-600 focus:ring-purple-500/50" />
                <div class="text-xs space-y-0.5">
                  <div class="font-bold text-white">{{ perm.label }}</div>
                  <div class="text-[11px] text-slate-400">{{ perm.description }}</div>
                </div>
              </label>
            </div>
          </div>

          <label class="p-3 rounded-xl bg-white/[0.02] border border-white/10 flex items-center gap-3 cursor-pointer">
            <input type="checkbox" v-model="form.isPrimary"
              class="rounded border-white/20 bg-white/5 text-purple-600 focus:ring-purple-500/50" />
            <div class="text-xs">
              <span class="font-semibold text-white">Set as Primary Outlet</span>
            </div>
          </label>

          <div class="flex items-center justify-end gap-2.5 pt-3 border-t border-white/10">
            <button @click="$emit('close')" type="button"
              class="px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 text-xs font-semibold transition cursor-pointer">
              Cancel
            </button>
            <button @click="$emit('submit')"
              :disabled="isSubmitting || !form.userId || form.permissions.length === 0" type="button"
              class="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white text-xs font-bold transition shadow-lg flex items-center gap-2 cursor-pointer">
              <LucideLoader2 v-if="isSubmitting" class="w-3.5 h-3.5 animate-spin" />
              <span>Grant Staff Access</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </transition>
</Teleport>
</template>

<script setup lang="ts">
defineProps<{
  show: boolean
  isSubmitting?: boolean
  candidateUsers: any[]
  form: {
    userId: string
    permissions: string[]
    isPrimary: boolean
  }
}>()

defineEmits<{
  (e: 'close'): void
  (e: 'submit'): void
}>()

const permissionOptions = [
  {
    id: 'MANAGE_OUTLET',
    label: 'Outlet Settings',
    description: 'Operating profile, status, contact, and address.',
  },
  {
    id: 'MANAGE_CATEGORIES',
    label: 'Categories',
    description: 'Add, reorder, and remove menu categories.',
  },
  {
    id: 'MANAGE_MENU_ITEMS',
    label: 'Menu Items',
    description: 'Dishes, prices, images, and availability.',
  },
  {
    id: 'MANAGE_ORDERS',
    label: 'Live Orders',
    description: 'Kitchen ticketing and customer fulfillment.',
  },
]
</script>
