<template>
  <div class="rounded-3xl glass-card p-6 sm:p-8 border border-white/10 relative overflow-hidden shadow-2xl">
    <div class="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 blur-3xl pointer-events-none"></div>

    <div class="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div class="space-y-1.5">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-medium backdrop-blur-md">
          <LucideUsers class="w-3.5 h-3.5" />
          <span>{{ activeTab === 'customers' ? 'Customer Account Management' : activeTab === 'owners' ? 'Restaurant Partner Administration' : 'Global Platform Accounts' }}</span>
        </div>
        <h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
          {{ activeTab === 'customers' ? 'Customer Management' : activeTab === 'owners' ? 'Restaurant Owners Directory' : 'All Platform Users' }}
        </h1>
        <p class="text-sm text-slate-300">
          {{ activeTab === 'customers'
            ? 'Manage customer accounts, search profiles, view activity, and handle account suspensions.'
            : activeTab === 'owners'
              ? 'Manage restaurant owner accounts and review assigned restaurant outlets.'
              : 'Audit and manage all accounts across all roles (Customers, Owners, Delivery Partners, and Admins).'
          }}
        </p>
      </div>

      <button
        @click="$emit('refresh')"
        type="button"
        class="px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-white text-xs font-semibold backdrop-blur-md transition cursor-pointer flex items-center gap-2 self-start sm:self-auto"
      >
        <LucideRotateCcw class="w-3.5 h-3.5" :class="{ 'animate-spin': loading }" />
        <span>Refresh</span>
      </button>
    </div>

    <!-- Quick Metrics Strip -->
    <div class="mt-6 pt-5 border-t border-white/[0.08] grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
      <div>
        <span class="text-slate-400">Total {{ activeTab === 'customers' ? 'Customers' : activeTab === 'owners' ? 'Owners' : 'Users' }}:</span>
        <p class="text-lg font-bold text-white">{{ totalCount }}</p>
      </div>
      <div>
        <span class="text-slate-400">Active Accounts:</span>
        <p class="text-lg font-bold text-emerald-400">{{ activeCount }}</p>
      </div>
      <div>
        <span class="text-slate-400">Suspended Accounts:</span>
        <p class="text-lg font-bold text-rose-400">{{ suspendedCount }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  activeTab: 'customers' | 'owners' | 'all'
  totalCount: number
  activeCount: number
  suspendedCount: number
  loading?: boolean
}>()

defineEmits<{
  (e: 'refresh'): void
}>()
</script>
