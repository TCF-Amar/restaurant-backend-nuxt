<template>
  <div class="space-y-6">
    <!-- Account Diagnostics Card -->
    <div class="rounded-3xl glass-card p-6 border border-white/10 space-y-4">
      <div class="flex items-center gap-2">
        <div class="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-300">
          <LucideActivity class="w-4 h-4" />
        </div>
        <div>
          <h2 class="text-sm font-bold text-white">Account Diagnostics</h2>
          <p class="text-[11px] text-slate-400">Account identity, metadata, and timestamps</p>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        <div class="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
          <span class="text-slate-400 text-[11px]">User ID (UUID)</span>
          <p class="text-white font-mono text-[11px] select-all break-all">{{ user.id }}</p>
        </div>
        <div class="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
          <span class="text-slate-400 text-[11px]">Primary Email</span>
          <p class="text-white font-medium">{{ user.email || 'None Provided' }}</p>
        </div>
        <div class="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
          <span class="text-slate-400 text-[11px]">Contact Phone</span>
          <p class="text-white font-medium">{{ user.phone || 'None Provided' }}</p>
        </div>
        <div class="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
          <span class="text-slate-400 text-[11px]">Registered Date</span>
          <p class="text-white font-medium">{{ formatDate(user.createdAt) }}</p>
        </div>
      </div>
    </div>

    <!-- Customer Saved Addresses Card (from Mobile App) -->
    <div class="rounded-3xl glass-card p-6 border border-white/10 space-y-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300">
            <LucideMapPin class="w-4 h-4" />
          </div>
          <div>
            <h2 class="text-sm font-bold text-white">Customer Address Book</h2>
            <p class="text-[11px] text-slate-400">Delivery locations saved via Flutter mobile app</p>
          </div>
        </div>

        <span class="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/10 border border-indigo-500/30 text-indigo-300">
          {{ user.profile?.addresses?.length || 0 }} Address(es)
        </span>
      </div>

      <div v-if="user.profile?.addresses && user.profile.addresses.length > 0" class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div
          v-for="addr in user.profile.addresses"
          :key="addr.id"
          class="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2 hover:border-white/10 transition"
        >
          <div class="flex items-center justify-between">
            <span class="font-bold text-white text-xs flex items-center gap-1.5">
              <span>{{ addr.label || 'Address' }}</span>
              <span v-if="addr.isDefault" class="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Default
              </span>
            </span>
            <span class="text-[10px] text-slate-400">{{ addr.phone }}</span>
          </div>

          <div class="text-[11px] text-slate-300 space-y-0.5 leading-relaxed">
            <p class="font-medium text-slate-200">{{ addr.recipientName }}</p>
            <p>{{ addr.addressLine1 }}</p>
            <p v-if="addr.addressLine2">{{ addr.addressLine2 }}</p>
            <p v-if="addr.landmark" class="text-slate-400 text-[10px]">Landmark: {{ addr.landmark }}</p>
            <p class="text-slate-400 text-[10px]">{{ addr.city }}, {{ addr.state }} - {{ addr.postalCode }}</p>
          </div>
        </div>
      </div>

      <div v-else class="p-6 text-center text-slate-400 text-xs rounded-2xl bg-white/[0.01] border border-white/5">
        No delivery addresses registered for this customer yet.
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  user: any
}>()

function formatDate(dateString?: string) {
  if (!dateString) return '—'
  return new Date(dateString).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}
</script>
