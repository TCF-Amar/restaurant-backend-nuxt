<template>
  <div>
    <!-- Loading State -->
    <div v-if="loading" class="p-16 text-center text-slate-400 text-xs">
      <LucideLoader2 class="w-8 h-8 animate-spin mx-auto text-emerald-400 mb-2" />
      <span>Loading payment transactions...</span>
    </div>

    <!-- Payments Table -->
    <div v-else-if="payments.length > 0" class="rounded-3xl glass-card p-6 border border-white/10 space-y-4">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead>
            <tr class="border-b border-white/[0.08] text-slate-400">
              <th class="pb-3 font-semibold">Transaction ID</th>
              <th class="pb-3 font-semibold">Order</th>
              <th class="pb-3 font-semibold">Restaurant Outlet</th>
              <th class="pb-3 font-semibold">Customer</th>
              <th class="pb-3 font-semibold">Method</th>
              <th class="pb-3 font-semibold">Amount</th>
              <th class="pb-3 font-semibold">Status</th>
              <th class="pb-3 font-semibold">Date</th>
              <th class="pb-3 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-white/[0.05]">
            <tr v-for="item in payments" :key="item.id" class="hover:bg-white/[0.03] transition">
              <!-- Transaction ID -->
              <td class="py-3">
                <span class="font-mono text-indigo-300 font-semibold bg-indigo-500/10 px-2 py-1 rounded-md border border-indigo-500/20 text-[11px]">
                  {{ item.transactionId || item.id.substring(0, 10) }}
                </span>
              </td>

              <!-- Order -->
              <td class="py-3">
                <div class="font-mono text-white font-medium">
                  {{ item.order?.orderNumber || '—' }}
                </div>
                <span class="text-[10px] text-slate-400 uppercase">
                  {{ item.order?.status }}
                </span>
              </td>

              <!-- Restaurant -->
              <td class="py-3">
                <NuxtLink
                  v-if="item.restaurant"
                  :to="`/restaurants/${item.restaurant.id}`"
                  class="font-medium text-white hover:text-emerald-300 transition"
                >
                  {{ item.restaurant.name }}
                </NuxtLink>
                <span v-else class="text-slate-500">—</span>
              </td>

              <!-- Customer -->
              <td class="py-3">
                <p class="text-slate-200 font-medium">{{ item.user?.name || 'Guest Customer' }}</p>
                <p class="text-[11px] text-slate-400 truncate max-w-[140px]">{{ item.user?.email || item.user?.phone || '—' }}</p>
              </td>

              <!-- Method & Gateway -->
              <td class="py-3">
                <div class="flex flex-col gap-0.5">
                  <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/[0.05] border border-white/10 text-slate-300 w-fit">
                    <LucideCoins v-if="item.method === 'CASH_ON_DELIVERY'" class="w-3 h-3 text-amber-400" />
                    <LucideQrCode v-else-if="item.method === 'UPI' || item.gateway === 'RAZORPAY'" class="w-3 h-3 text-purple-400" />
                    <LucideCreditCard v-else class="w-3 h-3 text-indigo-400" />
                    <span>{{ formatMethod(item.method) }}</span>
                  </span>
                  <span v-if="item.gateway && item.gateway !== 'CASH_ON_DELIVERY'" class="text-[9px] text-slate-500 font-mono px-1">
                    via {{ item.gateway }}
                  </span>
                </div>
              </td>

              <!-- Amount -->
              <td class="py-3 font-mono font-bold text-white">
                ${{ Number(item.amount).toFixed(2) }}
              </td>

              <!-- Status Badge -->
              <td class="py-3">
                <span
                  :class="[
                    'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border',
                    item.status === 'COMPLETED'
                      ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                      : item.status === 'PENDING' || item.status === 'PROCESSING'
                      ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                      : item.status === 'REFUNDED'
                      ? 'bg-purple-500/15 border-purple-500/30 text-purple-300'
                      : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                  ]"
                >
                  <span
                    :class="[
                      'w-1.5 h-1.5 rounded-full',
                      item.status === 'COMPLETED' ? 'bg-emerald-400' : (item.status === 'PENDING' ? 'bg-amber-400 animate-pulse' : 'bg-purple-400')
                    ]"
                  ></span>
                  <span>{{ item.status }}</span>
                </span>
              </td>

              <!-- Date -->
              <td class="py-3 text-[11px] text-slate-400 font-mono whitespace-nowrap">
                {{ formatDate(item.createdAt) }}
              </td>

              <!-- Actions -->
              <td class="py-3 text-right">
                <button
                  @click="$emit('view-details', item)"
                  type="button"
                  class="px-2.5 py-1 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-slate-300 hover:text-white text-xs font-medium transition cursor-pointer inline-flex items-center gap-1"
                >
                  <LucideEye class="w-3.5 h-3.5 text-indigo-400" />
                  <span>Details</span>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination Component -->
      <AppPagination
        :page="pagination.page"
        :total-pages="pagination.totalPages"
        :total="pagination.total"
        :limit="pagination.limit"
        :loading="loading"
        @change="$emit('page-change', $event)"
      />
    </div>

    <!-- Empty State -->
    <div v-else class="rounded-3xl glass-card p-12 text-center border border-white/10 space-y-3">
      <LucideReceipt class="w-10 h-10 text-slate-500 mx-auto" />
      <h3 class="text-sm font-semibold text-white">No Payment Records Found</h3>
      <p class="text-xs text-slate-400 max-w-sm mx-auto">
        No payment transactions matched your filter criteria. New customer order checkouts will show up here in real time.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import AppPagination from '~/components/AppPagination.vue'

defineProps<{
  payments: any[]
  loading: boolean
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}>()

defineEmits<{
  (e: 'view-details', item: any): void
  (e: 'page-change', page: number): void
}>()

function formatMethod(method: string) {
  switch (method) {
    case 'CASH_ON_DELIVERY':
      return 'Cash on Delivery'
    case 'STRIPE':
      return 'Stripe'
    case 'RAZORPAY':
      return 'Razorpay'
    case 'ONLINE':
      return 'Online Gateway'
    case 'UPI':
      return 'UPI Instant'
    case 'CARD':
      return 'Debit / Credit Card'
    case 'WALLET':
      return 'In-App Wallet'
    default:
      return method || 'Cash'
  }
}

function formatDate(dateStr: string) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>
