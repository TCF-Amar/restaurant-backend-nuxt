<template>
  <div class="max-w-7xl mx-auto space-y-6">
    <!-- Hero Banner Component -->
    <RestaurantHero
      :outlets-count="restaurantsList.length"
      :active-count="activeCount"
      :total-menu-items="totalMenuItems"
      :total-active-orders="totalActiveOrders"
      :is-admin="user?.role === 'ADMIN'"
      @create="isCreateModalOpen = true"
    />

    <!-- Filter & Search Controls Component -->
    <RestaurantFilters
      v-model:search-query="searchQuery"
      v-model:selected-filter="selectedFilter"
    />

    <!-- Loading State -->
    <div v-if="isListLoading" class="p-12 text-center text-slate-400 text-xs">
      <LucideLoader2 class="w-6 h-6 animate-spin mx-auto text-indigo-400 mb-2" />
      <span>Loading restaurants...</span>
    </div>

    <!-- Restaurants Grid (Modular RestaurantCard components) -->
    <div v-else-if="restaurantsList.length > 0" class="space-y-6">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <RestaurantCard
          v-for="restaurant in restaurantsList"
          :key="restaurant.id"
          :restaurant="restaurant"
          @manage="handleManageOutlet"
          @toggle-status="handleToggleStatus"
        />
      </div>

      <!-- Pagination Component -->
      <AppPagination
        :page="pagination.page"
        :total-pages="pagination.totalPages"
        :total="pagination.total"
        :limit="pagination.limit"
        :loading="isListLoading"
        @change="restaurantStore.onListPageChange"
      />
    </div>

    <!-- Empty State -->
    <div v-else class="rounded-3xl glass-card p-12 text-center border border-white/10 space-y-3">
      <LucideUtensils class="w-10 h-10 text-slate-500 mx-auto" />
      <h3 class="text-sm font-semibold text-white">No Restaurants Found</h3>
      <p class="text-xs text-slate-400 max-w-sm mx-auto">
        No outlets matched your search criteria. Create your first restaurant outlet to begin managing menus.
      </p>
    </div>

    <!-- Create Restaurant Modal Dialog Component -->
    <RestaurantCreateModal
      :is-open="isCreateModalOpen"
      @close="isCreateModalOpen = false"
      @created="handleRestaurantCreated"
    />
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useRestaurantStore } from '~/stores/restaurants'
import type { RestaurantItem } from '~/components/restaurants/RestaurantCard.vue'

const { user } = useAuth()
const restaurantStore = useRestaurantStore()

const {
  restaurantsList,
  isListLoading,
  searchQuery,
  selectedFilter,
  currentPage,
  pagination,
  activeCount,
  totalMenuItems,
  totalActiveOrders,
} = storeToRefs(restaurantStore)

const isCreateModalOpen = ref(false)

watch([selectedFilter, searchQuery], () => {
  currentPage.value = 1
  restaurantStore.loadRestaurants()
})

function handleRestaurantCreated(newOutlet: RestaurantItem) {
  restaurantStore.addCreatedRestaurant(newOutlet)
}

async function handleManageOutlet(outletId: string) {
  if (!outletId) return
  await navigateTo(`/restaurants/${outletId}`)
}

async function handleToggleStatus(restaurant: RestaurantItem) {
  try {
    await restaurantStore.toggleRestaurantStatus(restaurant)
  } catch (err: any) {
    alert(err?.statusMessage || err?.message || 'Failed to toggle status')
  }
}

onMounted(() => {
  restaurantStore.loadRestaurants()
})
</script>
