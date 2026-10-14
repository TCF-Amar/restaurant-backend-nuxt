<template>
  <div class="max-w-7xl mx-auto space-y-6">
    <!-- Breadcrumb & Back Navigation -->
    <div class="flex items-center gap-3">
      <NuxtLink
        to="/restaurants"
        class="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-slate-300 hover:text-white text-xs font-medium transition cursor-pointer"
      >
        <LucideArrowLeft class="w-3.5 h-3.5" />
        <span>Back to Restaurants</span>
      </NuxtLink>
      <span class="text-slate-500 text-xs">/</span>
      <span class="text-slate-400 text-xs truncate max-w-xs">{{ restaurant?.name || 'Restaurant Details' }}</span>
    </div>

    <!-- Loading State -->
    <div v-if="isDetailLoading" class="p-16 text-center text-slate-400 text-xs">
      <LucideLoader2 class="w-8 h-8 animate-spin mx-auto text-indigo-400 mb-3" />
      <span>Loading restaurant outlet details & menu...</span>
    </div>

    <!-- Error State -->
    <div v-else-if="detailError" class="rounded-3xl glass-card p-10 text-center border border-rose-500/30 space-y-3">
      <LucideAlertTriangle class="w-10 h-10 text-rose-400 mx-auto" />
      <h3 class="text-base font-bold text-white">Outlet Not Found</h3>
      <p class="text-xs text-slate-400 max-w-md mx-auto">{{ detailError }}</p>
      <NuxtLink
        to="/restaurants"
        class="inline-block mt-2 px-4 py-2 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-white text-xs font-semibold transition"
      >
        Return to Restaurants
      </NuxtLink>
    </div>

    <!-- Main Content -->
    <div v-else-if="restaurant" class="space-y-6">
      <!-- Toast Alert -->
      <transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0 -translate-y-2"
        leave-active-class="transition duration-150 ease-in"
        leave-to-class="opacity-0 -translate-y-2"
      >
        <div
          v-if="statusMessage"
          :class="[
            'p-4 rounded-2xl border text-xs font-medium flex items-center justify-between gap-3 shadow-lg backdrop-blur-md',
            statusMessage.type === 'success'
              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-200'
              : 'bg-rose-500/15 border-rose-500/30 text-rose-200'
          ]"
        >
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
      <RestaurantDetailHero
        :restaurant="restaurant"
        :total-menu-items="menuItems.length"
        :can-manage-outlet="isSuperAdmin || hasRestaurantPermission('MANAGE_OUTLET', restaurantId)"
        :can-manage-orders="isSuperAdmin || hasRestaurantPermission('MANAGE_ORDERS', restaurantId)"
        :is-submitting="isSubmitting"
        :is-refreshing="isRefreshing"
        @toggle-status="restaurantStore.toggleCurrentOutletStatus"
        @open-settings="activeTab = 'settings'"
        @refresh="refreshDetails"
      />

      <!-- Tab Navigation -->
      <div class="flex items-center gap-2 border-b border-white/[0.08] pb-3 overflow-x-auto text-xs">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          @click="activeTab = tab.id"
          type="button"
          :class="[
            'px-4 py-2 rounded-xl font-semibold transition cursor-pointer flex items-center gap-2 whitespace-nowrap',
            activeTab === tab.id
              ? 'bg-indigo-600/30 border border-indigo-500/40 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
          ]"
        >
          <LucideUtensils v-if="tab.id === 'menu'" class="w-3.5 h-3.5" />
          <LucideUsers v-else-if="tab.id === 'staff'" class="w-3.5 h-3.5" />
          <LucideShoppingBag v-else-if="tab.id === 'orders'" class="w-3.5 h-3.5" />
          <LucideSettings v-else-if="tab.id === 'settings'" class="w-3.5 h-3.5" />
          <span>{{ tab.label }}</span>
          <span
            v-if="tab.badge !== undefined"
            class="px-1.5 py-0.2 rounded-full text-[10px] bg-white/10 text-slate-300"
          >
            {{ tab.badge }}
          </span>
        </button>
      </div>

      <!-- TAB 1: MENU ITEMS & CATEGORIES -->
      <RestaurantMenuTab
        v-if="activeTab === 'menu'"
        :menu-items="menuItems"
        :categories="restaurant.categories || []"
        :total-items="menuPagination.total || menuItems.length"
        v-model:search-query="menuSearchQuery"
        v-model:selected-category="selectedCategoryFilter"
        :can-manage-categories="isSuperAdmin || hasRestaurantPermission('MANAGE_CATEGORIES', restaurantId)"
        :can-manage-menu-items="isSuperAdmin || hasRestaurantPermission('MANAGE_MENU_ITEMS', restaurantId)"
        :loading="isDetailLoading"
        :pagination="menuPagination"
        @open-manage-categories="showManageCategoriesModal = true"
        @open-add-category="openAddCategoryModal()"
        @open-add-item="openAddItemModal()"
        @edit-item="openEditMenuItemModal"
        @delete-item="handleDeleteMenuItem"
        @page-change="restaurantStore.onMenuPageChange"
      />

      <!-- TAB 2: AUTHORIZED STAFF & ACCESS CONTROL -->
      <RestaurantStaffTab
        v-else-if="activeTab === 'staff' && isSuperAdmin"
        :staff-list="restaurant.owners || []"
        @open-assign-staff="openAssignStaffModal"
        @revoke-staff="handleRevokeStaff"
      />

      <!-- TAB 3: RECENT ORDERS OVERVIEW -->
      <RestaurantOrdersTab
        v-else-if="activeTab === 'orders' && (isSuperAdmin || hasRestaurantPermission('MANAGE_ORDERS', restaurantId))"
        :restaurant-id="restaurant.id"
        :restaurant-name="restaurant.name"
        :orders="ordersList"
        :loading="isDetailLoading"
        :pagination="ordersPagination"
        @page-change="restaurantStore.onOrdersPageChange"
      />

      <!-- TAB 4: OUTLET SETTINGS -->
      <RestaurantSettingsTab
        v-else-if="activeTab === 'settings' && (isSuperAdmin || hasRestaurantPermission('MANAGE_OUTLET', restaurantId))"
        :form="editForm"
        :is-submitting="isSubmitting"
        @save-settings="handleSaveSettings"
      />
    </div>

    <!-- MODAL 1: ADD / EDIT MENU ITEM -->
    <MenuItemModal
      :show="showAddItemModal"
      :is-editing="isEditingItem"
      :is-submitting="isSubmitting"
      :categories="restaurant?.categories || []"
      :form="newItemForm"
      @close="showAddItemModal = false"
      @save="handleSaveMenuItem"
      @add-variant="addVariantRow"
      @remove-variant="removeVariantRow"
      @add-addon="addAddonRow"
      @remove-addon="removeAddonRow"
    />

    <!-- MODAL 2: MANAGE ALL CATEGORIES -->
    <ManageCategoriesModal
      :show="showManageCategoriesModal"
      :categories="restaurant?.categories || []"
      :user-role="user?.role"
      @close="showManageCategoriesModal = false"
      @open-add-category="openAddCategoryModal()"
      @edit-category="openEditCategoryModal"
      @delete-category="handleDeleteCategory"
    />

    <!-- MODAL 3: ADD / EDIT CATEGORY -->
    <CategoryModal
      :show="showAddCategoryModal"
      :is-editing="isEditingCategory"
      :is-admin="user?.role === 'ADMIN'"
      :is-submitting="isSubmitting"
      :form="categoryForm"
      @close="showAddCategoryModal = false"
      @save="handleSaveCategory"
    />

    <!-- MODAL 4: ASSIGN NEW STAFF MEMBER -->
    <AssignStaffModal
      :show="showAssignStaffModal && isSuperAdmin"
      :is-submitting="isSubmitting"
      :candidate-users="candidateUsers"
      :form="staffForm"
      @close="showAssignStaffModal = false"
      @submit="handleSaveStaffAssignment"
    />
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useRestaurantStore } from '~/stores/restaurants'

