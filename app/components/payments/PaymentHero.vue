<template>
  <div class="rounded-3xl glass-card p-6 sm:p-8 border border-white/10 relative overflow-hidden shadow-2xl">
    <div class="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-gradient-to-br from-emerald-500/20 to-indigo-500/20 blur-3xl pointer-events-none"></div>

    <div class="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div class="space-y-1.5">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-medium backdrop-blur-md">
          <LucideCreditCard class="w-3.5 h-3.5" />
          <span>Financial Transactions & Ledger</span>
        </div>
        <h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
          Payments & Settlements
        </h1>
        <p class="text-sm text-slate-300">
          Real-time transaction log, digital gateway records, Cash on Delivery reconciliations, and merchant refunds.
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
        <span class="text-slate-400">Total Settled Volume:</span>
        <p class="text-lg font-bold text-emerald-400 font-mono">${{ stats.totalVolume }}</p>
      </div>
      <div>
        <span class="text-slate-400">Completed Payments:</span>
        <p class="text-lg font-bold text-white">{{ stats.completedCount }}</p>
      </div>
      <div>
        <span class="text-slate-400">Pending Cash / In-Flight:</span>
        <p class="text-lg font-bold text-amber-300">{{ stats.pendingCount }}</p>
      </div>
      <div>
        <span class="text-slate-400">Refunded Transactions:</span>
        <p class="text-lg font-bold text-purple-300">{{ stats.refundedCount }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  stats: {
    totalVolume: string
    completedCount: number
    pendingCount: number
    refundedCount: number
    totalCount?: number
  }
  loading?: boolean
}>()

defineEmits<{
  (e: 'refresh'): void
}>()
</script>
