<template>
  <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
    <div class="relative flex-1 max-w-md group">
      <div
        class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-400">
        <LucideSearch class="w-4 h-4" />
      </div>
      <input :value="searchQuery" @input="$emit('update:searchQuery', ($event.target as HTMLInputElement).value)"
        @keydown.enter.prevent type="search" name="userSearch" autocomplete="off" autocorrect="off" spellcheck="false"
        :placeholder="placeholder || 'Search by name, email, or phone...'"
        class="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl glass-input text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500/50" />
    </div>

    <div class="flex flex-wrap items-center gap-2">
      <!-- Role Filter (Only for All Users tab) -->
      <div v-if="showRoleFilter"
        class="flex items-center gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/10 text-xs overflow-x-auto">
        <button v-for="r in roleOptions" :key="r.value" @click="$emit('update:selectedRole', r.value)" type="button"
          :class="[
            'px-2.5 py-1.5 rounded-lg transition cursor-pointer font-medium whitespace-nowrap text-[11px]',
            selectedRole === r.value
              ? 'bg-purple-600/40 text-white border border-purple-500/50'
              : 'text-slate-400 hover:text-slate-200'
          ]">
          {{ r.label }}
        </button>
      </div>

      <!-- Status Filter -->
      <div
        class="flex items-center gap-1.5 p-1 rounded-xl bg-white/[0.03] border border-white/10 self-start sm:self-auto text-xs overflow-x-auto">
        <button v-for="s in statusOptions" :key="s.value" @click="$emit('update:selectedStatus', s.value)" type="button"
          :class="[
            'px-3 py-1.5 rounded-lg transition cursor-pointer font-medium whitespace-nowrap text-[11px]',
            selectedStatus === s.value
              ? 'bg-indigo-600/40 text-white border border-indigo-500/50'
              : 'text-slate-400 hover:text-slate-200'
          ]">
          {{ s.label }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  searchQuery: string
  selectedStatus: string
  selectedRole?: string
  showRoleFilter?: boolean
  placeholder?: string
}>()

defineEmits<{
  (e: 'update:searchQuery', value: string): void
  (e: 'update:selectedStatus', value: string): void
  (e: 'update:selectedRole', value: string): void
}>()

const statusOptions = [
  { value: 'ALL', label: 'All Accounts' },
  { value: 'ACTIVE', label: 'Active Only' },
  { value: 'SUSPENDED', label: 'Suspended Only' },
]

const roleOptions = [
  { value: 'ALL', label: 'All Roles' },
  { value: 'CUSTOMER', label: 'Customer' },
  { value: 'RESTAURANT_OWNER', label: 'Owner' },
  { value: 'DELIVERY_PARTNER', label: 'Delivery' },
  { value: 'ADMIN', label: 'Admin' },
]
</script>