const route = useRoute()
const restaurantId = computed(() => String(route.params.id))
const { user, isSuperAdmin, hasRestaurantPermission } = useAuth()
const restaurantStore = useRestaurantStore()

const {
  currentRestaurant: restaurant,
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
  ordersPagination,
  candidateUsers,
} = storeToRefs(restaurantStore)

// Local UI Modal Visibility State
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

// Local Forms
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

// Sync edit form with current restaurant details
watch(restaurant, (newRest) => {
  if (newRest) {
    editForm.value = {
      name: newRest.name || '',
      description: newRest.description || '',
      address: newRest.address || '',
      phone: newRest.phone || '',
      logoUrl: newRest.logoUrl || '',
      bannerUrl: newRest.bannerUrl || '',
    }
    if (newRest.categories && newRest.categories.length > 0 && !newItemForm.value.categoryId) {
      newItemForm.value.categoryId = newRest.categories[0].id
    }
  }
}, { immediate: true })

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
  if (!currentTabs.some((t) => t.id === activeTab.value)) {
    activeTab.value = 'menu'
  }
})

watch([selectedCategoryFilter, menuSearchQuery], () => {
  menuPage.value = 1
  restaurantStore.loadMenuItems()
})

function refreshDetails() {
  restaurantStore.fetchRestaurantDetails(restaurantId.value)
}

