<template>
  <div class="max-w-7xl mx-auto space-y-6">
    <!-- Top Hero Banner -->
    <div class="rounded-3xl glass-card p-6 sm:p-8 border border-white/10 relative overflow-hidden shadow-2xl">
      <div class="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 blur-3xl pointer-events-none"></div>

      <div class="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div class="space-y-1.5">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-medium backdrop-blur-md">
            <LucideShoppingBag class="w-3.5 h-3.5" />
            <span>Order Pipeline</span>
          </div>
          <h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Customer Orders Feed
          </h1>
          <p class="text-sm text-slate-300">
            Real-time orders management, prep status tracking, and kitchen fulfillment.
          </p>
        </div>

        <button
          @click="fetchOrders"
          type="button"
          class="px-4 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-white text-xs font-semibold backdrop-blur-md transition cursor-pointer flex items-center gap-2"
        >
          <LucideRotateCcw class="w-3.5 h-3.5" :class="{ 'animate-spin': isLoading }" />
          <span>Refresh</span>
        </button>
      </div>
    </div>

    <!-- Orders Filter Strip -->
    <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
      <div class="relative flex-1 max-w-md group">
        <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-400">
          <LucideSearch class="w-4 h-4" />
        </div>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search by order ID, customer name..."
          class="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl glass-input text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
        />
      </div>

      <div class="flex items-center gap-1.5 p-1 rounded-xl bg-white/[0.03] border border-white/10 self-start sm:self-auto text-xs overflow-x-auto">
        <button
          v-for="status in ['ALL', 'PENDING', 'ACCEPTED', 'PREPARING', 'READY_FOR_PICKUP', 'DELIVERED']"
          :key="status"
          @click="selectedStatus = status"
          type="button"
          :class="[
            'px-3 py-1.5 rounded-lg transition cursor-pointer font-medium whitespace-nowrap',
            selectedStatus === status
              ? 'bg-indigo-600/40 text-white border border-indigo-500/50'
              : 'text-slate-400 hover:text-slate-200'
          ]"
        >
          {{ status }}
        </button>
      </div>
    </div>

    <!-- Orders Feed -->
    <div v-if="isLoading" class="p-12 text-center text-slate-400 text-xs">
      <LucideLoader2 class="w-6 h-6 animate-spin mx-auto text-indigo-400 mb-2" />
      <span>Loading orders...</span>
    </div>

    <div v-else-if="filteredOrders.length > 0" class="rounded-3xl glass-card p-6 border border-white/10 overflow-x-auto">
      <table class="w-full text-left text-xs">
        <thead>
          <tr class="border-b border-white/[0.08] text-slate-400">
            <th class="pb-3 font-semibold">Order Number</th>
            <th class="pb-3 font-semibold">Customer</th>
            <th class="pb-3 font-semibold">Restaurant</th>
            <th class="pb-3 font-semibold">Amount</th>
            <th class="pb-3 font-semibold">Status</th>
            <th class="pb-3 font-semibold">Created</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-white/[0.05]">
          <tr v-for="order in filteredOrders" :key="order.id" class="hover:bg-white/[0.03] transition">
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
            <td class="py-3 text-slate-400">{{ new Date(order.createdAt).toLocaleDateString() }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Real Empty State -->
    <div v-else class="rounded-3xl glass-card p-12 text-center border border-white/10 space-y-3">
      <LucideInbox class="w-10 h-10 text-slate-500 mx-auto" />
      <h3 class="text-sm font-semibold text-white">No Orders Recorded</h3>
      <p class="text-xs text-slate-400 max-w-sm mx-auto">
        No orders found in the database. Customer orders placed through the API will appear here.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
const orders = ref<any[]>([])
const isLoading = ref(true)
const searchQuery = ref('')
const selectedStatus = ref('ALL')

async function fetchOrders() {
  isLoading.value = true
  try {
    const res = await $fetch<any>('/api/v1/dashboard/stats')
    orders.value = res?.recentOrders || []
  } catch (err) {
    orders.value = []
  } finally {
    isLoading.value = false
  }
}

const filteredOrders = computed(() => {
  return orders.value.filter((o) => {
    const q = searchQuery.value.toLowerCase().trim()
    const matchesSearch =
      !q ||
      (o.orderNumber && o.orderNumber.toLowerCase().includes(q)) ||
      (o.user?.name && o.user.name.toLowerCase().includes(q))
    const matchesStatus =
      selectedStatus.value === 'ALL' || o.status === selectedStatus.value
    return matchesSearch && matchesStatus
  })
})

onMounted(() => {
  fetchOrders()
})
</script>
