<template>
  <div class="space-y-6">
    <!-- Top bar: Category filter pills & Action buttons -->
    <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
      <!-- Search box -->
      <div class="relative flex-1 max-w-sm group">
        <div
          class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-400">
          <LucideSearch class="w-4 h-4" />
        </div>
        <input :value="searchQuery" @input="$emit('update:searchQuery', ($event.target as HTMLInputElement).value)"
          type="text" placeholder="Search dishes by name or description..."
          class="w-full pl-10 pr-4 py-2 text-xs rounded-xl glass-input text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500/50" />
      </div>

      <!-- Actions: Manage Categories, Add Category & Add Menu Item -->
      <div class="flex items-center gap-2 self-start sm:self-auto">
        <button v-if="canManageCategories"
          @click="$emit('open-manage-categories')" type="button"
          class="px-3.5 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-white text-xs font-semibold transition cursor-pointer flex items-center gap-1.5">
          <LucideFolderTree class="w-3.5 h-3.5 text-purple-300" />
          <span>Manage Categories</span>
        </button>

        <button v-if="canManageCategories"
          @click="$emit('open-add-category')" type="button"
          class="px-3.5 py-2 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/40 text-white text-xs font-semibold transition cursor-pointer flex items-center gap-1.5">
          <LucideFolderPlus class="w-3.5 h-3.5 text-purple-300" />
          <span>Add Category</span>
        </button>

        <button v-if="canManageMenuItems"
          @click="$emit('open-add-item')" type="button"
          class="px-3.5 py-2 rounded-xl bg-indigo-600/40 hover:bg-indigo-600/60 border border-indigo-500/50 text-white text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 shadow-md">
          <LucidePlus class="w-3.5 h-3.5" />
          <span>Add Menu Item</span>
        </button>
      </div>
    </div>

    <!-- Category filter pills -->
    <div class="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
      <button @click="$emit('update:selectedCategory', 'ALL')" type="button" :class="[
        'px-3 py-1.5 rounded-xl transition cursor-pointer font-medium whitespace-nowrap',
        selectedCategory === 'ALL'
          ? 'bg-indigo-600/40 text-white border border-indigo-500/50'
          : 'bg-white/[0.03] border border-white/10 text-slate-400 hover:text-white'
      ]">
        All Items ({{ totalItems }})
      </button>
      <button v-for="cat in categories" :key="cat.id" @click="$emit('update:selectedCategory', cat.id)"
        type="button" :class="[
          'px-3 py-1.5 rounded-xl transition cursor-pointer font-medium whitespace-nowrap flex items-center gap-1.5',
          selectedCategory === cat.id
            ? 'bg-indigo-600/40 text-white border border-indigo-500/50'
            : 'bg-white/[0.03] border border-white/10 text-slate-400 hover:text-white'
        ]">
        <span>{{ cat.name }}</span>
        <span v-if="!cat.restaurantId"
          class="text-[9px] px-1.5 py-0.2 rounded-md bg-purple-500/20 text-purple-300 font-normal">
          Global
        </span>
        <span class="text-[10px] text-slate-400">({{ cat._count?.menuItems ?? 0 }})</span>
      </button>
    </div>

    <!-- Menu Items Grid -->
    <div v-if="menuItems.length > 0" class="space-y-4">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div v-for="item in menuItems" :key="item.id"
          class="rounded-2xl glass-card p-4 border border-white/10 hover:border-white/20 transition flex flex-col justify-between group space-y-3">
          <div class="space-y-3">
            <!-- Item Image / Placeholder + Status Badge -->
            <div class="relative h-32 rounded-xl overflow-hidden bg-white/[0.04] border border-white/5">
              <img v-if="item.imageUrl" :src="item.imageUrl" :alt="item.name"
                class="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
              <div v-else class="w-full h-full flex flex-col items-center justify-center text-slate-500 space-y-1">
                <LucideUtensils class="w-6 h-6" />
                <span class="text-[10px]">No Dish Photo</span>
              </div>

              <!-- Stock availability pill -->
              <div class="absolute top-2 right-2">
                <span :class="[
                  'px-2 py-0.5 rounded-full text-[10px] font-semibold border backdrop-blur-md',
                  item.isAvailable !== false
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                    : 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                ]">
                  {{ item.isAvailable !== false ? 'In Stock' : 'Out of Stock' }}
                </span>
              </div>

              <!-- Category pill -->
              <div class="absolute bottom-2 left-2">
                <span
                  class="px-2 py-0.5 rounded-md text-[10px] bg-black/60 border border-white/10 text-slate-200 backdrop-blur-md">
                  {{ item.category?.name || 'Item' }}
                </span>
              </div>
            </div>

            <!-- Item info -->
            <div>
              <div class="flex items-start justify-between gap-2">
                <h3 class="text-sm font-bold text-white group-hover:text-indigo-200 transition">
                  {{ item.name }}
                </h3>
                <div class="text-right">
                  <span class="text-sm font-black text-emerald-400">
                    ${{ Number(item.price).toFixed(2) }}
                  </span>
                  <p v-if="item.variants && item.variants.length > 0" class="text-[10px] text-slate-400">
                    Base
                  </p>
                </div>
              </div>
              <p class="text-xs text-slate-300 line-clamp-2 mt-1 leading-relaxed">
                {{ item.description || 'Artisanal ingredients prepared fresh to order.' }}
              </p>

              <!-- Variants Display -->
              <div v-if="item.variants && item.variants.length > 0"
                class="mt-2.5 pt-2 border-t border-white/[0.05] space-y-1">
                <div class="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                  <LucideLayers class="w-3 h-3 text-purple-400" />
                  <span>Sizes & Variants ({{ item.variants.length }}):</span>
                </div>
                <div class="flex flex-wrap gap-1.5 pt-0.5">
                  <span v-for="v in item.variants" :key="v.id || v.name"
                    class="px-2 py-0.5 rounded-md bg-purple-500/15 border border-purple-500/30 text-purple-200 text-[10px] font-semibold flex items-center gap-1">
                    <span>{{ v.name }}</span>
                    <span class="text-purple-400">${{ Number(v.price).toFixed(2) }}</span>
                  </span>
                </div>
              </div>

              <!-- Addons Display -->
              <div v-if="item.addons && item.addons.length > 0"
                class="mt-2 pt-2 border-t border-white/[0.05] space-y-1">
                <div class="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                  <LucidePlusCircle class="w-3 h-3 text-indigo-400" />
                  <span>Extras & Addons ({{ item.addons.length }}):</span>
                </div>
                <div class="flex flex-wrap gap-1.5 pt-0.5">
                  <span v-for="a in item.addons" :key="a.id || a.name"
                    class="px-2 py-0.5 rounded-md bg-indigo-500/15 border border-indigo-500/30 text-indigo-200 text-[10px] font-medium flex items-center gap-1">
                    <span>+{{ a.name }}</span>
                    <span class="text-indigo-400">+${{ Number(a.price).toFixed(2) }}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Item Card Footer / Actions -->
          <div class="pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs">
            <span class="text-[10px] text-slate-500 font-mono">ID: {{ item.id.slice(0, 8) }}...</span>
            <div v-if="canManageMenuItems"
              class="flex items-center gap-1.5">
              <button @click="$emit('edit-item', item)" type="button"
                class="px-2.5 py-1 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 hover:text-white border border-white/10 transition cursor-pointer flex items-center gap-1 text-[11px]">
                <LucideEdit class="w-3 h-3 text-indigo-400" />
                <span>Edit</span>
              </button>
              <button @click="$emit('delete-item', item)" type="button"
                class="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 transition cursor-pointer flex items-center gap-1 text-[11px]">
                <LucideTrash2 class="w-3 h-3 text-rose-400" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Menu Pagination Component -->
      <AppPagination :page="pagination.page" :total-pages="pagination.totalPages"
        :total="pagination.total" :limit="pagination.limit" :loading="loading"
        @change="$emit('page-change', $event)" />
    </div>

    <!-- Empty Menu Items -->
    <div v-else class="rounded-3xl glass-card p-12 text-center border border-white/10 space-y-3">
      <LucideUtensils class="w-10 h-10 text-slate-500 mx-auto" />
      <h3 class="text-sm font-semibold text-white">No Menu Items Found</h3>
      <p class="text-xs text-slate-400 max-w-sm mx-auto">
        {{ searchQuery ? 'No dishes match your search query.' : 'Get started by creating your first category and adding dishes to this restaurant.' }}
      </p>
      <button @click="$emit('open-add-item')" type="button"
        class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600/40 hover:bg-indigo-600/60 border border-indigo-500/50 text-white text-xs font-semibold transition cursor-pointer">
        <LucidePlus class="w-3.5 h-3.5" />
        <span>Create First Menu Item</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import AppPagination from '~/components/AppPagination.vue'

defineProps<{
  menuItems: any[]
  categories: any[]
  totalItems: number
  searchQuery: string
  selectedCategory: string
  canManageCategories: boolean
  canManageMenuItems: boolean
  loading?: boolean
  pagination: {
    page: number
    totalPages: number
    total: number
    limit: number
  }
}>()

defineEmits<{
  (e: 'update:searchQuery', value: string): void
  (e: 'update:selectedCategory', value: string): void
  (e: 'open-manage-categories'): void
  (e: 'open-add-category'): void
  (e: 'open-add-item'): void
  (e: 'edit-item', item: any): void
  (e: 'delete-item', item: any): void
  (e: 'page-change', page: number): void
}>()
</script>