async function handleSaveSettings() {
  await restaurantStore.saveOutletSettings(editForm.value)
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

async function handleSaveCategory() {
  if (!categoryForm.value.name.trim()) return
  const success = await restaurantStore.saveCategory(
    {
      name: categoryForm.value.name.trim(),
      imageUrl: categoryForm.value.imageUrl?.trim() || undefined,
      description: categoryForm.value.description?.trim() || undefined,
      isGlobal: categoryForm.value.isGlobal,
    },
    isEditingCategory.value,
    editingCategoryId.value
  )
  if (success) {
    showAddCategoryModal.value = false
  }
}

async function handleDeleteCategory(cat: any) {
  const isGlobal = !cat.restaurantId
  const confirmMsg = isGlobal
    ? `Delete platform-wide global category "${cat.name}"? This removes it for all restaurants.`
    : `Delete category "${cat.name}" from this restaurant?`

  if (!confirm(confirmMsg)) return
  await restaurantStore.deleteCategory(cat.id, cat.name)
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

async function handleSaveMenuItem() {
  if (!newItemForm.value.name || !newItemForm.value.price || !newItemForm.value.categoryId) return

  const validVariants = newItemForm.value.variants
    .filter((v) => v.name.trim() && v.price !== null && Number(v.price) > 0)
    .map((v) => ({ name: v.name.trim(), price: Number(v.price) }))

  const validAddons = newItemForm.value.addons
    .filter((a) => a.name.trim() && a.price !== null && Number(a.price) >= 0)
    .map((a) => ({ name: a.name.trim(), price: Number(a.price) }))

  const success = await restaurantStore.saveMenuItem(
    {
      name: newItemForm.value.name.trim(),
      description: newItemForm.value.description?.trim() || undefined,
      price: Number(newItemForm.value.price),
      categoryId: newItemForm.value.categoryId,
      imageUrl: newItemForm.value.imageUrl?.trim() || undefined,
      isAvailable: newItemForm.value.isAvailable,
      variants: validVariants,
      addons: validAddons,
    },
    isEditingItem.value,
    editingItemId.value
  )

  if (success) {
    showAddItemModal.value = false
  }
}

async function handleDeleteMenuItem(item: any) {
  if (!confirm(`Delete "${item.name}" from the menu?`)) return
  await restaurantStore.deleteMenuItem(item)
}

async function openAssignStaffModal() {
  await restaurantStore.loadCandidateUsers()
  staffForm.value = {
    userId: candidateUsers.value[0]?.id || '',
    permissions: ['MANAGE_OUTLET', 'MANAGE_CATEGORIES', 'MANAGE_MENU_ITEMS', 'MANAGE_ORDERS'],
    isPrimary: false,
  }
  showAssignStaffModal.value = true
}

async function handleSaveStaffAssignment() {
  if (!staffForm.value.userId || staffForm.value.permissions.length === 0) return
  const success = await restaurantStore.assignStaff(staffForm.value)
  if (success) {
    showAssignStaffModal.value = false
  }
}

async function handleRevokeStaff(staff: any) {
  if (!confirm(`Revoke outlet staff access for "${staff.user?.name}"?`)) return
  await restaurantStore.revokeStaffAccess(staff)
}

onMounted(() => {
  restaurantStore.fetchRestaurantDetails(restaurantId.value)
})
</script>
