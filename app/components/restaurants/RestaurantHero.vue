<template>
  <div class="rounded-3xl glass-card p-6 sm:p-8 border border-white/10 relative overflow-hidden shadow-2xl">
    <!-- Ambient card glow -->
    <div class="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 blur-3xl pointer-events-none"></div>

    <div class="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div class="space-y-1.5">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-medium backdrop-blur-md">
          <LucideUtensils class="w-3.5 h-3.5" />
          <span>Outlet Operations</span>
        </div>
        <h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
          Restaurants & Outlets
        </h1>
        <p class="text-sm text-slate-300">
          Monitor restaurant outlets, manage menus, kitchen staff permissions, and active order pipelines.
        </p>
      </div>

      <!-- Action Button (Admin Create Outlet) -->
      <button
        v-if="isAdmin"
        @click="$emit('create')"
        type="button"
        class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 border border-indigo-400/40 text-white text-xs font-semibold backdrop-blur-md shadow-lg transition active:scale-95 cursor-pointer flex items-center gap-2 self-start sm:self-auto"
      >
        <LucidePlus class="w-4 h-4" />
        <span>New Restaurant</span>
      </button>
    </div>

    <!-- Quick Metrics Strip -->
    <div class="mt-6 pt-5 border-t border-white/[0.08] grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
      <div>
        <span class="text-slate-400">Total Outlets:</span>
        <p class="text-lg font-bold text-white">{{ outletsCount }}</p>
      </div>
      <div>
        <span class="text-slate-400">Online & Active:</span>
        <p class="text-lg font-bold text-emerald-400">{{ activeCount }}</p>
      </div>
      <div>
        <span class="text-slate-400">Total Menu Items:</span>
        <p class="text-lg font-bold text-purple-300">{{ totalMenuItems }}</p>
      </div>
      <div>
        <span class="text-slate-400">Live Orders:</span>
        <p class="text-lg font-bold text-indigo-300">{{ totalActiveOrders }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  outletsCount: number
  activeCount: number
  totalMenuItems: number
  totalActiveOrders: number
  isAdmin: boolean
}>()

defineEmits<{
  (e: 'create'): void
}>()
</script>
