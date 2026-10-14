<template>
  <div class="max-w-7xl mx-auto space-y-6">
    <!-- Breadcrumb & Back Navigation -->
    <div class="flex items-center gap-3">
      <NuxtLink to="/restaurants"
        class="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-slate-300 hover:text-white text-xs font-medium transition cursor-pointer">
        <LucideArrowLeft class="w-3.5 h-3.5" />
        <span>Back to Restaurants</span>
      </NuxtLink>
      <span class="text-slate-500 text-xs">/</span>
      <span class="text-slate-400 text-xs truncate max-w-xs">{{ restaurant?.name || 'Restaurant Details' }}</span>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="p-16 text-center text-slate-400 text-xs">
      <LucideLoader2 class="w-8 h-8 animate-spin mx-auto text-indigo-400 mb-3" />
      <span>Loading restaurant outlet details & menu...</span>
    </div>

    <!-- Error State -->
    <div v-else-if="fetchError" class="rounded-3xl glass-card p-10 text-center border border-rose-500/30 space-y-3">
      <LucideAlertTriangle class="w-10 h-10 text-rose-400 mx-auto" />
      <h3 class="text-base font-bold text-white">Outlet Not Found</h3>
      <p class="text-xs text-slate-400 max-w-md mx-auto">{{ fetchError }}</p>
      <NuxtLink to="/restaurants"
        class="inline-block mt-2 px-4 py-2 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-white text-xs font-semibold transition">
        Return to Restaurants
      </NuxtLink>
    </div>

    <!-- Main Content -->
    <div v-else-if="restaurant" class="space-y-6">
      <!-- Toast Alert -->
      <transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0 -translate-y-2"
        leave-active-class="transition duration-150 ease-in" leave-to-class="opacity-0 -translate-y-2">
        <div v-if="statusMessage" :class="[
          'p-4 rounded-2xl border text-xs font-medium flex items-center justify-between gap-3 shadow-lg backdrop-blur-md',
          statusMessage.type === 'success'
            ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-200'
            : 'bg-rose-500/15 border-rose-500/30 text-rose-200'
        ]">
          <div class="flex items-center gap-2.5">
            <LucideCheckCircle2 v-if="statusMessage.type === 'success'" class="w-4 h-4 text-emerald-400 shrink-0" />
            <LucideAlertTriangle v-else class="w-4 h-4 text-rose-400 shrink-0" />
            <span>{{ statusMessage.text }}</span>
          </div>
          <button @click="statusMessage = null" class="text-slate-400 hover:text-white p-1 rounded-lg">
            <LucideX class="w-3.5 h-3.5" />
          </button>
        </div>
      </transition>

      <!-- Outlet Hero Banner -->
      <RestaurantDetailHero :restaurant="restaurant" :total-menu-items="menuItems.length"
        :can-manage-outlet="isSuperAdmin || hasRestaurantPermission('MANAGE_OUTLET', restaurantId)"
        :can-manage-orders="isSuperAdmin || hasRestaurantPermission('MANAGE_ORDERS', restaurantId)"
        :is-submitting="isSubmitting" :is-refreshing="isRefreshing" @toggle-status="toggleOutletStatus"
        @open-settings="activeTab = 'settings'" @refresh="fetchRestaurantDetails" />

      <!-- Tab Navigation -->
      <div class="flex items-center gap-2 border-b border-white/[0.08] pb-3 overflow-x-auto text-xs">
        <button v-for="tab in tabs" :key="tab.id" @click="activeTab = tab.id" type="button" :class="[
          'px-4 py-2 rounded-xl font-semibold transition cursor-pointer flex items-center gap-2 whitespace-nowrap',
          activeTab === tab.id
            ? 'bg-indigo-600/30 border border-indigo-500/40 text-white shadow-md'
            : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
        ]">
          <LucideUtensils v-if="tab.id === 'menu'" class="w-3.5 h-3.5" />
          <LucideUsers v-else-if="tab.id === 'staff'" class="w-3.5 h-3.5" />
          <LucideShoppingBag v-else-if="tab.id === 'orders'" class="w-3.5 h-3.5" />
          <LucideSettings v-else-if="tab.id === 'settings'" class="w-3.5 h-3.5" />
          <span>{{ tab.label }}</span>
          <span v-if="tab.badge !== undefined"
            class="px-1.5 py-0.2 rounded-full text-[10px] bg-white/10 text-slate-300">
            {{ tab.badge }}
          </span>
        </button>
      </div>

      <!-- TAB 1: MENU ITEMS & CATEGORIES -->
      <RestaurantMenuTab v-if="activeTab === 'menu'" :menu-items="menuItems" :categories="restaurant.categories || []"
        :total-items="menuPagination.total || menuItems.length" v-model:search-query="menuSearchQuery"
        v-model:selected-category="selectedCategoryFilter"
        :can-manage-categories="isSuperAdmin || hasRestaurantPermission('MANAGE_CATEGORIES', restaurantId)"
        :can-manage-menu-items="isSuperAdmin || hasRestaurantPermission('MANAGE_MENU_ITEMS', restaurantId)"
        :loading="isLoading" :pagination="menuPagination" @open-manage-categories="showManageCategoriesModal = true"
        @open-add-category="openAddCategoryModal()" @open-add-item="openAddItemModal()"
        @edit-item="openEditMenuItemModal" @delete-item="deleteMenuItem" @page-change="onMenuPageChange" />

      <!-- TAB 2: AUTHORIZED STAFF & ACCESS CONTROL -->
      <RestaurantStaffTab v-else-if="activeTab === 'staff' && isSuperAdmin" :staff-list="restaurant.owners || []"
        @open-assign-staff="openAssignStaffModal" @revoke-staff="revokeStaffAccess" />

      <!-- TAB 3: RECENT ORDERS OVERVIEW -->
      <RestaurantOrdersTab
        v-else-if="activeTab === 'orders' && (isSuperAdmin || hasRestaurantPermission('MANAGE_ORDERS', restaurantId))"
        :restaurant-id="restaurant.id" :restaurant-name="restaurant.name" :orders="ordersList" :loading="isLoading"
        :pagination="ordersPagination" @page-change="onOrdersPageChange" />

      <!-- TAB 4: OUTLET SETTINGS -->
      <RestaurantSettingsTab
        v-else-if="activeTab === 'settings' && (isSuperAdmin || hasRestaurantPermission('MANAGE_OUTLET', restaurantId))"
        :form="editForm" :is-submitting="isSubmitting" @save-settings="saveOutletSettings" />
    </div>

    <!-- MODAL 1: ADD / EDIT MENU ITEM -->
    <MenuItemModal :show="showAddItemModal" :is-editing="isEditingItem" :is-submitting="isSubmitting"
      :categories="restaurant?.categories || []" :form="newItemForm" @close="showAddItemModal = false"
      @save="saveMenuItem" @add-variant="addVariantRow" @remove-variant="removeVariantRow" @add-addon="addAddonRow"
      @remove-addon="removeAddonRow" />

    <!-- MODAL 2: MANAGE ALL CATEGORIES -->
    <ManageCategoriesModal :show="showManageCategoriesModal" :categories="restaurant?.categories || []"
      :user-role="user?.role" @close="showManageCategoriesModal = false" @open-add-category="openAddCategoryModal()"
      @edit-category="openEditCategoryModal" @delete-category="deleteCategory" />

    <!-- MODAL 3: ADD / EDIT CATEGORY -->
    <CategoryModal :show="showAddCategoryModal" :is-editing="isEditingCategory" :is-admin="user?.role === 'ADMIN'"
      :is-submitting="isSubmitting" :form="categoryForm" @close="showAddCategoryModal = false" @save="saveCategory" />

    <!-- MODAL 4: ASSIGN NEW STAFF MEMBER -->
    <AssignStaffModal :show="showAssignStaffModal && isSuperAdmin" :is-submitting="isSubmitting"
      :candidate-users="candidateUsers" :form="staffForm" @close="showAssignStaffModal = false"
      @submit="saveStaffAssignment" />
  </div>
