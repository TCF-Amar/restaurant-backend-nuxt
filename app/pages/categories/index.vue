<template>
  <div class="max-w-7xl mx-auto space-y-6">
    <!-- Top Hero Banner -->
    <div class="rounded-3xl glass-card p-6 sm:p-8 border border-white/10 relative overflow-hidden shadow-2xl">
      <div class="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 blur-3xl pointer-events-none"></div>

      <div class="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div class="space-y-1.5">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-medium backdrop-blur-md">
            <LucideFolderTree class="w-3.5 h-3.5" />
            <span>Menu Taxonomy & Hierarchy</span>
          </div>
          <h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Food Categories Management
          </h1>
          <p class="text-sm text-slate-300">
            Manage platform-wide global categories and restaurant-specific menu sections.
          </p>
        </div>

        <div class="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            @click="loadCategories"
            type="button"
            class="px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-white text-xs font-semibold backdrop-blur-md transition cursor-pointer flex items-center gap-2"
          >
            <LucideRotateCcw class="w-3.5 h-3.5" :class="{ 'animate-spin': isLoading }" />
            <span>Refresh</span>
          </button>

          <button
            @click="openCreateModal"
            type="button"
            class="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 border border-indigo-500/40 text-white text-xs font-bold transition shadow-lg flex items-center gap-2 cursor-pointer"
          >
            <LucidePlus class="w-3.5 h-3.5" />
            <span>Add Category</span>
          </button>
        </div>
      </div>

      <!-- Quick Metrics Strip -->
      <div class="mt-6 pt-5 border-t border-white/[0.08] grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
        <div>
          <span class="text-slate-400">Total Categories:</span>
          <p class="text-lg font-bold text-white">{{ categoriesList.length }}</p>
        </div>
        <div>
          <span class="text-slate-400">Platform Global:</span>
          <p class="text-lg font-bold text-purple-300">{{ globalCount }}</p>
        </div>
        <div>
          <span class="text-slate-400">Outlet Custom:</span>
          <p class="text-lg font-bold text-indigo-300">{{ customCount }}</p>
        </div>
        <div>
          <span class="text-slate-400">Total Attached Dishes:</span>
          <p class="text-lg font-bold text-emerald-400">{{ totalMenuItems }}</p>
        </div>
      </div>
    </div>

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

    <!-- Search & Filter Controls -->
    <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
      <div class="relative flex-1 max-w-md group">
        <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-400">
          <LucideSearch class="w-4 h-4" />
        </div>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search categories by name or description..."
          class="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl glass-input text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
        />
      </div>

      <div class="flex items-center gap-1.5 p-1 rounded-xl bg-white/[0.03] border border-white/10 self-start sm:self-auto text-xs">
        <button
          v-for="filter in ['ALL', 'GLOBAL', 'CUSTOM']"
          :key="filter"
          @click="selectedScope = filter"
          type="button"
          :class="[
            'px-3 py-1.5 rounded-lg transition cursor-pointer font-medium whitespace-nowrap',
            selectedScope === filter
              ? 'bg-indigo-600/40 text-white border border-indigo-500/50'
              : 'text-slate-400 hover:text-slate-200'
          ]"
        >
          {{ filter === 'GLOBAL' ? 'Global Platform' : filter === 'CUSTOM' ? 'Outlet Custom' : 'All Categories' }}
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="p-12 text-center text-slate-400 text-xs">
      <LucideLoader2 class="w-6 h-6 animate-spin mx-auto text-indigo-400 mb-2" />
      <span>Loading food categories...</span>
    </div>

    <!-- Categories Grid / Table -->
    <div v-else-if="filteredCategories.length > 0" class="rounded-3xl glass-card p-6 border border-white/10 overflow-x-auto">
      <table class="w-full text-left text-xs">
        <thead>
          <tr class="border-b border-white/[0.08] text-slate-400">
            <th class="pb-3 font-semibold">Category Name</th>
            <th class="pb-3 font-semibold">Scope & Availability</th>
            <th class="pb-3 font-semibold">Description</th>
            <th class="pb-3 font-semibold">Attached Dishes</th>
            <th class="pb-3 font-semibold">Created</th>
            <th class="pb-3 font-semibold text-right">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-white/[0.05]">
          <tr v-for="cat in filteredCategories" :key="cat.id" class="hover:bg-white/[0.03] transition">
            <!-- Category Name & Image -->
            <td class="py-3">
              <div class="flex items-center gap-3">
                <div v-if="cat.imageUrl" class="w-9 h-9 rounded-xl border border-white/10 overflow-hidden shrink-0 bg-slate-800">
                  <img :src="cat.imageUrl" :alt="cat.name" class="w-full h-full object-cover" />
                </div>
                <div v-else class="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600/40 to-indigo-600/40 border border-white/10 flex items-center justify-center font-bold text-white text-xs shrink-0">
                  <LucideFolder class="w-4 h-4 text-purple-300" />
                </div>
                <div>
                  <span class="text-white font-bold">{{ cat.name }}</span>
                  <p class="text-[10px] text-slate-500 font-mono">id: {{ cat.id }}</p>
                </div>
              </div>
            </td>

            <!-- Scope -->
            <td class="py-3">
              <div v-if="!cat.restaurantId" class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/15 border border-purple-500/30 text-purple-300">
                <LucideGlobe class="w-3 h-3 text-purple-400" />
                <span>Global (All Outlets)</span>
              </div>
              <div v-else class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/15 border border-indigo-500/30 text-indigo-300">
                <LucideStore class="w-3 h-3 text-indigo-400" />
                <span>{{ cat.restaurant?.name || 'Custom Outlet' }}</span>
              </div>
            </td>

            <!-- Description -->
            <td class="py-3 max-w-xs">
              <p class="text-slate-300 line-clamp-1 text-[11px]">
                {{ cat.description || '—' }}
              </p>
            </td>

            <!-- Attached Dishes -->
            <td class="py-3">
              <span class="inline-flex items-center gap-1 font-bold text-white">
                <LucideUtensils class="w-3 h-3 text-slate-400" />
                {{ cat._count?.menuItems || 0 }}
              </span>
            </td>

            <!-- Created Date -->
            <td class="py-3 text-slate-400 text-[11px]">
              {{ new Date(cat.createdAt).toLocaleDateString() }}
            </td>

            <!-- Actions -->
            <td class="py-3 text-right">
              <div class="flex items-center justify-end gap-1.5">
                <template v-if="!cat.restaurantId && !isSuperAdmin">
                  <span
                    title="Global platform category managed by administrator"
                    class="px-2.5 py-1 rounded-lg bg-white/[0.02] border border-white/5 text-slate-500 text-xs font-medium inline-flex items-center gap-1 cursor-not-allowed"
                  >
                    <LucideLock class="w-3 h-3 text-slate-500" />
                    <span>Locked</span>
                  </span>
                </template>
                <template v-else>
                  <button
                    @click="openEditModal(cat)"
                    type="button"
                    class="px-2.5 py-1 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-slate-300 hover:text-white text-xs font-medium transition cursor-pointer flex items-center gap-1"
                  >
                    <LucideEdit class="w-3 h-3 text-indigo-400" />
                    <span>Edit</span>
                  </button>
                  <button
                    @click="deleteCategory(cat)"
                    type="button"
                    class="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-300 text-xs font-medium transition cursor-pointer flex items-center gap-1"
                  >
                    <LucideTrash2 class="w-3 h-3 text-rose-400" />
                    <span>Delete</span>
                  </button>
                </template>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Pagination Component -->
      <AppPagination
        :page="pagination.page"
        :total-pages="pagination.totalPages"
        :total="pagination.total"
        :limit="pagination.limit"
        :loading="isLoading"
        @change="onPageChange"
      />
    </div>

    <!-- Empty State -->
    <div v-else class="rounded-3xl glass-card p-12 text-center border border-white/10 space-y-3">
      <LucideFolderTree class="w-10 h-10 text-slate-500 mx-auto" />
      <h3 class="text-sm font-semibold text-white">No Categories Found</h3>
      <p class="text-xs text-slate-400 max-w-sm mx-auto">
        No food categories matched your filter. Click "Add Category" above to create one.
      </p>
    </div>

    <!-- MODAL: CREATE / EDIT CATEGORY -->
    <transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0" leave-active-class="transition duration-150 ease-in" leave-to-class="opacity-0">
      <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
        <div class="w-full max-w-md rounded-3xl glass-card border border-white/20 p-6 sm:p-7 space-y-5 shadow-2xl relative">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300">
                <LucideFolderTree class="w-4 h-4" />
              </div>
              <h3 class="text-base font-bold text-white">
                {{ isEditing ? 'Edit Category' : 'Create Food Category' }}
              </h3>
            </div>
            <button @click="showModal = false" class="text-slate-400 hover:text-white p-1">
              <LucideX class="w-4 h-4" />
            </button>
          </div>

          <form @submit.prevent="saveCategory" class="space-y-4">
            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-slate-300">Category Name *</label>
              <input
                v-model="form.name"
                type="text"
                required
                placeholder="e.g. Gourmet Burgers, Artisanal Pizzas"
                class="w-full px-3.5 py-2.5 text-xs rounded-xl glass-input text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
              />
            </div>

            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-slate-300">Image URL</label>
              <div class="flex items-center gap-2">
                <div v-if="form.imageUrl" class="w-9 h-9 rounded-xl overflow-hidden border border-white/10 shrink-0 bg-slate-800">
                  <img :src="form.imageUrl" alt="Preview" class="w-full h-full object-cover" />
                </div>
                <input
                  v-model="form.imageUrl"
                  type="url"
                  placeholder="https://images.unsplash.com/... (optional)"
                  class="w-full px-3.5 py-2.5 text-xs rounded-xl glass-input text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                />
              </div>
            </div>

            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-slate-300">Description</label>
              <textarea
                v-model="form.description"
                rows="2"
                placeholder="Optional description of this food section..."
                class="w-full px-3.5 py-2.5 text-xs rounded-xl glass-input text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
              ></textarea>
            </div>

            <!-- Scope Choice -->
            <div class="space-y-2">
              <label class="text-xs font-semibold text-slate-300">Scope & Availability</label>
              <div class="space-y-2">
                <label
                  v-if="isSuperAdmin"
                  :class="[
                    'p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition',
                    form.isGlobal
                      ? 'bg-purple-600/15 border-purple-500/40 text-white'
                      : 'bg-white/[0.02] border-white/5 text-slate-300'
                  ]"
                >
                  <input
                    type="radio"
                    :value="true"
                    v-model="form.isGlobal"
                    class="mt-0.5 text-purple-600 focus:ring-purple-500/50"
                  />
                  <div class="text-xs space-y-0.5">
                    <div class="font-bold text-white">Global Platform Category</div>
                    <div class="text-[11px] text-slate-400">Available to all current and future restaurants on the platform.</div>
                  </div>
                </label>

                <label
                  :class="[
                    'p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition',
                    !form.isGlobal
                      ? 'bg-indigo-600/15 border-indigo-500/40 text-white'
                      : 'bg-white/[0.02] border-white/5 text-slate-300'
                  ]"
                >
                  <input
                    type="radio"
                    :value="false"
                    v-model="form.isGlobal"
                    class="mt-0.5 text-indigo-600 focus:ring-indigo-500/50"
                  />
                  <div class="text-xs space-y-0.5">
                    <div class="font-bold text-white">Restaurant Specific (Custom)</div>
                    <div class="text-[11px] text-slate-400">Only accessible to a single designated restaurant outlet.</div>
                  </div>
                </label>
              </div>
            </div>

            <!-- Restaurant Selector if Custom -->
            <div v-if="!form.isGlobal" class="space-y-1.5">
              <label class="text-xs font-semibold text-slate-300">Assign to Outlet *</label>
              <select
                v-model="form.restaurantId"
                required
                class="w-full px-3.5 py-2.5 text-xs rounded-xl glass-input text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/50 bg-[#141226] border border-white/10"
              >
                <option value="" disabled class="bg-slate-900 text-slate-400">Select Restaurant Outlet</option>
                <option
                  v-for="rest in restaurantsList"
                  :key="rest.id"
                  :value="rest.id"
                  class="bg-slate-900 text-white"
                >
                  {{ rest.name }} ({{ rest.slug }})
                </option>
              </select>
            </div>

            <div class="flex items-center justify-end gap-2.5 pt-3 border-t border-white/10">
              <button
                @click="showModal = false"
                type="button"
                class="px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 text-xs font-semibold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                :disabled="isSubmitting || !form.name.trim() || (!form.isGlobal && !form.restaurantId)"
                type="submit"
                class="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-bold transition shadow-lg flex items-center gap-2 cursor-pointer"
              >
                <LucideLoader2 v-if="isSubmitting" class="w-3.5 h-3.5 animate-spin" />
                <span>{{ isEditing ? 'Save Changes' : 'Create Category' }}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </transition>
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
