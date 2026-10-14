<template>
  <div class="rounded-3xl glass-card p-6 sm:p-8 border border-white/10 relative overflow-hidden shadow-2xl">
    <div class="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 blur-3xl pointer-events-none"></div>

    <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div class="flex items-start sm:items-center gap-4">
        <!-- Large Avatar -->
        <div class="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center font-extrabold text-white text-2xl sm:text-3xl border border-white/20 shadow-xl shrink-0">
          {{ user.name.charAt(0).toUpperCase() }}
        </div>

        <div class="space-y-1">
          <div class="flex flex-wrap items-center gap-2">
            <h1 class="text-xl sm:text-2xl font-black tracking-tight text-white">
              {{ user.name }}
            </h1>

            <!-- Suspended / Active Badge -->
            <span
              :class="[
                'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border backdrop-blur-md',
                user.isSuspended
                  ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                  : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
              ]"
            >
              <span class="w-1.5 h-1.5 rounded-full" :class="user.isSuspended ? 'bg-rose-400 animate-pulse' : 'bg-emerald-400'"></span>
              {{ user.isSuspended ? 'Suspended' : 'Active Account' }}
            </span>

            <!-- Role Badge -->
            <span
              :class="[
                'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border backdrop-blur-md',
                user.role === 'ADMIN'
                  ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
                  : user.role === 'RESTAURANT_OWNER'
                  ? 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                  : user.role === 'DELIVERY_PARTNER'
                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                  : 'bg-blue-500/15 text-blue-300 border-blue-500/30'
              ]"
            >
              <LucideShield class="w-3 h-3" />
              {{ formatRole(user.role) }}
            </span>
          </div>

          <!-- Contact & ID info -->
          <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300">
            <span v-if="user.email" class="inline-flex items-center gap-1 text-slate-300">
              <LucideMail class="w-3.5 h-3.5 text-slate-400" />
              {{ user.email }}
            </span>
            <span v-if="user.phone" class="inline-flex items-center gap-1 text-slate-300">
              <LucidePhone class="w-3.5 h-3.5 text-slate-400" />
              {{ user.phone }}
            </span>
            <span class="inline-flex items-center gap-1 text-slate-400 font-mono text-[11px]">
              <LucideHash class="w-3.5 h-3.5 text-slate-500" />
              {{ user.id }}
            </span>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="flex flex-wrap items-center gap-2.5 self-start md:self-center">
        <!-- Toggle Suspend Button -->
        <button
          @click="$emit('toggle-suspend')"
          :disabled="isSubmitting"
          type="button"
          :class="[
            'px-4 py-2 rounded-xl text-xs font-semibold border backdrop-blur-md transition cursor-pointer flex items-center gap-2 shadow-lg disabled:opacity-50',
            user.isSuspended
              ? 'bg-emerald-500/20 hover:bg-emerald-500/30 border-emerald-500/40 text-emerald-300'
              : 'bg-rose-500/20 hover:bg-rose-500/30 border-rose-500/40 text-rose-300'
          ]"
        >
          <LucideUserCheck v-if="user.isSuspended" class="w-4 h-4" />
          <LucideUserX v-else class="w-4 h-4" />
          <span>{{ user.isSuspended ? 'Reactivate Account' : 'Suspend Account' }}</span>
        </button>

        <!-- Refresh Button -->
        <button
          @click="$emit('refresh')"
          type="button"
          class="px-3.5 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-white text-xs font-semibold backdrop-blur-md transition cursor-pointer flex items-center gap-1.5"
        >
          <LucideRotateCcw class="w-3.5 h-3.5" :class="{ 'animate-spin': isRefreshing }" />
          <span>Refresh</span>
        </button>
      </div>
    </div>

    <!-- Metrics Strip -->
    <div class="mt-6 pt-5 border-t border-white/[0.08] grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
      <div>
        <span class="text-slate-400 flex items-center gap-1.5">
          <LucideShoppingBag class="w-3.5 h-3.5 text-indigo-400" />
          Total Orders
        </span>
        <p class="text-lg font-bold text-white mt-0.5">{{ user._count?.orders ?? 0 }}</p>
      </div>
      <div>
        <span class="text-slate-400 flex items-center gap-1.5">
          <LucideKey class="w-3.5 h-3.5 text-purple-400" />
          Active Sessions
        </span>
        <p class="text-lg font-bold text-purple-300 mt-0.5">{{ user._count?.sessions ?? 0 }}</p>
      </div>
      <div>
        <span class="text-slate-400 flex items-center gap-1.5">
          <LucideStore class="w-3.5 h-3.5 text-blue-400" />
          Assigned Outlets
        </span>
        <p class="text-lg font-bold text-blue-300 mt-0.5">{{ user.restaurantStaff?.length ?? 0 }}</p>
      </div>
      <div>
        <span class="text-slate-400 flex items-center gap-1.5">
          <LucideCalendar class="w-3.5 h-3.5 text-emerald-400" />
          Joined On
        </span>
        <p class="text-sm font-semibold text-white mt-1">{{ formatDate(user.createdAt) }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  user: any
  isSubmitting?: boolean
  isRefreshing?: boolean
}>()

defineEmits<{
  (e: 'toggle-suspend'): void
  (e: 'refresh'): void
}>()

function formatRole(role: string) {
  if (role === 'RESTAURANT_OWNER') return 'Restaurant Owner'
  if (role === 'DELIVERY_PARTNER') return 'Delivery Partner'
  if (role === 'ADMIN') return 'Administrator'
  return 'Customer'
}

function formatDate(dateString?: string) {
  if (!dateString) return '—'
  return new Date(dateString).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}
</script>
