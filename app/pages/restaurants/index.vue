<template>
  <div class="max-w-7xl mx-auto space-y-6">
    <!-- Hero Banner Component -->
    <RestaurantHero :outlets-count="restaurantsList.length" :active-count="activeCount"
      :total-menu-items="totalMenuItems" :total-active-orders="totalActiveOrders" :is-admin="user?.role === 'ADMIN'"
      @create="isCreateModalOpen = true" />

    <!-- Filter & Search Controls Component -->
    <RestaurantFilters v-model:search-query="searchQuery" v-model:selected-filter="selectedFilter" />

    <!-- Loading State -->
    <div v-if="isLoading" class="p-12 text-center text-slate-400 text-xs">
      <LucideLoader2 class="w-6 h-6 animate-spin mx-auto text-indigo-400 mb-2" />
      <span>Loading restaurants...</span>
    </div>

    <!-- Restaurants Grid (Modular RestaurantCard components) -->
    <div v-else-if="filteredRestaurants.length > 0" class="space-y-6">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <RestaurantCard v-for="restaurant in filteredRestaurants" :key="restaurant.id" :restaurant="restaurant"
          @manage="handleManageOutlet" @toggle-status="handleToggleStatus" />
      </div>

      <!-- Pagination Component -->
      <AppPagination :page="pagination.page" :total-pages="pagination.totalPages" :total="pagination.total"
        :limit="pagination.limit" :loading="isLoading" @change="onPageChange" />
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
    <RestaurantCreateModal :is-open="isCreateModalOpen" @close="isCreateModalOpen = false"
      @created="handleRestaurantCreated" />
  </div>
</template>

<script setup lang="ts">
import type { RestaurantItem } from '~/components/restaurants/RestaurantCard.vue'


const { user } = useAuth()

const restaurantsList = ref<RestaurantItem[]>([])
const isLoading = ref(true)
const searchQuery = ref('')
const selectedFilter = ref('ALL')
const isCreateModalOpen = ref(false)
const currentPage = ref(1)
const pagination = ref({
  total: 0,
  page: 1,
  limit: 9,
  totalPages: 1,
})

const api = useApi()

// Fetch restaurants strictly from database API
async function loadRestaurants() {
  isLoading.value = true
  try {
    const res = await api.get<any>('/api/v1/owner/restaurants', {
      params: {
        page: currentPage.value,
        limit: 9,
        search: searchQuery.value.trim() || undefined,
        status: selectedFilter.value !== 'ALL' ? selectedFilter.value : undefined,
      },
    })
    restaurantsList.value = res?.restaurants || []
    if (res?.pagination) {
      pagination.value = res.pagination
    }
  } catch (err) {
    restaurantsList.value = []
  } finally {
    isLoading.value = false
  }
}

function onPageChange(newPage: number) {
  currentPage.value = newPage
  loadRestaurants()
}

watch([selectedFilter, searchQuery], () => {
  currentPage.value = 1
  loadRestaurants()
})

function handleRestaurantCreated(newOutlet: RestaurantItem) {
  restaurantsList.value.unshift(newOutlet)
}

async function handleManageOutlet(outletId: string) {
  if (!outletId) return
  await navigateTo(`/restaurants/${outletId}`)
}

async function handleToggleStatus(restaurant: RestaurantItem) {
  try {
    const res = await api.patch<{ status: string; restaurant: any }>(
      `/api/v1/owner/restaurants/${restaurant.id}/status`
    )
    if (res?.restaurant) {
      restaurant.isActive = res.restaurant.isActive
    }
  } catch (err: any) {
    alert(err?.data?.message || err?.message || 'Failed to toggle status')
  }
}

// Filtered restaurants computed (server-paginated)
const filteredRestaurants = computed(() => restaurantsList.value)

const activeCount = computed(() => restaurantsList.value.filter((r) => r.isActive !== false).length)
const totalMenuItems = computed(() =>
  restaurantsList.value.reduce((acc, curr) => acc + (curr._count?.menuItems || 0), 0)
)
const totalActiveOrders = computed(() =>
  restaurantsList.value.reduce((acc, curr) => acc + (curr._count?.orders || 0), 0)
)

onMounted(() => {
  loadRestaurants()
})
</script>
