<template>
  <div class="max-w-7xl mx-auto space-y-6">
    <!-- Top Hero Banner Component -->
    <PaymentHero
      :stats="stats"
      :loading="isLoading"
      @refresh="loadPayments"
    />

    <!-- Filters & Search Controls Component -->
    <PaymentFilters
      v-model:search-query="searchQuery"
      v-model:selected-status="selectedStatus"
      v-model:selected-method="selectedMethod"
    />

    <!-- Payments Data Table Component -->
    <PaymentTable
      :payments="paymentsList"
      :loading="isLoading"
      :pagination="pagination"
      @view-details="openDetails"
      @page-change="onPageChange"
    />

    <!-- Transaction Detail & Refund Modal Component -->
    <PaymentDetailModal
      :payment="selectedPayment"
      :is-updating="isUpdating"
      @close="selectedPayment = null"
      @update-status="updatePaymentStatus"
    />
  </div>
</template>

<script setup lang="ts">
const api = useApi()

const paymentsList = ref<any[]>([])
const isLoading = ref(true)
const isUpdating = ref(false)
const searchQuery = ref('')
const selectedStatus = ref('ALL')
const selectedMethod = ref('ALL')
const currentPage = ref(1)

const pagination = ref({
  total: 0,
  page: 1,
  limit: 10,
  totalPages: 1,
})

const stats = ref({
  totalVolume: '0.00',
  completedCount: 0,
  pendingCount: 0,
  refundedCount: 0,
  totalCount: 0,
})

const selectedPayment = ref<any | null>(null)

async function loadPayments() {
  isLoading.value = true
  try {
    const res = await api.get<any>('/api/v1/payments', {
      params: {
        page: currentPage.value,
        limit: 10,
        status: selectedStatus.value !== 'ALL' ? selectedStatus.value : undefined,
        method: selectedMethod.value !== 'ALL' ? selectedMethod.value : undefined,
        search: searchQuery.value.trim() || undefined,
      },
    })
    paymentsList.value = res?.payments || []
    if (res?.pagination) pagination.value = res.pagination
    if (res?.stats) stats.value = res.stats
  } catch (err) {
    paymentsList.value = []
  } finally {
    isLoading.value = false
  }
}

function onPageChange(newPage: number) {
  currentPage.value = newPage
  loadPayments()
}

watch([selectedStatus, selectedMethod, searchQuery], () => {
  currentPage.value = 1
  loadPayments()
})

function openDetails(payment: any) {
  selectedPayment.value = payment
}

async function updatePaymentStatus(payload: { status: string; refundReason?: string }) {
  if (!selectedPayment.value) return
  isUpdating.value = true
  try {
    const res = await api.patch<any>(`/api/v1/payments/${selectedPayment.value.id}/status`, {
      status: payload.status,
      refundReason: payload.refundReason,
    })
    if (res?.payment) {
      selectedPayment.value.status = res.payment.status
      selectedPayment.value.refundReason = res.payment.refundReason
      const idx = paymentsList.value.findIndex((p) => p.id === selectedPayment.value.id)
      if (idx !== -1) {
        paymentsList.value[idx] = { ...paymentsList.value[idx], ...res.payment }
      }
    }
    selectedPayment.value = null
    loadPayments()
  } catch (err: any) {
    alert(err?.data?.statusMessage || err?.message || 'Failed to update payment status')
  } finally {
    isUpdating.value = false
  }
}

onMounted(() => {
  loadPayments()
})
</script>
