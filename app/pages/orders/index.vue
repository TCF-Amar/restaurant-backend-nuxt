<template>
  <div class="max-w-7xl mx-auto space-y-6">
    <!-- Top Hero Banner -->
    <div class="rounded-3xl glass-card p-6 sm:p-8 border border-white/10 relative overflow-hidden shadow-2xl">
      <div class="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 blur-3xl pointer-events-none"></div>

      <div class="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div class="space-y-1.5">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-medium backdrop-blur-md">
            <LucideShoppingBag class="w-3.5 h-3.5" />
            <span>Order Pipeline & Kitchen Live Board</span>
          </div>
          <h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Customer Orders Feed
          </h1>
          <p class="text-sm text-slate-300">
            Real-time live orders feed from Flutter mobile app, prep tracking, and customer address fulfillment.
          </p>
        </div>

        <button
          @click="fetchOrders"
          type="button"
          class="px-4 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-white text-xs font-semibold backdrop-blur-md transition cursor-pointer flex items-center gap-2"
        >
          <LucideRotateCcw class="w-3.5 h-3.5" :class="{ 'animate-spin': isLoading }" />
          <span>Refresh Feed</span>
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
          placeholder="Search by order #, customer, restaurant, city..."
          class="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl glass-input text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
        />
      </div>

      <div class="flex items-center gap-1.5 p-1 rounded-xl bg-white/[0.03] border border-white/10 self-start sm:self-auto text-xs overflow-x-auto">
        <button
          v-for="status in ['ALL', 'PENDING', 'ACCEPTED', 'PREPARING', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED']"
          :key="status"
          @click="selectedStatus = status"
          type="button"
          :class="[
            'px-3 py-1.5 rounded-lg transition cursor-pointer font-medium whitespace-nowrap text-[11px]',
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
      <span>Loading orders feed...</span>
    </div>

    <div v-else-if="filteredOrders.length > 0" class="rounded-3xl glass-card p-6 border border-white/10 overflow-x-auto">
      <table class="w-full text-left text-xs">
        <thead>
          <tr class="border-b border-white/[0.08] text-slate-400">
            <th class="pb-3 font-semibold">Order Number</th>
            <th class="pb-3 font-semibold">Customer</th>
            <th class="pb-3 font-semibold">Delivery Address</th>
            <th class="pb-3 font-semibold">Restaurant</th>
            <th class="pb-3 font-semibold">Items</th>
            <th class="pb-3 font-semibold">Amount</th>
            <th class="pb-3 font-semibold">Status</th>
            <th class="pb-3 font-semibold text-right">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-white/[0.05]">
          <tr
            v-for="order in filteredOrders"
            :key="order.id"
            @click="openOrderDetails(order)"
            class="hover:bg-white/[0.03] transition cursor-pointer group"
          >
            <td class="py-3 font-mono text-indigo-300 font-semibold">
              #{{ order.orderNumber || order.id.slice(0, 8) }}
            </td>
            <td class="py-3">
              <span class="text-slate-200 font-medium block">{{ order.user?.name || 'Customer' }}</span>
              <span class="text-[10px] text-slate-400 block">{{ order.deliveryAddress?.phone || order.user?.phone || 'No phone' }}</span>
            </td>
            <td class="py-3 max-w-xs truncate text-slate-300 text-[11px]">
              <span v-if="order.deliveryAddress">
                {{ order.deliveryAddress.addressLine1 }}, {{ order.deliveryAddress.city }}
              </span>
              <span v-else class="text-slate-500 italic">Pickup / None</span>
            </td>
            <td class="py-3 text-slate-300 font-medium">
              {{ order.restaurant?.name || 'N/A' }}
            </td>
            <td class="py-3 text-slate-400">
              {{ order.items?.length || 0 }} items
            </td>
            <td class="py-3 font-black text-emerald-400 text-xs">
              ${{ Number(order.totalAmount).toFixed(2) }}
            </td>
            <td class="py-3">
              <span
                :class="[
                  'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border',
                  getOrderStatusClass(order.status)
                ]"
              >
                {{ order.status }}
              </span>
            </td>
            <td class="py-3 text-right">
              <button
                @click.stop="openOrderDetails(order)"
                type="button"
                class="px-3 py-1 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 text-[11px] font-medium transition cursor-pointer inline-flex items-center gap-1"
              >
                <LucideEye class="w-3 h-3" />
                <span>View</span>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Real Empty State -->
    <div v-else class="rounded-3xl glass-card p-12 text-center border border-white/10 space-y-3">
      <LucideInbox class="w-10 h-10 text-slate-500 mx-auto" />
      <h3 class="text-sm font-semibold text-white">No Orders Found</h3>
      <p class="text-xs text-slate-400 max-w-sm mx-auto">
        {{ searchQuery ? 'No orders match your filter criteria.' : 'Live orders placed through the Flutter mobile app will appear here instantly.' }}
      </p>
    </div>

    <!-- Order Detail & Pipeline Modal -->
    <OrderDetailModal
      :is-open="isDetailModalOpen"
      :order="activeOrder"
      @close="isDetailModalOpen = false"
      @updated="onOrderUpdated"
    />
  </div>
