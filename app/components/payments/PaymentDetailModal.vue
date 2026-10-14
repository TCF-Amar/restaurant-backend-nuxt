<template>
  <Teleport to="body">
    <transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0" leave-active-class="transition duration-150 ease-in" leave-to-class="opacity-0">
      <div v-if="payment" class="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto">
        <div class="w-full max-w-lg rounded-3xl glass-card border border-white/20 p-6 sm:p-7 space-y-5 shadow-2xl relative my-auto max-h-[85vh] overflow-y-auto">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-300">
                <LucideReceipt class="w-4 h-4" />
              </div>
              <div>
                <h3 class="text-base font-bold text-white">Payment Transaction</h3>
                <p class="text-xs text-slate-400 font-mono">{{ payment.transactionId || payment.id }}</p>
              </div>
            </div>

            <button @click="$emit('close')" type="button" class="text-slate-400 hover:text-white p-1">
              <LucideX class="w-4 h-4" />
            </button>
          </div>

          <div class="space-y-4 text-xs">
            <!-- Summary Grid -->
            <div class="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-white/[0.03] border border-white/10">
              <div>
                <span class="text-slate-400 text-[11px] block">Amount Charged</span>
                <span class="text-base font-bold text-white font-mono">${{ Number(payment.amount).toFixed(2) }} {{ payment.currency }}</span>
              </div>
              <div>
                <span class="text-slate-400 text-[11px] block">Current Status</span>
                <span class="font-bold text-emerald-300">{{ payment.status }}</span>
              </div>
              <div>
                <span class="text-slate-400 text-[11px] block">Payment Method</span>
                <span class="text-white">{{ formatMethod(payment.method) }}</span>
              </div>
              <div>
                <span class="text-slate-400 text-[11px] block">Order Number</span>
                <span class="font-mono text-indigo-300">{{ payment.order?.orderNumber }}</span>
              </div>
              <div>
                <span class="text-slate-400 text-[11px] block">Settlement Gateway</span>
                <span class="font-semibold text-purple-300">{{ payment.gateway || payment.method }}</span>
              </div>
              <div>
                <span class="text-slate-400 text-[11px] block">Currency</span>
                <span class="font-semibold text-slate-300">{{ payment.currency }}</span>
              </div>
            </div>

            <!-- Customer info -->
            <div class="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1">
              <span class="text-slate-400 text-[11px] block font-semibold uppercase">Customer Info</span>
              <p class="text-white font-medium">{{ payment.user?.name || 'Customer' }}</p>
              <p class="text-slate-400">{{ payment.user?.email || payment.user?.phone || 'No contact provided' }}</p>
            </div>

            <!-- Gateway & Transaction Audit Trail -->
            <div v-if="payment.transactionId || payment.gatewayOrderId || payment.gatewayPaymentId" class="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1.5 font-mono text-[11px]">
              <span class="text-slate-400 text-[10px] block font-sans font-semibold uppercase">Gateway Audit Trail</span>
              <div v-if="payment.transactionId" class="flex justify-between items-center text-slate-300">
                <span class="text-slate-500 font-sans">Transaction Ref:</span>
                <span class="text-indigo-200">{{ payment.transactionId }}</span>
              </div>
              <div v-if="payment.gatewayOrderId" class="flex justify-between items-center text-slate-300">
                <span class="text-slate-500 font-sans">Gateway Order:</span>
                <span class="text-amber-200">{{ payment.gatewayOrderId }}</span>
              </div>
              <div v-if="payment.gatewayPaymentId" class="flex justify-between items-center text-slate-300">
                <span class="text-slate-500 font-sans">Gateway Payment:</span>
                <span class="text-emerald-200">{{ payment.gatewayPaymentId }}</span>
              </div>
            </div>

            <!-- Refund reason if refunded -->
            <div v-if="payment.status === 'REFUNDED'" class="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-200">
              <strong class="block text-xs text-purple-300">Refund Notes:</strong>
              <span>{{ payment.refundReason || 'Merchant issued refund' }}</span>
            </div>

            <!-- Status Modification Form -->
            <form @submit.prevent="handleSubmit" class="space-y-3 pt-3 border-t border-white/10">
              <label class="block text-xs font-semibold text-slate-300">Update Settlement Status</label>
              <div class="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  @click="statusForm.status = 'COMPLETED'"
                  :class="[
                    'px-3 py-2 rounded-xl font-semibold border text-xs transition cursor-pointer',
                    statusForm.status === 'COMPLETED'
                      ? 'bg-emerald-600/30 border-emerald-500 text-emerald-200'
                      : 'bg-white/[0.03] border-white/10 text-slate-400 hover:text-white'
                  ]"
                >
                  Mark Paid
                </button>

                <button
                  type="button"
                  @click="statusForm.status = 'PENDING'"
                  :class="[
                    'px-3 py-2 rounded-xl font-semibold border text-xs transition cursor-pointer',
                    statusForm.status === 'PENDING'
                      ? 'bg-amber-600/30 border-amber-500 text-amber-200'
                      : 'bg-white/[0.03] border-white/10 text-slate-400 hover:text-white'
                  ]"
                >
                  Pending
                </button>

                <button
                  type="button"
                  @click="statusForm.status = 'REFUNDED'"
                  :class="[
                    'px-3 py-2 rounded-xl font-semibold border text-xs transition cursor-pointer',
                    statusForm.status === 'REFUNDED'
                      ? 'bg-purple-600/30 border-purple-500 text-purple-200'
                      : 'bg-white/[0.03] border-white/10 text-slate-400 hover:text-white'
                  ]"
                >
                  Refund
                </button>
              </div>

              <div v-if="statusForm.status === 'REFUNDED'" class="space-y-1.5 pt-1">
                <label class="text-[11px] text-slate-300">Refund Reason</label>
                <input
                  v-model="statusForm.refundReason"
                  type="text"
                  placeholder="Customer cancellation, item unavailable, etc."
                  class="w-full px-3 py-2 text-xs rounded-xl glass-input text-white focus:outline-none focus:ring-1 focus:ring-purple-500/50"
                />
              </div>

              <div class="flex items-center justify-end gap-2 pt-2">
                <button
                  @click="$emit('close')"
                  type="button"
                  class="px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 text-xs font-semibold transition cursor-pointer"
                >
                  Close
                </button>
                <button
                  :disabled="isUpdating"
                  type="submit"
                  class="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-bold transition shadow-lg flex items-center gap-2 cursor-pointer"
                >
                  <LucideLoader2 v-if="isUpdating" class="w-3.5 h-3.5 animate-spin" />
                  <span>Save Update</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup lang="ts">
const props = defineProps<{
  payment: any | null
  isUpdating?: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'update-status', payload: { status: string; refundReason?: string }): void
}>()

const statusForm = ref({
  status: 'COMPLETED',
  refundReason: '',
})

watch(
  () => props.payment,
  (newPayment) => {
    if (newPayment) {
      statusForm.value = {
        status: newPayment.status || 'COMPLETED',
        refundReason: newPayment.refundReason || '',
      }
    }
  },
  { immediate: true }
)

function handleSubmit() {
  emit('update-status', {
    status: statusForm.value.status,
    refundReason: statusForm.value.refundReason || undefined,
  })
}

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
</script>
