<template>
  <div class="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
    <!-- Search -->
    <div class="relative flex-1 max-w-md group">
      <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-400">
        <LucideSearch class="w-4 h-4" />
      </div>
      <input
        :value="searchQuery"
        @input="$emit('update:searchQuery', ($event.target as HTMLInputElement).value)"
        type="text"
        placeholder="Search by transaction ID, order #, or customer..."
        class="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl glass-input text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
      />
    </div>

    <!-- Filters: Status & Method -->
    <div class="flex flex-wrap items-center gap-2">
      <div class="flex items-center gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/10 text-xs">
        <button
          v-for="st in ['ALL', 'COMPLETED', 'PENDING', 'REFUNDED', 'FAILED']"
          :key="st"
          @click="$emit('update:selectedStatus', st)"
          type="button"
          :class="[
            'px-2.5 py-1 rounded-lg transition cursor-pointer font-medium text-[11px]',
            selectedStatus === st
              ? 'bg-emerald-600/40 text-white border border-emerald-500/50'
              : 'text-slate-400 hover:text-slate-200'
          ]"
        >
          {{ st }}
        </button>
      </div>

      <select
        :value="selectedMethod"
        @change="$emit('update:selectedMethod', ($event.target as HTMLSelectElement).value)"
        class="px-3 py-2 text-xs rounded-xl glass-input text-white focus:outline-none focus:ring-1 focus:ring-emerald-500/50 bg-[#141226] border border-white/10"
      >
        <option value="ALL" class="bg-slate-900 text-slate-400">All Methods</option>
        <option value="CASH_ON_DELIVERY" class="bg-slate-900 text-white">Cash on Delivery</option>
        <option value="CARD" class="bg-slate-900 text-white">Card</option>
        <option value="UPI" class="bg-slate-900 text-white">UPI Instant</option>
        <option value="ONLINE" class="bg-slate-900 text-white">Online Gateway</option>
        <option value="STRIPE" class="bg-slate-900 text-white">Stripe</option>
        <option value="RAZORPAY" class="bg-slate-900 text-white">Razorpay</option>
        <option value="WALLET" class="bg-slate-900 text-white">Wallet</option>
      </select>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  searchQuery: string
  selectedStatus: string
  selectedMethod: string
}>()

defineEmits<{
  (e: 'update:searchQuery', val: string): void
  (e: 'update:selectedStatus', val: string): void
  (e: 'update:selectedMethod', val: string): void
}>()
</script>