</template>

<script setup lang="ts">
import OrderDetailModal from '~/components/orders/OrderDetailModal.vue'

const route = useRoute()
const api = useApi()

const orders = ref<any[]>([])
const isLoading = ref(true)
const searchQuery = ref('')
const selectedStatus = ref('ALL')

const isDetailModalOpen = ref(false)
const activeOrder = ref<any | null>(null)

async function fetchOrders() {
  isLoading.value = true
  try {
    const restaurantId = route.query.restaurantId ? String(route.query.restaurantId) : undefined
    const url = restaurantId ? `/api/v1/orders?restaurantId=${restaurantId}` : '/api/v1/orders'
    const res = await api.get<any>(url)
    orders.value = res?.orders || []
  } catch (err) {
    orders.value = []
  } finally {
    isLoading.value = false
  }
}

function openOrderDetails(order: any) {
  activeOrder.value = order
  isDetailModalOpen.value = true
}

function onOrderUpdated(updatedOrder: any) {
  const idx = orders.value.findIndex((o) => o.id === updatedOrder.id)
  if (idx !== -1) {
    orders.value[idx] = { ...orders.value[idx], ...updatedOrder }
  }
  activeOrder.value = updatedOrder
}

function getOrderStatusClass(status: string) {
  switch (status) {
    case 'PENDING':
      return 'bg-amber-500/15 border-amber-500/30 text-amber-300'
    case 'ACCEPTED':
      return 'bg-blue-500/15 border-blue-500/30 text-blue-300'
    case 'PREPARING':
      return 'bg-purple-500/15 border-purple-500/30 text-purple-300'
    case 'READY_FOR_PICKUP':
      return 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300'
    case 'OUT_FOR_DELIVERY':
      return 'bg-cyan-500/15 border-cyan-500/30 text-cyan-300'
    case 'DELIVERED':
      return 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
    case 'CANCELLED':
      return 'bg-rose-500/15 border-rose-500/30 text-rose-300'
    default:
      return 'bg-slate-500/15 border-slate-500/30 text-slate-300'
  }
}

const filteredOrders = computed(() => {
  return orders.value.filter((o) => {
    const q = searchQuery.value.toLowerCase().trim()
    const matchesSearch =
      !q ||
      (o.orderNumber && o.orderNumber.toLowerCase().includes(q)) ||
      (o.user?.name && o.user.name.toLowerCase().includes(q)) ||
      (o.restaurant?.name && o.restaurant.name.toLowerCase().includes(q)) ||
      (o.deliveryAddress?.city && o.deliveryAddress.city.toLowerCase().includes(q)) ||
      (o.deliveryAddress?.addressLine1 && o.deliveryAddress.addressLine1.toLowerCase().includes(q))

    const matchesStatus =
      selectedStatus.value === 'ALL' || o.status === selectedStatus.value

    return matchesSearch && matchesStatus
  })
})

onMounted(() => {
  fetchOrders()
})
</script>