</template>

<script setup lang="ts">

const route = useRoute()
const restaurantId = computed(() => String(route.params.id))
const api = useApi()

const restaurant = ref<any>(null)
const menuItems = ref<any[]>([])
const ordersList = ref<any[]>([])
const candidateUsers = ref<any[]>([])

const isLoading = ref(true)
const isRefreshing = ref(false)
const isSubmitting = ref(false)
const fetchError = ref<string | null>(null)
const statusMessage = ref<{ type: 'success' | 'error'; text: string } | null>(null)

const activeTab = ref('menu')
const menuSearchQuery = ref('')
const selectedCategoryFilter = ref('ALL')

const menuPage = ref(1)
const menuPagination = ref({ total: 0, page: 1, limit: 9, totalPages: 1 })

const ordersPage = ref(1)
const ordersPagination = ref({ total: 0, page: 1, limit: 10, totalPages: 1 })

const { user, isSuperAdmin, hasRestaurantPermission } = useAuth()

// Modals
const showManageCategoriesModal = ref(false)
const showAddItemModal = ref(false)
const showAddCategoryModal = ref(false)
const showAssignStaffModal = ref(false)

const isEditingCategory = ref(false)
const editingCategoryId = ref<string | null>(null)

const isEditingItem = ref(false)
const editingItemId = ref<string | null>(null)

