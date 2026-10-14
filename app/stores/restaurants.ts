import { defineStore } from 'pinia'
import type { RestaurantItem } from '~/components/restaurants/RestaurantCard.vue'

export interface VariantRow {
  name: string
  price: number | null
}

export interface AddonRow {
  name: string
  price: number | null
}

export interface CategoryPayload {
  name: string
  imageUrl?: string
  description?: string
  isGlobal?: boolean
}

export interface MenuItemPayload {
  name: string
  description?: string
  price: number
  categoryId: string
  imageUrl?: string
  isAvailable: boolean
  variants: Array<{ name: string; price: number }>
  addons: Array<{ name: string; price: number }>
}

export const useRestaurantStore = defineStore('restaurants', () => {
  const api = useApi()

  // -------------------------------------------------------------
  // LIST STATE (For /restaurants index page)
  // -------------------------------------------------------------
  const restaurantsList = ref<RestaurantItem[]>([])
  const isListLoading = ref(false)
  const searchQuery = ref('')
  const selectedFilter = ref('ALL')
  const currentPage = ref(1)
  const pagination = ref({
    total: 0,
    page: 1,
    limit: 9,
    totalPages: 1,
  })

  // List Computed
  const activeCount = computed(() =>
    restaurantsList.value.filter((r) => r.isActive !== false).length
  )
  const totalMenuItems = computed(() =>
    restaurantsList.value.reduce((acc, curr) => acc + (curr._count?.menuItems || 0), 0)
  )
  const totalActiveOrders = computed(() =>
    restaurantsList.value.reduce((acc, curr) => acc + (curr._count?.orders || 0), 0)
  )

  // -------------------------------------------------------------
  // DETAIL STATE (For /restaurants/[id] page)
  // -------------------------------------------------------------
  const currentRestaurant = ref<any | null>(null)
  const isDetailLoading = ref(false)
  const isRefreshing = ref(false)
  const isSubmitting = ref(false)
  const detailError = ref<string | null>(null)
  const statusMessage = ref<{ type: 'success' | 'error'; text: string } | null>(null)

  const activeTab = ref('menu')

  // Menu sub-state
  const menuItems = ref<any[]>([])
  const menuSearchQuery = ref('')
  const selectedCategoryFilter = ref('ALL')
  const menuPage = ref(1)
  const menuPagination = ref({ total: 0, page: 1, limit: 9, totalPages: 1 })

  // Orders sub-state
  const ordersList = ref<any[]>([])
  const ordersPage = ref(1)
  const ordersPagination = ref({ total: 0, page: 1, limit: 10, totalPages: 1 })

  // Staff sub-state
  const candidateUsers = ref<any[]>([])

  // -------------------------------------------------------------
  // LIST ACTIONS
  // -------------------------------------------------------------
  async function loadRestaurants() {
    isListLoading.value = true
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
    } catch {
      restaurantsList.value = []
    } finally {
      isListLoading.value = false
    }
  }

  function onListPageChange(newPage: number) {
    currentPage.value = newPage
    loadRestaurants()
  }

  function addCreatedRestaurant(newOutlet: RestaurantItem) {
    restaurantsList.value.unshift(newOutlet)
    pagination.value.total++
  }

  async function toggleRestaurantStatus(restaurant: RestaurantItem) {
    try {
      const res = await api.patch<{ status: string; restaurant: any }>(
        `/api/v1/owner/restaurants/${restaurant.id}/status`
      )
      if (res?.restaurant) {
        restaurant.isActive = res.restaurant.isActive
      }
    } catch (err: any) {
      throw createError({
        statusCode: 400,
        statusMessage: err?.data?.message || err?.message || 'Failed to toggle status',
      })
    }
  }

  // -------------------------------------------------------------
  // DETAIL ACTIONS
  // -------------------------------------------------------------
  async function fetchRestaurantDetails(id: string) {
    if (!id) return
    isRefreshing.value = true
    detailError.value = null

    try {
      const res = await api.get<any>(`/api/v1/owner/restaurants/${id}/details`)
      currentRestaurant.value = res.restaurant

      await Promise.all([
        loadMenuItems(id),
        loadOrders(id),
      ])
    } catch (err: any) {
      detailError.value = err?.data?.statusMessage || err?.message || 'Failed to load restaurant details'
    } finally {
      isDetailLoading.value = false
      isRefreshing.value = false
    }
  }

  async function loadMenuItems(restaurantId?: string) {
    const id = restaurantId || currentRestaurant.value?.id
    if (!id) return

    try {
      const res = await api.get<any>(`/api/v1/owner/restaurants/${id}/menu-items`, {
        params: {
          page: menuPage.value,
          limit: 9,
          categoryId: selectedCategoryFilter.value !== 'ALL' ? selectedCategoryFilter.value : undefined,
          search: menuSearchQuery.value.trim() || undefined,
        },
      })
      menuItems.value = res.menuItems || []
      if (res.pagination) {
        menuPagination.value = res.pagination
      }
    } catch {
      menuItems.value = []
    }
  }

  function onMenuPageChange(newPage: number) {
    menuPage.value = newPage
    loadMenuItems()
  }

  async function loadOrders(restaurantId?: string) {
    const id = restaurantId || currentRestaurant.value?.id
    if (!id) return

    try {
      const res = await api.get<any>(`/api/v1/owner/restaurants/${id}/orders`, {
        params: {
          page: ordersPage.value,
          limit: 10,
        },
      })
      ordersList.value = res.orders || []
      if (res.pagination) {
        ordersPagination.value = res.pagination
      }
    } catch {
      ordersList.value = []
    }
  }

  function onOrdersPageChange(newPage: number) {
    ordersPage.value = newPage
    loadOrders()
  }

  async function toggleCurrentOutletStatus() {
    if (!currentRestaurant.value) return
    isSubmitting.value = true
    try {
      const res = await api.patch<any>(`/api/v1/owner/restaurants/${currentRestaurant.value.id}/status`)
      if (res?.restaurant) {
        currentRestaurant.value.isActive = res.restaurant.isActive
        statusMessage.value = {
          type: 'success',
          text: `Outlet is now ${res.restaurant.isActive ? 'Active (Open)' : 'Inactive (Closed)'}`,
        }
      }
    } catch (err: any) {
      statusMessage.value = {
        type: 'error',
        text: err?.data?.statusMessage || err?.data?.message || err?.message || 'Failed to toggle status',
      }
    } finally {
      isSubmitting.value = false
    }
  }

  async function saveOutletSettings(formData: any) {
    if (!currentRestaurant.value) return
    isSubmitting.value = true
    try {
      const res = await api.put<any>(
        `/api/v1/owner/restaurants/${currentRestaurant.value.id}/details`,
        formData
      )
      if (res?.restaurant) {
        currentRestaurant.value = { ...currentRestaurant.value, ...res.restaurant }
        statusMessage.value = {
          type: 'success',
          text: 'Outlet details updated successfully',
        }
      }
    } catch (err: any) {
      statusMessage.value = {
        type: 'error',
        text: err?.data?.statusMessage || err?.data?.message || err?.message || 'Failed to save settings',
      }
    } finally {
      isSubmitting.value = false
    }
  }

  // --- Category Management ---
  async function saveCategory(payload: CategoryPayload, isEditing: boolean, editingId?: string | null) {
    if (!currentRestaurant.value) return
    isSubmitting.value = true
    try {
      if (isEditing && editingId) {
        const res = await api.put<any>(
          `/api/v1/owner/restaurants/${currentRestaurant.value.id}/categories/${editingId}`,
          payload
        )
        if (res?.category) {
          statusMessage.value = {
            type: 'success',
            text: `Category "${res.category.name}" updated`,
          }
          await fetchRestaurantDetails(currentRestaurant.value.id)
          return true
        }
      } else {
        const res = await api.post<any>(
          `/api/v1/owner/restaurants/${currentRestaurant.value.id}/categories`,
          payload
        )
        if (res?.category) {
          statusMessage.value = {
            type: 'success',
            text: `Category "${res.category.name}" created`,
          }
          await fetchRestaurantDetails(currentRestaurant.value.id)
          return true
        }
      }
    } catch (err: any) {
      statusMessage.value = {
        type: 'error',
        text: err?.data?.statusMessage || err?.data?.message || err?.message || 'Failed to save category',
      }
      return false
    } finally {
      isSubmitting.value = false
    }
  }

  async function deleteCategory(categoryId: string, categoryName: string) {
    if (!currentRestaurant.value) return
    isSubmitting.value = true
    try {
      const res = await api.delete<any>(
        `/api/v1/owner/restaurants/${currentRestaurant.value.id}/categories/${categoryId}`
      )
      if (res?.status === 'ok') {
        statusMessage.value = {
          type: 'success',
          text: `Category "${categoryName}" deleted`,
        }
        await fetchRestaurantDetails(currentRestaurant.value.id)
        return true
      }
    } catch (err: any) {
      statusMessage.value = {
        type: 'error',
        text: err?.data?.statusMessage || err?.data?.message || err?.message || 'Failed to delete category',
      }
      return false
    } finally {
      isSubmitting.value = false
    }
  }

  // --- Menu Item Management ---
  async function saveMenuItem(payload: MenuItemPayload, isEditing: boolean, editingId?: string | null) {
    if (!currentRestaurant.value) return
    isSubmitting.value = true
    try {
      if (isEditing && editingId) {
        const res = await api.put<any>(
          `/api/v1/owner/restaurants/${currentRestaurant.value.id}/menu-items/${editingId}`,
          payload
        )
        if (res?.menuItem) {
          statusMessage.value = {
            type: 'success',
            text: `Menu item "${res.menuItem.name}" updated successfully`,
          }
          await loadMenuItems()
          return true
        }
      } else {
        const res = await api.post<any>(
          `/api/v1/owner/restaurants/${currentRestaurant.value.id}/menu-items`,
          payload
        )
        if (res?.menuItem) {
          statusMessage.value = {
            type: 'success',
            text: `Menu item "${res.menuItem.name}" added successfully`,
          }
          await loadMenuItems()
          if (currentRestaurant.value._count) {
            currentRestaurant.value._count.menuItems = (currentRestaurant.value._count.menuItems || 0) + 1
          }
          return true
        }
      }
    } catch (err: any) {
      statusMessage.value = {
        type: 'error',
        text: err?.data?.statusMessage || err?.data?.message || err?.message || 'Failed to save menu item',
      }
      return false
    } finally {
      isSubmitting.value = false
    }
  }

  async function deleteMenuItem(item: any) {
    if (!currentRestaurant.value) return
    try {
      const res = await api.delete<any>(
        `/api/v1/owner/restaurants/${currentRestaurant.value.id}/menu-items/${item.id}`
      )
      if (res?.status === 'ok') {
        menuItems.value = menuItems.value.filter((m) => m.id !== item.id)
        statusMessage.value = {
          type: 'success',
          text: `"${item.name}" deleted from menu`,
        }
        if (currentRestaurant.value._count?.menuItems) {
          currentRestaurant.value._count.menuItems--
        }
        return true
      }
    } catch (err: any) {
      statusMessage.value = {
        type: 'error',
        text: err?.data?.statusMessage || err?.data?.message || err?.message || 'Failed to delete menu item',
      }
      return false
    }
  }

  // --- Staff Management ---
  async function loadCandidateUsers() {
    try {
      const res = await api.get<any>('/api/v1/admin/users')
      candidateUsers.value = res.users || []
    } catch {
      candidateUsers.value = []
    }
  }

  async function assignStaff(payload: { userId: string; permissions: string[]; isPrimary: boolean }) {
    if (!currentRestaurant.value) return
    isSubmitting.value = true
    try {
      const res = await api.post<any>(`/api/v1/admin/users/${payload.userId}/access`, {
        restaurantId: currentRestaurant.value.id,
        permissions: payload.permissions,
        isPrimary: payload.isPrimary,
      })
      if (res?.assignment) {
        statusMessage.value = {
          type: 'success',
          text: 'Staff access granted successfully',
        }
        await fetchRestaurantDetails(currentRestaurant.value.id)
        return true
      }
    } catch (err: any) {
      statusMessage.value = {
        type: 'error',
        text: err?.data?.statusMessage || err?.data?.message || err?.message || 'Failed to grant staff access',
      }
      return false
    } finally {
      isSubmitting.value = false
    }
  }

  async function revokeStaffAccess(staff: any) {
    if (!currentRestaurant.value) return
    isSubmitting.value = true
    try {
      const res = await api.delete<any>(
        `/api/v1/admin/users/${staff.userId}/access?restaurantId=${currentRestaurant.value.id}`
      )
      if (res?.status === 'ok') {
        statusMessage.value = {
          type: 'success',
          text: `Revoked access for ${staff.user?.name}`,
        }
        await fetchRestaurantDetails(currentRestaurant.value.id)
        return true
      }
    } catch (err: any) {
      statusMessage.value = {
        type: 'error',
        text: err?.data?.statusMessage || err?.data?.message || err?.message || 'Failed to revoke staff access',
      }
      return false
    } finally {
      isSubmitting.value = false
    }
  }

  return {
    // List
    restaurantsList,
    isListLoading,
    searchQuery,
    selectedFilter,
    currentPage,
    pagination,
    activeCount,
    totalMenuItems,
    totalActiveOrders,
    loadRestaurants,
    onListPageChange,
    addCreatedRestaurant,
    toggleRestaurantStatus,

    // Detail
    currentRestaurant,
    isDetailLoading,
    isRefreshing,
    isSubmitting,
    detailError,
    statusMessage,
    activeTab,
    menuItems,
    menuSearchQuery,
    selectedCategoryFilter,
    menuPage,
    menuPagination,
    ordersList,
    ordersPage,
    ordersPagination,
    candidateUsers,
    fetchRestaurantDetails,
    loadMenuItems,
    onMenuPageChange,
    loadOrders,
    onOrdersPageChange,
    toggleCurrentOutletStatus,
    saveOutletSettings,
    saveCategory,
    deleteCategory,
    saveMenuItem,
    deleteMenuItem,
    loadCandidateUsers,
    assignStaff,
    revokeStaffAccess,
  }
})
