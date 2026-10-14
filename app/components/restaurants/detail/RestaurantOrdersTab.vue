<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div>
        <h2 class="text-base font-bold text-white">Orders Board & Fulfillment</h2>
        <p class="text-xs text-slate-400">Incoming Flutter mobile app customer requests for {{ restaurantName }}</p>
      </div>

      <NuxtLink :to="`/orders?restaurantId=${restaurantId}`"
        class="px-4 py-2 rounded-xl bg-indigo-600/40 hover:bg-indigo-600/60 border border-indigo-500/50 text-white text-xs font-semibold transition cursor-pointer flex items-center gap-2 self-start sm:self-auto shadow-md">
        <LucideExternalLink class="w-3.5 h-3.5" />
        <span>Open Dedicated Live Kitchen Board</span>
      </NuxtLink>
    </div>

    <!-- Orders Table / Preview -->
    <div v-if="orders.length > 0" class="rounded-3xl glass-card p-6 border border-white/10 overflow-x-auto">
      <table class="w-full text-left text-xs">
        <thead>
          <tr class="border-b border-white/[0.08] text-slate-400">
            <th class="pb-3 font-semibold">Order ID</th>
            <th class="pb-3 font-semibold">Customer</th>
            <th class="pb-3 font-semibold">Delivery Location</th>
            <th class="pb-3 font-semibold">Items</th>
            <th class="pb-3 font-semibold">Total</th>
            <th class="pb-3 font-semibold">Status</th>
            <th class="pb-3 font-semibold">Created</th>
            <th class="pb-3 font-semibold text-right">Action</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-white/[0.05]">
          <tr
            v-for="order in orders"
            :key="order.id"
            @click="activeOrder = order"
            class="hover:bg-white/[0.03] transition cursor-pointer group"
          >
            <td class="py-3 font-mono text-[11px] text-indigo-300 font-semibold">
              #{{ order.orderNumber || order.id.slice(0, 8) }}
            </td>
            <td class="py-3">
              <span class="text-white font-medium block">{{ order.user?.name || 'Customer' }}</span>
              <p class="text-[10px] text-slate-400">{{ order.deliveryAddress?.phone || order.user?.phone || '' }}</p>
            </td>
            <td class="py-3 max-w-[180px] truncate text-slate-300 text-[11px]">
              <span v-if="order.deliveryAddress">
                {{ order.deliveryAddress.addressLine1 }}, {{ order.deliveryAddress.city }}
              </span>
              <span v-else class="text-slate-500 italic">Pickup / None</span>
            </td>
            <td class="py-3 text-slate-300">
              {{ order.items?.length || 0 }} item(s)
            </td>
            <td class="py-3 font-black text-emerald-400">
              ${{ Number(order.totalAmount || 0).toFixed(2) }}
            </td>
            <td class="py-3">
              <span :class="[
                'px-2 py-0.5 rounded-full text-[10px] font-semibold border',
                getOrderStatusClass(order.status)
              ]">
                {{ order.status }}
              </span>
            </td>
            <td class="py-3 text-slate-400 text-[11px]">
              {{ formatDate(order.createdAt) }}
            </td>
            <td class="py-3 text-right">
              <button
                @click.stop="activeOrder = order"
                type="button"
                class="px-2.5 py-1 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 text-[11px] font-medium transition cursor-pointer"
              >
                Inspect
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Orders Pagination Component -->
      <AppPagination :page="pagination.page" :total-pages="pagination.totalPages"
        :total="pagination.total" :limit="pagination.limit" :loading="loading"
        @change="$emit('page-change', $event)" />
    </div>

    <!-- Empty Orders -->
    <div v-else class="rounded-3xl glass-card p-12 text-center border border-white/10 space-y-3">
      <LucideShoppingBag class="w-10 h-10 text-slate-500 mx-auto" />
      <h3 class="text-sm font-semibold text-white">No Orders Received Yet</h3>
      <p class="text-xs text-slate-400 max-w-sm mx-auto">
        Once customers start ordering from {{ restaurantName }} via the Flutter mobile app, incoming live kitchen tickets will appear here.
      </p>
    </div>

    <!-- Order Detail & Pipeline Modal -->
    <OrderDetailModal
      :is-open="!!activeOrder"
      :order="activeOrder"
      @close="activeOrder = null"
      @updated="onOrderUpdated"
    />
  </div>
</template>

<script setup lang="ts">
import AppPagination from '~/components/AppPagination.vue'
import OrderDetailModal from '~/components/orders/OrderDetailModal.vue'

const props = defineProps<{
  restaurantId: string
  restaurantName: string
  orders: any[]
  loading?: boolean
  pagination: {
    page: number
    totalPages: number
    total: number
    limit: number
  }
}>()

const emit = defineEmits<{
  (e: 'page-change', page: number): void
  (e: 'order-updated', order: any): void
}>()

const activeOrder = ref<any | null>(null)

function onOrderUpdated(updated: any) {
  const idx = props.orders.findIndex((o) => o.id === updated.id)
  if (idx !== -1) {
    props.orders[idx] = { ...props.orders[idx], ...updated }
  }
  activeOrder.value = updated
  emit('order-updated', updated)
}

function formatDate(dateString?: string) {
  if (!dateString) return '—'
  return new Date(dateString).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
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
</script>