interface VariantRow {
  name: string
  price: number | null
}

interface AddonRow {
  name: string
  price: number | null
}

// Forms
const newItemForm = ref({
  name: '',
  description: '',
  price: null as number | null,
  categoryId: '',
  imageUrl: '',
  isAvailable: true,
  variants: [] as VariantRow[],
  addons: [] as AddonRow[],
})

const categoryForm = ref({
  name: '',
  imageUrl: '',
  description: '',
  isGlobal: false,
})

const staffForm = ref({
  userId: '',
  permissions: ['MANAGE_OUTLET', 'MANAGE_CATEGORIES', 'MANAGE_MENU_ITEMS', 'MANAGE_ORDERS'],
  isPrimary: false,
})

const editForm = ref({
  name: '',
  description: '',
  address: '',
  phone: '',
  logoUrl: '',
  bannerUrl: '',
})

const tabs = computed(() => {
  const list = [
    { id: 'menu', label: 'Menu & Dishes', badge: menuPagination.value.total || menuItems.value.length },
  ]
  if (isSuperAdmin.value) {
    list.push({ id: 'staff', label: 'Staff & Roles', badge: restaurant.value?.owners?.length || 0 })
  }
  if (isSuperAdmin.value || hasRestaurantPermission('MANAGE_ORDERS', restaurantId.value)) {
    list.push({ id: 'orders', label: 'Live Orders', badge: ordersPagination.value.total || restaurant.value?._count?.orders || 0 })
  }
  if (isSuperAdmin.value || hasRestaurantPermission('MANAGE_OUTLET', restaurantId.value)) {
    list.push({ id: 'settings', label: 'Outlet Settings' })
  }
  return list
})

watch(tabs, (currentTabs) => {
  if (!currentTabs.some(t => t.id === activeTab.value)) {
    activeTab.value = 'menu'
  }
})

async function fetchRestaurantDetails() {
  if (!restaurantId.value) return
  isRefreshing.value = true
  fetchError.value = null

  try {
    const res = await api.get<any>(`/api/v1/owner/restaurants/${restaurantId.value}/details`)
    restaurant.value = res.restaurant

    // Populate edit form
    editForm.value = {
      name: res.restaurant.name || '',
      description: res.restaurant.description || '',
      address: res.restaurant.address || '',
      phone: res.restaurant.phone || '',
      logoUrl: res.restaurant.logoUrl || '',
      bannerUrl: res.restaurant.bannerUrl || '',
    }

    if (res.restaurant.categories && res.restaurant.categories.length > 0 && !newItemForm.value.categoryId) {
      newItemForm.value.categoryId = res.restaurant.categories[0].id
    }

    await loadMenuItems()
    await loadOrders()
  } catch (err: any) {
    fetchError.value = err?.data?.statusMessage || err?.message || 'Failed to load restaurant details'
  } finally {
    isLoading.value = false
    isRefreshing.value = false
  }
}

