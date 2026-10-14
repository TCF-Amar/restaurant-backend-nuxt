<template>
  <div class="max-w-7xl mx-auto space-y-6">
    <!-- Top Hero Banner -->
    <div class="rounded-3xl glass-card p-6 sm:p-8 border border-white/10 relative overflow-hidden shadow-2xl">
      <div class="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 blur-3xl pointer-events-none"></div>

      <div class="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div class="space-y-1.5">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-medium backdrop-blur-md">
            <LucideBarChart3 class="w-3.5 h-3.5" />
            <span>Platform Intelligence</span>
          </div>
          <h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Analytics & Reports
          </h1>
          <p class="text-sm text-slate-300">
            Real-time analytics for gross revenue, kitchen performance, and active user volume.
          </p>
        </div>
      </div>
    </div>

    <!-- Metrics Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
      <div class="rounded-2xl glass-card p-5 border border-white/10">
        <span class="text-xs text-slate-400">Total Revenue</span>
        <p class="text-2xl font-bold text-white mt-1">${{ (stats?.metrics?.totalRevenue || 0).toFixed(2) }}</p>
        <span class="text-[11px] text-emerald-400 font-semibold block mt-1">Real-time aggregate</span>
      </div>

      <div class="rounded-2xl glass-card p-5 border border-white/10">
        <span class="text-xs text-slate-400">Fulfilled Orders</span>
        <p class="text-2xl font-bold text-white mt-1">{{ stats?.metrics?.totalOrders || 0 }}</p>
        <span class="text-[11px] text-indigo-300 font-semibold block mt-1">Database count</span>
      </div>

      <div class="rounded-2xl glass-card p-5 border border-white/10">
        <span class="text-xs text-slate-400">Active Kitchens</span>
        <p class="text-2xl font-bold text-white mt-1">{{ stats?.metrics?.activeRestaurants || 0 }}</p>
        <span class="text-[11px] text-purple-300 font-semibold block mt-1">Outlets operational</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const api = useApi()
const stats = ref<any>(null)

onMounted(async () => {
  try {
    stats.value = await api.get('/api/v1/dashboard/stats')
  } catch (err) {
    // ignore
  }
})
</script>
