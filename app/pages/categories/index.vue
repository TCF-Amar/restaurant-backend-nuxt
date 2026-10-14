<template>
  <div class="max-w-7xl mx-auto space-y-6">
    <!-- Top Hero Banner Component -->
    <CategoryHero
      :total-categories="categoriesList.length"
      :global-count="globalCount"
      :custom-count="customCount"
      :total-menu-items="totalMenuItems"
      :loading="isLoading"
      @refresh="loadCategories"
      @create="openCreateModal"
    />

    <!-- Toast Alert -->
    <transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0 -translate-y-2" leave-active-class="transition duration-150 ease-in" leave-to-class="opacity-0 -translate-y-2">
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

    <!-- Search & Filter Controls Component -->
    <CategoryFilters
      v-model:search-query="searchQuery"
      v-model:selected-scope="selectedScope"
    />

    <!-- Categories Data Table Component -->
    <CategoryTable
      :categories="filteredCategories"
      :loading="isLoading"
      :is-super-admin="isSuperAdmin"
      :pagination="pagination"
      @edit="openEditModal"
      @delete="deleteCategory"
      @page-change="onPageChange"
    />

    <!-- Create / Edit Category Modal Component -->
    <CategoryCreateEditModal
      :show="showModal"
      :is-editing="isEditing"
      :is-submitting="isSubmitting"
      :is-super-admin="isSuperAdmin"
      :restaurants-list="restaurantsList"
      :form="form"
      @close="showModal = false"
      @save="saveCategory"
    />
  </div>
</template>

<script setup lang="ts">
const { user, isSuperAdmin } = useAuth()

const categoriesList = ref<any[]>([])
const restaurantsList = ref<any[]>([])
const isLoading = ref(true)
const isSubmitting = ref(false)
const searchQuery = ref('')
const selectedScope = ref('ALL') // ALL, GLOBAL, CUSTOM

const currentPage = ref(1)
const pagination = ref({
  total: 0,
  page: 1,
  limit: 10,
  totalPages: 1,
})

const statusMessage = ref<{ type: 'success' | 'error'; text: string } | null>(null)

// Modal state
const showModal = ref(false)
const isEditing = ref(false)
const editingCategoryId = ref<string | null>(null)

const form = ref({
  name: '',
  imageUrl: '',
  description: '',
  isGlobal: true,
  restaurantId: '',
})

const api = useApi()

async function loadCategories() {
  isLoading.value = true
  try {
    const res = await api.get<any>('/api/v1/admin/categories', {
      params: {
        page: currentPage.value,
        limit: 10,
        filter: selectedScope.value !== 'ALL' ? selectedScope.value : undefined,
        search: searchQuery.value.trim() || undefined,
      },
    })
    categoriesList.value = res?.categories || []
    if (res?.pagination) {
      pagination.value = res.pagination
    }
  } catch (err: any) {
    statusMessage.value = {
      type: 'error',
      text: err?.data?.statusMessage || err?.message || 'Failed to load categories',
    }
  } finally {
    isLoading.value = false
  }
}

function onPageChange(newPage: number) {
  currentPage.value = newPage
  loadCategories()
}

watch([selectedScope, searchQuery], () => {
  currentPage.value = 1
  loadCategories()
})

async function loadRestaurants() {
  try {
    const res = await api.get<any>('/api/v1/owner/restaurants', { params: { all: true } })
    restaurantsList.value = res?.restaurants || []
  } catch {
    restaurantsList.value = []
  }
}

const filteredCategories = computed(() => categoriesList.value)

const globalCount = computed(() => categoriesList.value.filter((c) => !c.restaurantId).length)
const customCount = computed(() => categoriesList.value.filter((c) => !!c.restaurantId).length)
const totalMenuItems = computed(() =>
  categoriesList.value.reduce((acc, curr) => acc + (curr._count?.menuItems || 0), 0)
)

function openCreateModal() {
  isEditing.value = false
  editingCategoryId.value = null
  form.value = {
    name: '',
    imageUrl: '',
    description: '',
    isGlobal: isSuperAdmin.value,
    restaurantId: restaurantsList.value[0]?.id || '',
  }
  showModal.value = true
}

function openEditModal(cat: any) {
  isEditing.value = true
  editingCategoryId.value = cat.id
  form.value = {
    name: cat.name,
    imageUrl: cat.imageUrl || '',
    description: cat.description || '',
    isGlobal: !cat.restaurantId,
    restaurantId: cat.restaurantId || (restaurantsList.value[0]?.id || ''),
  }
  showModal.value = true
}

async function saveCategory() {
  if (!form.value.name.trim()) return

  isSubmitting.value = true
  try {
    const payload = {
      name: form.value.name.trim(),
      imageUrl: form.value.imageUrl.trim() || undefined,
      description: form.value.description.trim() || undefined,
      restaurantId: form.value.isGlobal ? null : form.value.restaurantId,
    }

    if (isEditing.value && editingCategoryId.value) {
      const res = await api.put<any>(`/api/v1/admin/categories/${editingCategoryId.value}`, payload)
      if (res?.category) {
        showModal.value = false
        statusMessage.value = {
          type: 'success',
          text: `Category "${res.category.name}" updated successfully`,
        }
        await loadCategories()
      }
    } else {
      const res = await api.post<any>('/api/v1/admin/categories', payload)
      if (res?.category) {
        showModal.value = false
        statusMessage.value = {
          type: 'success',
          text: `Category "${res.category.name}" created successfully`,
        }
        await loadCategories()
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
  const itemsCount = cat._count?.menuItems || 0
  const confirmMsg = itemsCount > 0
    ? `Warning: Category "${cat.name}" has ${itemsCount} attached menu items. Deleting it will delete attached dishes. Proceed?`
    : `Delete category "${cat.name}"?`

  if (!confirm(confirmMsg)) return

  isSubmitting.value = true
  try {
    const res = await api.delete<any>(`/api/v1/admin/categories/${cat.id}?force=true`)
    if (res?.status === 'ok') {
      statusMessage.value = {
        type: 'success',
        text: `Category "${cat.name}" deleted successfully`,
      }
      await loadCategories()
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

onMounted(async () => {
  await Promise.all([loadCategories(), loadRestaurants()])
})
</script>