async function loadMenuItems() {
  try {
    const res = await api.get<any>(`/api/v1/owner/restaurants/${restaurantId.value}/menu-items`, {
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

watch([selectedCategoryFilter, menuSearchQuery], () => {
  menuPage.value = 1
  loadMenuItems()
})

async function loadOrders() {
  try {
    const res = await api.get<any>(`/api/v1/owner/restaurants/${restaurantId.value}/orders`, {
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

async function toggleOutletStatus() {
  if (!restaurant.value) return

  isSubmitting.value = true
  try {
    const res = await api.patch<any>(`/api/v1/owner/restaurants/${restaurantId.value}/status`)
    if (res?.restaurant) {
      restaurant.value.isActive = res.restaurant.isActive
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

async function saveOutletSettings() {
  isSubmitting.value = true
  try {
    const res = await api.put<any>(`/api/v1/owner/restaurants/${restaurantId.value}/details`, editForm.value)

    if (res?.restaurant) {
      restaurant.value = { ...restaurant.value, ...res.restaurant }
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

function openAddCategoryModal() {
  isEditingCategory.value = false
  editingCategoryId.value = null
  categoryForm.value = {
    name: '',
    imageUrl: '',
    description: '',
    isGlobal: false,
  }
  showAddCategoryModal.value = true
}

function openEditCategoryModal(cat: any) {
  isEditingCategory.value = true
  editingCategoryId.value = cat.id
  categoryForm.value = {
    name: cat.name,
    imageUrl: cat.imageUrl || '',
    description: cat.description || '',
    isGlobal: !cat.restaurantId,
  }
  showAddCategoryModal.value = true
}

async function saveCategory() {
  if (!categoryForm.value.name.trim()) return

  isSubmitting.value = true
  try {
    const payload = {
      name: categoryForm.value.name.trim(),
      imageUrl: categoryForm.value.imageUrl?.trim() || undefined,
      description: categoryForm.value.description?.trim() || undefined,
    }

    if (isEditingCategory.value && editingCategoryId.value) {
      const res = await api.put<any>(
        `/api/v1/owner/restaurants/${restaurantId.value}/categories/${editingCategoryId.value}`,
        payload
      )
      if (res?.category) {
        showAddCategoryModal.value = false
        statusMessage.value = {
          type: 'success',
          text: `Category "${res.category.name}" updated`,
        }
        await fetchRestaurantDetails()
      }
    } else {
      const res = await api.post<any>(
        `/api/v1/owner/restaurants/${restaurantId.value}/categories`,
        {
          ...payload,
          isGlobal: categoryForm.value.isGlobal,
        }
      )
      if (res?.category) {
        showAddCategoryModal.value = false
        statusMessage.value = {
          type: 'success',
          text: `Category "${res.category.name}" created`,
        }
        await fetchRestaurantDetails()
      }
    }
  } catch (err: any) {
    statusMessage.value = {
      type: 'error',
      text: err?.data?.statusMessage || err?.data?.message || err?.message || 'Failed to save category',
    }
  } finally {
    isSubmitting.value = false
  }
}

async function deleteCategory(cat: any) {
  const isGlobal = !cat.restaurantId
  const confirmMsg = isGlobal
    ? `Delete platform-wide global category "${cat.name}"? This removes it for all restaurants.`
    : `Delete category "${cat.name}" from this restaurant?`

  if (!confirm(confirmMsg)) return

  isSubmitting.value = true
  try {
    const res = await api.delete<any>(
      `/api/v1/owner/restaurants/${restaurantId.value}/categories/${cat.id}`
    )
    if (res?.status === 'ok') {
      statusMessage.value = {
        type: 'success',
        text: `Category "${cat.name}" deleted`,
      }
      await fetchRestaurantDetails()
    }
  } catch (err: any) {
    statusMessage.value = {
      type: 'error',
      text: err?.data?.statusMessage || err?.data?.message || err?.message || 'Failed to delete category',
    }
  } finally {
    isSubmitting.value = false
  }
}

function openAddItemModal() {
  isEditingItem.value = false
  editingItemId.value = null
  newItemForm.value = {
    name: '',
    description: '',
    price: null,
    categoryId: restaurant.value?.categories?.[0]?.id || '',
    imageUrl: '',
    isAvailable: true,
    variants: [],
    addons: [],
  }
  showAddItemModal.value = true
}

function openEditMenuItemModal(item: any) {
  isEditingItem.value = true
  editingItemId.value = item.id
  newItemForm.value = {
    name: item.name,
    description: item.description || '',
    price: Number(item.price),
    categoryId: item.categoryId || (restaurant.value?.categories?.[0]?.id || ''),
    imageUrl: item.imageUrl || '',
    isAvailable: item.isAvailable !== false,
    variants: (item.variants || []).map((v: any) => ({ name: v.name, price: Number(v.price) })),
    addons: (item.addons || []).map((a: any) => ({ name: a.name, price: Number(a.price) })),
  }
  showAddItemModal.value = true
}

function addVariantRow() {
  newItemForm.value.variants.push({ name: '', price: null })
}

function removeVariantRow(index: number) {
  newItemForm.value.variants.splice(index, 1)
}

function addAddonRow() {
  newItemForm.value.addons.push({ name: '', price: null })
}

function removeAddonRow(index: number) {
  newItemForm.value.addons.splice(index, 1)
}

async function saveMenuItem() {
  if (!newItemForm.value.name || !newItemForm.value.price || !newItemForm.value.categoryId) return

  const validVariants = newItemForm.value.variants
    .filter((v) => v.name.trim() && v.price !== null && Number(v.price) > 0)
    .map((v) => ({ name: v.name.trim(), price: Number(v.price) }))

  const validAddons = newItemForm.value.addons
    .filter((a) => a.name.trim() && a.price !== null && Number(a.price) >= 0)
    .map((a) => ({ name: a.name.trim(), price: Number(a.price) }))

  isSubmitting.value = true
  try {
    const payload = {
      name: newItemForm.value.name.trim(),
      description: newItemForm.value.description?.trim() || undefined,
      price: Number(newItemForm.value.price),
      categoryId: newItemForm.value.categoryId,
      imageUrl: newItemForm.value.imageUrl?.trim() || undefined,
      isAvailable: newItemForm.value.isAvailable,
      variants: validVariants,
      addons: validAddons,
    }

    if (isEditingItem.value && editingItemId.value) {
      const res = await api.put<any>(
        `/api/v1/owner/restaurants/${restaurantId.value}/menu-items/${editingItemId.value}`,
        payload
      )
      if (res?.menuItem) {
        showAddItemModal.value = false
        statusMessage.value = {
          type: 'success',
          text: `Menu item "${res.menuItem.name}" updated successfully`,
        }
        await loadMenuItems()
      }
    } else {
      const res = await api.post<any>(
        `/api/v1/owner/restaurants/${restaurantId.value}/menu-items`,
        payload
      )
      if (res?.menuItem) {
        showAddItemModal.value = false
        statusMessage.value = {
          type: 'success',
          text: `Menu item "${res.menuItem.name}" added successfully`,
        }
        await loadMenuItems()
        if (restaurant.value._count) {
          restaurant.value._count.menuItems = (restaurant.value._count.menuItems || 0) + 1
        }
      }
    }
  } catch (err: any) {
    statusMessage.value = {
      type: 'error',
      text: err?.data?.statusMessage || err?.data?.message || err?.message || 'Failed to save menu item',
    }
  } finally {
    isSubmitting.value = false
  }
}

async function deleteMenuItem(item: any) {
  if (!confirm(`Delete "${item.name}" from the menu?`)) return

  try {
    const res = await api.delete<any>(`/api/v1/owner/restaurants/${restaurantId.value}/menu-items/${item.id}`)
    if (res?.status === 'ok') {
      menuItems.value = menuItems.value.filter((m) => m.id !== item.id)
      statusMessage.value = {
        type: 'success',
        text: `"${item.name}" deleted from menu`,
      }
      if (restaurant.value._count?.menuItems) {
        restaurant.value._count.menuItems--
      }
    }
  } catch (err: any) {
    statusMessage.value = {
      type: 'error',
      text: err?.data?.statusMessage || err?.data?.message || err?.message || 'Failed to delete menu item',
    }
  }
}

async function openAssignStaffModal() {
  try {
    const res = await api.get<any>('/api/v1/admin/users')
    candidateUsers.value = res.users || []
  } catch {
    candidateUsers.value = []
  }
  staffForm.value = {
    userId: candidateUsers.value[0]?.id || '',
    permissions: ['MANAGE_OUTLET', 'MANAGE_CATEGORIES', 'MANAGE_MENU_ITEMS', 'MANAGE_ORDERS'],
    isPrimary: false,
  }
  showAssignStaffModal.value = true
}

async function saveStaffAssignment() {
  if (!staffForm.value.userId || staffForm.value.permissions.length === 0) return

  isSubmitting.value = true
  try {
    const res = await api.post<any>(`/api/v1/admin/users/${staffForm.value.userId}/access`, {
      restaurantId: restaurantId.value,
      permissions: staffForm.value.permissions,
      isPrimary: staffForm.value.isPrimary,
    })

    if (res?.assignment) {
      showAssignStaffModal.value = false
      statusMessage.value = {
        type: 'success',
        text: 'Staff access granted successfully',
      }
      await fetchRestaurantDetails()
    }
  } catch (err: any) {
    statusMessage.value = {
      type: 'error',
      text: err?.data?.statusMessage || err?.data?.message || err?.message || 'Failed to grant staff access',
    }
  } finally {
    isSubmitting.value = false
  }
}

async function revokeStaffAccess(staff: any) {
  if (!confirm(`Revoke outlet staff access for "${staff.user?.name}"?`)) return

  isSubmitting.value = true
  try {
    const res = await api.delete<any>(`/api/v1/admin/users/${staff.userId}/access?restaurantId=${restaurantId.value}`)

    if (res?.status === 'ok') {
      statusMessage.value = {
        type: 'success',
        text: `Revoked access for ${staff.user?.name}`,
      }
      await fetchRestaurantDetails()
    }
  } catch (err: any) {
    statusMessage.value = {
      type: 'error',
      text: err?.data?.statusMessage || err?.data?.message || err?.message || 'Failed to revoke staff access',
    }
  } finally {
    isSubmitting.value = false
  }
}

onMounted(() => {
  fetchRestaurantDetails()
})
</script>
