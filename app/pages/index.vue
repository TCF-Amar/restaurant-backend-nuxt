<template>
  <div class="space-y-6 max-w-7xl mx-auto">
    <!-- Top Hero Banner (Glass Glow Card) -->
    <div class="relative overflow-hidden rounded-3xl glass-card p-6 sm:p-8 border border-white/10 shadow-2xl">
      <!-- Glow ambient accent inside card -->
      <div
        class="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 blur-3xl pointer-events-none">
      </div>

      <div class="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div class="space-y-2">
          <div
            class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-medium backdrop-blur-md">
            <LucideSparkles class="w-3.5 h-3.5" />
            <span>Real-time Workspace Dashboard</span>
          </div>
          <h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Welcome to <span
              class="bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">Projet
              Console</span>
          </h1>
          <p class="text-sm text-slate-300 max-w-2xl leading-relaxed">
            Live database dashboard for restaurants, kitchen outlets, active customer orders, and role permissions.
          </p>
        </div>

        <!-- Interactive Sidebar Control Badges -->
        <div class="flex flex-wrap items-center gap-2 sm:gap-3">
          <button @click="toggleCollapse" type="button"
            class="px-4 py-2.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 border border-white/20 hover:border-indigo-400/50 text-white backdrop-blur-md transition-all duration-200 shadow-lg flex items-center gap-2 cursor-pointer active:scale-95">
            <LucidePanelLeftClose v-if="!isCollapsed" class="w-4 h-4 text-indigo-300" />
            <LucidePanelLeftOpen v-else class="w-4 h-4 text-indigo-300" />
            <span>{{ isCollapsed ? 'Expand Sidebar' : 'Collapse to Icons' }}</span>
          </button>

          <NuxtLink to="/restaurants"
            class="px-4 py-2.5 rounded-xl text-xs font-semibold bg-indigo-600/40 hover:bg-indigo-600/60 border border-indigo-400/40 text-indigo-100 backdrop-blur-md transition-all duration-200 shadow-lg flex items-center gap-2 cursor-pointer active:scale-95">
            <LucideUtensils class="w-4 h-4 text-indigo-300" />
            <span>Manage Restaurants</span>
          </NuxtLink>
        </div>
      </div>

      <!-- Quick status strip -->
      <div
        class="mt-6 pt-5 border-t border-white/[0.08] flex flex-wrap items-center gap-4 sm:gap-8 text-xs text-slate-300">
        <div class="flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"></span>
          <span>Database: <strong class="text-white">PostgreSQL Connected</strong></span>
        </div>
        <div class="flex items-center gap-2">
          <LucideShield class="w-3.5 h-3.5 text-indigo-400" />
          <span>Role: <strong class="text-white">{{ user?.role || 'ADMIN' }}</strong></span>
        </div>
        <div class="flex items-center gap-2">
          <LucideMoveHorizontal class="w-3.5 h-3.5 text-purple-400" />
          <span>Sidebar Width: <strong class="text-white font-mono">{{ Math.round(sidebarWidth) }}px</strong></span>
        </div>
      </div>
    </div>

    <!-- Live Glass KPI Cards Grid (Real Database Data) -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      <!-- Total Restaurants Card -->
      <div class="rounded-2xl glass-card p-5 relative overflow-hidden group transition-all duration-300 hover:-translate-y-1">
        <div class="absolute -top-12 -right-12 w-28 h-28 rounded-full bg-indigo-500/20 blur-2xl group-hover:opacity-100 opacity-50 transition-opacity pointer-events-none"></div>
        <div class="flex items-center justify-between mb-3">
          <span class="text-xs font-medium text-slate-400">Total Outlets</span>
          <div class="p-2.5 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-white shadow-md">
            <LucideStore class="w-4 h-4 text-indigo-300" />
          </div>
        </div>
        <div class="flex items-baseline justify-between">
          <span class="text-2xl font-bold text-white tracking-tight">{{ metrics.totalRestaurants }}</span>
          <span class="text-xs font-semibold text-emerald-400 flex items-center gap-1">
            {{ metrics.activeRestaurants }} Active
          </span>
        </div>
        <p class="mt-2 text-[11px] text-slate-400/80">Registered restaurant outlets</p>
      </div>

      <!-- Total Orders Card -->
      <div class="rounded-2xl glass-card p-5 relative overflow-hidden group transition-all duration-300 hover:-translate-y-1">
        <div class="absolute -top-12 -right-12 w-28 h-28 rounded-full bg-purple-500/20 blur-2xl group-hover:opacity-100 opacity-50 transition-opacity pointer-events-none"></div>
        <div class="flex items-center justify-between mb-3">
          <span class="text-xs font-medium text-slate-400">Total Orders</span>
          <div class="p-2.5 rounded-xl bg-purple-500/20 border border-purple-500/30 text-white shadow-md">
            <LucideShoppingBag class="w-4 h-4 text-purple-300" />
          </div>
        </div>
        <div class="flex items-baseline justify-between">
          <span class="text-2xl font-bold text-white tracking-tight">{{ metrics.totalOrders }}</span>
          <span class="text-xs font-semibold text-slate-400">Lifetime</span>
        </div>
        <p class="mt-2 text-[11px] text-slate-400/80">Customer orders placed</p>
      </div>

      <!-- Total Revenue Card -->
      <div class="rounded-2xl glass-card p-5 relative overflow-hidden group transition-all duration-300 hover:-translate-y-1">
        <div class="absolute -top-12 -right-12 w-28 h-28 rounded-full bg-emerald-500/20 blur-2xl group-hover:opacity-100 opacity-50 transition-opacity pointer-events-none"></div>
        <div class="flex items-center justify-between mb-3">
          <span class="text-xs font-medium text-slate-400">Gross Revenue</span>
          <div class="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-white shadow-md">
            <LucideDollarSign class="w-4 h-4 text-emerald-300" />
          </div>
        </div>
        <div class="flex items-baseline justify-between">
          <span class="text-2xl font-bold text-white tracking-tight">${{ metrics.totalRevenue.toFixed(2) }}</span>
          <span class="text-xs font-semibold text-emerald-400">USD</span>
        </div>
        <p class="mt-2 text-[11px] text-slate-400/80">Total processed revenue</p>
      </div>

      <!-- Total Users Card -->
      <div class="rounded-2xl glass-card p-5 relative overflow-hidden group transition-all duration-300 hover:-translate-y-1">
        <div class="absolute -top-12 -right-12 w-28 h-28 rounded-full bg-cyan-500/20 blur-2xl group-hover:opacity-100 opacity-50 transition-opacity pointer-events-none"></div>
        <div class="flex items-center justify-between mb-3">
          <span class="text-xs font-medium text-slate-400">Registered Users</span>
          <div class="p-2.5 rounded-xl bg-cyan-500/20 border border-cyan-500/30 text-white shadow-md">
            <LucideUsers class="w-4 h-4 text-cyan-300" />
          </div>
        </div>
        <div class="flex items-baseline justify-between">
          <span class="text-2xl font-bold text-white tracking-tight">{{ metrics.totalUsers }}</span>
          <span class="text-xs font-semibold text-cyan-400">Accounts</span>
        </div>
        <p class="mt-2 text-[11px] text-slate-400/80">Platform user accounts</p>
      </div>
    </div>

    <!-- Main Content Section: Two Glass Panels -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Left 2 Cols: Real Activity & Orders Feed -->
      <div class="lg:col-span-2 rounded-2xl glass-card p-6 border border-white/10 space-y-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <div class="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <LucideActivity class="w-4 h-4" />
            </div>
            <div>
              <h2 class="text-base font-semibold text-white">Recent Orders</h2>
              <p class="text-xs text-slate-400">Live order pipeline from your database</p>
            </div>
          </div>

          <button @click="fetchDashboardStats" type="button" class="p-1.5 rounded-lg text-slate-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] transition cursor-pointer" title="Refresh">
            <LucideRotateCcw class="w-3.5 h-3.5" :class="{ 'animate-spin': isLoading }" />
          </button>
        </div>

        <!-- Orders Table (When real orders exist) -->
        <div v-if="recentOrders.length > 0" class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead>
              <tr class="border-b border-white/[0.08] text-slate-400">
                <th class="pb-3 font-semibold">Order</th>
                <th class="pb-3 font-semibold">Customer</th>
                <th class="pb-3 font-semibold">Restaurant</th>
                <th class="pb-3 font-semibold">Amount</th>
                <th class="pb-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-white/[0.05]">
              <tr v-for="order in recentOrders" :key="order.id" class="hover:bg-white/[0.03] transition">
                <td class="py-3 font-mono text-indigo-300 font-medium">#{{ order.orderNumber || order.id.slice(-6) }}</td>
                <td class="py-3 text-slate-200 font-medium">{{ order.user?.name || order.user?.email || 'Guest' }}</td>
                <td class="py-3 text-slate-300">{{ order.restaurant?.name || 'N/A' }}</td>
                <td class="py-3 font-semibold text-white">${{ Number(order.totalAmount).toFixed(2) }}</td>
                <td class="py-3">
                  <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium border bg-indigo-500/10 border-indigo-500/30 text-indigo-300">
                    <span class="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                    {{ order.status }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Real Empty State (When no orders in database) -->
        <div v-else class="py-12 text-center space-y-3">
          <div class="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center mx-auto text-slate-500">
            <LucideInbox class="w-6 h-6" />
          </div>
          <div class="space-y-1">
            <p class="text-xs font-semibold text-slate-300">No Orders in Database</p>
            <p class="text-[11px] text-slate-500 max-w-sm mx-auto">
              No orders have been recorded yet. New customer orders will appear here automatically.
            </p>
          </div>
          <div class="pt-2">
            <NuxtLink to="/restaurants" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-xs text-slate-200 transition">
              <LucideStore class="w-3.5 h-3.5 text-indigo-400" />
              <span>Explore Outlets</span>
            </NuxtLink>
          </div>
        </div>
      </div>

      <!-- Right 1 Col: Registered Outlets or Quick Actions -->
      <div class="rounded-2xl glass-card p-6 border border-white/10 space-y-5 flex flex-col justify-between">
        <div class="space-y-4">
          <div class="flex items-center gap-2.5">
            <div class="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <LucideStore class="w-4 h-4" />
            </div>
            <div>
              <h2 class="text-base font-semibold text-white">Active Outlets</h2>
              <p class="text-xs text-slate-400">Kitchens linked to your system</p>
            </div>
          </div>

          <!-- Outlets List (Real database data) -->
          <div v-if="recentRestaurants.length > 0" class="space-y-2">
            <div v-for="outlet in recentRestaurants" :key="outlet.id" class="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-between">
              <div class="space-y-0.5 truncate">
                <p class="text-xs font-semibold text-white truncate">{{ outlet.name }}</p>
                <p class="text-[10px] text-slate-400 font-mono">@{{ outlet.slug }}</p>
              </div>
              <span class="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                {{ outlet._count?.menuItems || 0 }} items
              </span>
            </div>
          </div>

          <!-- Empty Outlets State -->
          <div v-else class="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] text-center space-y-2 text-xs">
            <p class="text-slate-300 font-medium">No Outlets Created</p>
            <p class="text-[11px] text-slate-500">Register your first restaurant outlet to begin accepting orders.</p>
            <NuxtLink to="/restaurants" class="inline-block mt-1 text-xs text-indigo-400 hover:text-indigo-300 underline underline-offset-2">
              Create Restaurant &rarr;
            </NuxtLink>
          </div>
        </div>

        <!-- Documentation Card (Admin Only) -->
        <div v-if="user?.role === 'ADMIN'" class="pt-4 border-t border-white/[0.06]">
          <NuxtLink to="/docs" target="_blank"
            class="w-full p-3 rounded-xl bg-gradient-to-r from-indigo-500/20 to-purple-500/20 hover:from-indigo-500/30 hover:to-purple-500/30 border border-indigo-500/30 text-white flex items-center justify-between text-xs font-semibold transition group cursor-pointer">
            <span class="flex items-center gap-2">
              <LucideBookOpen class="w-4 h-4 text-indigo-400" />
              <span>Explore Scalar OpenAPI Docs</span>
            </span>
            <LucideArrowUpRight
              class="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { user } = useAuth()
const { isCollapsed, sidebarWidth, toggleCollapse } = useSidebar()

const isLoading = ref(true)

const metrics = reactive({
  totalRestaurants: 0,
  activeRestaurants: 0,
  totalUsers: 0,
  totalOrders: 0,
  totalRevenue: 0,
})

const recentOrders = ref<any[]>([])
const recentRestaurants = ref<any[]>([])

async function fetchDashboardStats() {
  isLoading.value = true
  try {
    const res = await $fetch<any>('/api/v1/dashboard/stats')
    if (res?.metrics) {
      metrics.totalRestaurants = res.metrics.totalRestaurants || 0
      metrics.activeRestaurants = res.metrics.activeRestaurants || 0
      metrics.totalUsers = res.metrics.totalUsers || 0
      metrics.totalOrders = res.metrics.totalOrders || 0
      metrics.totalRevenue = res.metrics.totalRevenue || 0
    }
    recentOrders.value = res?.recentOrders || []
    recentRestaurants.value = res?.recentRestaurants || []
  } catch (err) {
    console.warn('Dashboard stats fetch error:', err)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchDashboardStats()
})
</script>