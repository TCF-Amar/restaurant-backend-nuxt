<template>
  <Teleport to="body">
    <div v-if="isOpen" class="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <!-- Backdrop -->
      <div class="fixed inset-0 bg-black/10 backdrop-blur-md transition-opacity" @click="$emit('close')"></div>

      <!-- Modal Card -->
      <div
        class="relative w-full max-w-2xl rounded-3xl glass-card border border-white/10 shadow-2xl overflow-hidden z-10 flex flex-col max-h-[85vh] my-auto">
        <!-- Modal Header -->
        <div class="p-6 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div class="space-y-1">
            <div class="flex items-center gap-2">
              <span class="font-mono text-xs text-indigo-400 font-bold">#{{ order?.orderNumber || order?.id?.slice(0, 8)
                }}</span>
              <span :class="[
                'px-2.5 py-0.5 rounded-full text-[10px] font-semibold border',
                getOrderStatusClass(order?.status)
              ]">
                {{ order?.status }}
              </span>
              <span
                class="text-[10px] px-2 py-0.5 rounded-md bg-white/[0.06] text-slate-300 font-medium border border-white/10">
                {{ order?.paymentMethod || 'CASH_ON_DELIVERY' }}
              </span>
            </div>
            <h2 class="text-lg font-bold text-white flex items-center gap-2">
              <span>{{ order?.restaurant?.name || 'Restaurant Order' }}</span>
            </h2>
            <p class="text-[11px] text-slate-400">
              Placed on {{ formatDate(order?.createdAt) }}
            </p>
          </div>

          <button @click="$emit('close')" type="button"
            class="p-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-400 hover:text-white transition cursor-pointer">
            <LucideX class="w-5 h-5" />
          </button>
        </div>

        <!-- Modal Body (Scrollable) -->
        <div class="p-6 space-y-6 overflow-y-auto flex-1 text-xs">
          <!-- Kitchen Status Controls Strip -->
          <div class="rounded-2xl p-4 bg-white/[0.03] border border-white/10 space-y-2.5">
            <div class="flex items-center justify-between text-slate-300 font-medium">
              <span class="flex items-center gap-1.5">
                <LucideActivity class="w-3.5 h-3.5 text-indigo-400" />
                <span>Update Order Pipeline Status</span>
              </span>
              <span v-if="updatingStatus" class="flex items-center gap-1 text-[11px] text-indigo-400">
                <LucideLoader2 class="w-3 h-3 animate-spin" />
                <span>Updating...</span>
              </span>
            </div>

            <div class="flex flex-wrap gap-1.5">
              <button v-for="st in availableStatuses" :key="st" @click="changeStatus(st)"
                :disabled="updatingStatus || order?.status === st" type="button" :class="[
                  'px-3 py-1.5 rounded-xl font-medium transition cursor-pointer text-[11px] flex items-center gap-1',
                  order?.status === st
                    ? 'bg-indigo-600 text-white shadow-md ring-2 ring-indigo-500/50'
                    : 'bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 hover:text-white border border-white/10 disabled:opacity-40 disabled:cursor-not-allowed'
                ]">
                <span>{{ st }}</span>
              </button>
            </div>
          </div>

          <!-- Customer & Delivery Snapshot Card -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <!-- Customer Info -->
            <div class="rounded-2xl p-4 bg-white/[0.03] border border-white/10 space-y-2">
              <h3 class="font-semibold text-white flex items-center gap-1.5">
                <LucideUser class="w-3.5 h-3.5 text-indigo-400" />
                <span>Customer Information</span>
              </h3>
              <div class="space-y-1 text-slate-300 text-[11px]">
                <p><strong class="text-slate-400">Name:</strong> {{ order?.user?.name || 'Customer' }}</p>
                <p><strong class="text-slate-400">Phone:</strong> {{ order?.deliveryAddress?.phone || order?.user?.phone
                  || 'Not provided' }}</p>
                <p><strong class="text-slate-400">Email:</strong> {{ order?.user?.email || 'N/A' }}</p>
              </div>
            </div>

            <!-- Delivery Address -->
            <div class="rounded-2xl p-4 bg-white/[0.03] border border-white/10 space-y-2">
              <h3 class="font-semibold text-white flex items-center gap-1.5">
                <LucideMapPin class="w-3.5 h-3.5 text-emerald-400" />
                <span>Delivery Address</span>
              </h3>
              <div v-if="order?.deliveryAddress" class="space-y-1 text-slate-300 text-[11px]">
                <p class="font-semibold text-white">
                  {{ order.deliveryAddress.recipientName }}
                  <span v-if="order.deliveryAddress.label"
                    class="text-[9px] px-1.5 py-0.5 rounded bg-white/10 ml-1 text-slate-300">
                    {{ order.deliveryAddress.label }}
                  </span>
                </p>
                <p>{{ order.deliveryAddress.addressLine1 }}</p>
                <p v-if="order.deliveryAddress.addressLine2">{{ order.deliveryAddress.addressLine2 }}</p>
                <p v-if="order.deliveryAddress.landmark" class="text-slate-400">
                  Landmark: {{ order.deliveryAddress.landmark }}
                </p>
                <p class="text-slate-400">
                  {{ order.deliveryAddress.city }}, {{ order.deliveryAddress.state }} {{
                    order.deliveryAddress.postalCode }}
                </p>
              </div>
              <p v-else class="text-slate-400 text-[11px]">
                Dine-in / Pickup or address not recorded.
              </p>
            </div>
          </div>

          <!-- Special Notes / Instructions -->
          <div v-if="order?.notes"
            class="rounded-2xl p-4 bg-amber-500/10 border border-amber-500/20 text-amber-200 space-y-1">
            <div class="flex items-center gap-1.5 font-semibold text-xs">
              <LucideAlertCircle class="w-3.5 h-3.5 text-amber-400" />
              <span>Customer Instructions / Notes</span>
            </div>
            <p class="text-[11px] leading-relaxed text-amber-100">
              "{{ order.notes }}"
            </p>
          </div>

          <!-- Order Items List -->
          <div class="space-y-3">
            <h3 class="font-semibold text-white flex items-center justify-between">
              <span class="flex items-center gap-1.5">
                <LucideUtensils class="w-3.5 h-3.5 text-indigo-400" />
                <span>Ordered Items ({{ order?.items?.length || 0 }})</span>
              </span>
              <span class="text-xs font-black text-emerald-400">
                Total: ${{ Number(order?.totalAmount || 0).toFixed(2) }}
              </span>
            </h3>

            <div
              class="rounded-2xl border border-white/10 overflow-hidden divide-y divide-white/[0.05] bg-white/[0.02]">
              <div v-for="item in order?.items" :key="item.id"
                class="p-3.5 flex items-start justify-between gap-3 hover:bg-white/[0.02] transition">
                <div class="flex items-start gap-3">
                  <img v-if="item.menuItem?.imageUrl" :src="item.menuItem.imageUrl" alt=""
                    class="w-12 h-12 rounded-xl object-cover shrink-0 border border-white/10" />
                  <div v-else
                    class="w-12 h-12 rounded-xl bg-white/[0.05] flex items-center justify-center shrink-0 border border-white/10 text-slate-500">
                    <LucideUtensils class="w-5 h-5" />
                  </div>

                  <div class="space-y-1">
                    <p class="font-semibold text-white text-xs">
                      {{ item.menuItem?.name || item.customization?.itemName || 'Menu Item' }}
                    </p>

                    <!-- Variant -->
                    <p v-if="item.customization?.variant?.name" class="text-[10px] text-purple-300 font-medium">
                      Size: {{ item.customization.variant.name }}
                    </p>

                    <!-- Addons -->
                    <div v-if="item.customization?.addons && item.customization.addons.length > 0"
                      class="flex flex-wrap gap-1">
                      <span v-for="addon in item.customization.addons" :key="addon.id || addon.name"
                        class="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        +{{ addon.name }} (${{ Number(addon.price).toFixed(2) }})
                      </span>
                    </div>

                    <!-- Item special notes -->
                    <p v-if="item.notes" class="text-[10px] text-slate-400 italic">
                      Note: "{{ item.notes }}"
                    </p>
                  </div>
                </div>

                <div class="text-right shrink-0">
                  <p class="font-bold text-white text-xs">
                    ${{ (Number(item.unitPrice) * item.quantity).toFixed(2) }}
                  </p>
                  <p class="text-[10px] text-slate-400">
                    {{ item.quantity }} × ${{ Number(item.unitPrice).toFixed(2) }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="p-4 border-t border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div class="text-[11px] text-slate-400">
            Order ID: <span class="font-mono text-slate-300">{{ order?.id }}</span>
          </div>
          <button @click="$emit('close')" type="button"
            class="px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-white font-medium text-xs border border-white/10 transition cursor-pointer">
            Close
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
const props = defineProps<{
  isOpen: boolean
  order: any | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'updated', order: any): void
}>()

const api = useApi()
const updatingStatus = ref(false)

const availableStatuses = [
  'PENDING',
  'ACCEPTED',
  'PREPARING',
  'READY_FOR_PICKUP',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'CANCELLED',
]

async function changeStatus(newStatus: string) {
  if (!props.order?.id) return
  updatingStatus.value = true
  try {
    const res = await api.put<any>(`/api/v1/orders/${props.order.id}/status`, {
      status: newStatus,
    })
    if (res?.order) {
      emit('updated', res.order)
    }
  } catch (err: any) {
    console.error('Failed to update status', err)
  } finally {
    updatingStatus.value = false
  }
}

function formatDate(dateString?: string) {
  if (!dateString) return '—'
  return new Date(dateString).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getOrderStatusClass(status?: string) {
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
