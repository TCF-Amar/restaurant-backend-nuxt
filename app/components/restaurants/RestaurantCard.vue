<template>
  <div class="rounded-2xl glass-card p-5 border border-white/10 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between">
    <div class="space-y-4">
      <!-- Top Row: Logo & Status Badge -->
      <div class="flex items-start justify-between gap-3">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-600/40 to-purple-600/40 border border-white/15 flex items-center justify-center text-lg font-bold text-white shadow-md">
            <span>{{ restaurant.name.charAt(0).toUpperCase() }}</span>
          </div>
          <div>
            <NuxtLink
              :to="`/restaurants/${restaurant.id}`"
              class="text-sm font-bold text-white hover:text-indigo-200 transition-colors block"
            >
              {{ restaurant.name }}
            </NuxtLink>
            <span class="text-[11px] font-mono text-slate-400">@{{ restaurant.slug }}</span>
          </div>
        </div>

        <!-- Interactive Status Badge / Toggle Button -->
        <button
          @click="$emit('toggle-status', restaurant)"
          type="button"
          :title="restaurant.isActive ? 'Click to deactivate outlet' : 'Click to activate outlet'"
          :class="[
            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border transition cursor-pointer active:scale-95',
            restaurant.isActive
              ? 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 hover:bg-rose-500/20 border-rose-500/30 text-rose-300'
          ]"
        >
          <span
            :class="[
              'w-1.5 h-1.5 rounded-full',
              restaurant.isActive ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
            ]"
          ></span>
          <span>{{ restaurant.isActive ? 'Active (Open)' : 'Inactive (Closed)' }}</span>
        </button>
      </div>

      <!-- Description / Address -->
      <p class="text-xs text-slate-300 line-clamp-2 leading-relaxed">
        {{ restaurant.description || 'Premium culinary experience with artisanal ingredients and rapid fulfillment.' }}
      </p>

      <div v-if="restaurant.address" class="flex items-center gap-1.5 text-[11px] text-slate-400">
        <LucideMapPin class="w-3.5 h-3.5 text-indigo-400 shrink-0" />
        <span class="truncate">{{ restaurant.address }}</span>
      </div>

      <!-- Stats / Counters Pills -->
      <div class="grid grid-cols-3 gap-2 pt-2 border-t border-white/[0.06] text-center text-xs">
        <div class="p-2 rounded-xl bg-white/[0.02] border border-white/[0.05]">
          <span class="text-[10px] text-slate-400 block">Categories</span>
          <strong class="text-white">{{ restaurant._count?.categories || 0 }}</strong>
        </div>
        <div class="p-2 rounded-xl bg-white/[0.02] border border-white/[0.05]">
          <span class="text-[10px] text-slate-400 block">Menu Items</span>
          <strong class="text-white">{{ restaurant._count?.menuItems || 0 }}</strong>
        </div>
        <div class="p-2 rounded-xl bg-white/[0.02] border border-white/[0.05]">
          <span class="text-[10px] text-slate-400 block">Live Orders</span>
          <strong class="text-indigo-300">{{ restaurant._count?.orders || 0 }}</strong>
        </div>
      </div>
    </div>

    <!-- Card Footer Actions -->
    <div class="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between gap-2">
      <NuxtLink
        :to="`/orders?restaurantId=${restaurant.id}`"
        class="text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1 transition"
      >
        <span>Live Feed</span>
        <LucideArrowUpRight class="w-3.5 h-3.5" />
      </NuxtLink>

      <button
        @click="$emit('manage', restaurant.id)"
        type="button"
        class="px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-white text-xs font-medium transition cursor-pointer"
      >
        Manage Outlet
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
export interface RestaurantItem {
  id: string
  name: string
  slug: string
  isActive?: boolean
  description?: string | null
  address?: string | null
  phone?: string | null
  _count?: {
    categories?: number
    menuItems?: number
    orders?: number
  }
}

defineProps<{
  restaurant: RestaurantItem
}>()

defineEmits<{
  (e: 'manage', id: string): void
  (e: 'toggle-status', restaurant: RestaurantItem): void
}>()
</script>
