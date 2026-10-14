<template>
  <div class="rounded-3xl glass-card p-6 sm:p-8 border border-white/10 relative overflow-hidden shadow-2xl">
    <div class="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 blur-3xl pointer-events-none"></div>

    <div class="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div class="space-y-1.5">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-medium backdrop-blur-md">
          <LucideUsers class="w-3.5 h-3.5" />
          <span>Identity & Access Management</span>
        </div>
        <h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
          Users & Roles Directory
        </h1>
        <p class="text-sm text-slate-300">
          Audit user accounts, assign restaurant permissions, modify roles, and manage account suspensions.
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
    <div class="mt-6 pt-5 border-t border-white/[0.08] grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
      <div>
        <span class="text-slate-400">Total Users:</span>
        <p class="text-lg font-bold text-white">{{ totalUsers }}</p>
      </div>
      <div>
        <span class="text-slate-400">Restaurant Owners:</span>
        <p class="text-lg font-bold text-purple-300">{{ ownerCount }}</p>
      </div>
      <div>
        <span class="text-slate-400">Administrators:</span>
        <p class="text-lg font-bold text-indigo-300">{{ adminCount }}</p>
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
  totalUsers: number
  ownerCount: number
  adminCount: number
  suspendedCount: number
  loading?: boolean
}>()

defineEmits<{
  (e: 'refresh'): void
}>()
</script>
