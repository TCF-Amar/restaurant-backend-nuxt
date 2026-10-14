<template>
  <div class="rounded-3xl glass-card p-6 sm:p-8 border border-white/10 relative overflow-hidden shadow-2xl">
    <!-- Optional Banner Background overlay -->
    <div v-if="restaurant.bannerUrl" class="absolute inset-0 bg-cover bg-center opacity-15 pointer-events-none"
      :style="{ backgroundImage: `url(${restaurant.bannerUrl})` }"></div>
    <div
      class="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-gradient-to-br from-purple-500/20 to-indigo-500/20 blur-3xl pointer-events-none">
    </div>

    <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div class="flex items-start sm:items-center gap-4">
        <!-- Restaurant Logo / Initial Avatar -->
        <div
          class="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center font-black text-white text-2xl sm:text-3xl border border-white/20 shadow-xl shrink-0 overflow-hidden">
          <img v-if="restaurant.logoUrl" :src="restaurant.logoUrl" :alt="restaurant.name"
            class="w-full h-full object-cover" />
          <span v-else>{{ restaurant.name?.charAt(0).toUpperCase() }}</span>
        </div>

        <div class="space-y-1">
          <div class="flex flex-wrap items-center gap-2.5">
            <h1 class="text-xl sm:text-2xl font-black tracking-tight text-white">
              {{ restaurant.name }}
            </h1>

            <!-- Status Badge Button -->
            <button v-if="canManageOutlet"
              @click="$emit('toggle-status')" :disabled="isSubmitting" type="button"
              :title="restaurant.isActive ? 'Click to deactivate outlet' : 'Click to activate outlet'" :class="[
                'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition cursor-pointer active:scale-95 disabled:opacity-50',
                restaurant.isActive
                  ? 'bg-emerald-500/15 hover:bg-emerald-500/25 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/15 hover:bg-rose-500/25 border-rose-500/30 text-rose-300'
              ]">
              <span :class="[
                'w-2 h-2 rounded-full',
                restaurant.isActive ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
              ]"></span>
              <span>{{ restaurant.isActive ? 'Active (Open)' : 'Inactive (Closed)' }}</span>
            </button>
            <div v-else :class="[
              'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border',
              restaurant.isActive
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
            ]">
              <span :class="[
                'w-2 h-2 rounded-full',
                restaurant.isActive ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
              ]"></span>
              <span>{{ restaurant.isActive ? 'Active (Open)' : 'Inactive (Closed)' }}</span>
            </div>
          </div>

          <p class="text-xs text-slate-300 font-mono">@{{ restaurant.slug }}</p>

          <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300 pt-1">
            <span v-if="restaurant.address" class="inline-flex items-center gap-1.5 text-slate-300">
              <LucideMapPin class="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              {{ restaurant.address }}
            </span>
            <span v-if="restaurant.phone" class="inline-flex items-center gap-1.5 text-slate-300">
              <LucidePhone class="w-3.5 h-3.5 text-purple-400 shrink-0" />
              {{ restaurant.phone }}
            </span>
          </div>
        </div>
      </div>

      <!-- Quick Action Buttons -->
      <div class="flex flex-wrap items-center gap-2.5 self-start md:self-center">
        <NuxtLink v-if="canManageOrders"
          :to="`/orders?restaurantId=${restaurant.id}`"
          class="px-4 py-2 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-white text-xs font-semibold transition cursor-pointer flex items-center gap-2 shadow-lg">
          <LucideShoppingBag class="w-3.5 h-3.5 text-indigo-300" />
          <span>Live Kitchen Feed</span>
        </NuxtLink>

        <button v-if="canManageOutlet" @click="$emit('open-settings')"
          type="button"
          class="px-3.5 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-white text-xs font-semibold backdrop-blur-md transition cursor-pointer flex items-center gap-1.5">
          <LucideSettings class="w-3.5 h-3.5" />
          <span>Edit Details</span>
        </button>

        <button @click="$emit('refresh')" type="button"
          class="px-3 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-white text-xs font-semibold backdrop-blur-md transition cursor-pointer flex items-center gap-1.5">
          <LucideRotateCcw class="w-3.5 h-3.5" :class="{ 'animate-spin': isRefreshing }" />
          <span>Refresh</span>
        </button>
      </div>
    </div>

    <!-- Metrics Strip -->
    <div class="mt-6 pt-5 border-t border-white/[0.08] grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
      <div>
        <span class="text-slate-400 flex items-center gap-1.5">
          <LucideUtensils class="w-3.5 h-3.5 text-indigo-400" />
          Menu Items
        </span>
        <p class="text-lg font-bold text-white mt-0.5">{{ restaurant._count?.menuItems ?? totalMenuItems }}</p>
      </div>
      <div>
        <span class="text-slate-400 flex items-center gap-1.5">
          <LucideFolder class="w-3.5 h-3.5 text-purple-400" />
          Categories
        </span>
        <p class="text-lg font-bold text-purple-300 mt-0.5">{{ restaurant.categories?.length ?? 0 }}</p>
      </div>
      <div>
        <span class="text-slate-400 flex items-center gap-1.5">
          <LucideShoppingBag class="w-3.5 h-3.5 text-blue-400" />
          Total Orders
        </span>
        <p class="text-lg font-bold text-blue-300 mt-0.5">{{ restaurant._count?.orders ?? 0 }}</p>
      </div>
      <div>
        <span class="text-slate-400 flex items-center gap-1.5">
          <LucideUsers class="w-3.5 h-3.5 text-emerald-400" />
          Assigned Staff
        </span>
        <p class="text-lg font-bold text-emerald-300 mt-0.5">{{ restaurant.owners?.length ?? 0 }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  restaurant: any
  totalMenuItems: number
  canManageOutlet: boolean
  canManageOrders: boolean
  isSubmitting?: boolean
  isRefreshing?: boolean
}>()

defineEmits<{
  (e: 'toggle-status'): void
  (e: 'open-settings'): void
  (e: 'refresh'): void
}>()
</script>
