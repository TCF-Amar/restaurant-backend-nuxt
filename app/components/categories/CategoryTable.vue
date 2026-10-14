<template>
  <div>
    <!-- Loading State -->
    <div v-if="loading" class="p-12 text-center text-slate-400 text-xs">
      <LucideLoader2 class="w-6 h-6 animate-spin mx-auto text-indigo-400 mb-2" />
      <span>Loading food categories...</span>
    </div>

    <!-- Categories Grid / Table -->
    <div v-else-if="categories.length > 0" class="rounded-3xl glass-card p-6 border border-white/10 space-y-4">
      <div class="overflow-x-auto">
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
            <tr v-for="cat in categories" :key="cat.id" class="hover:bg-white/[0.03] transition">
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
                      @click="$emit('edit', cat)"
                      type="button"
                      class="px-2.5 py-1 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-slate-300 hover:text-white text-xs font-medium transition cursor-pointer flex items-center gap-1"
                    >
                      <LucideEdit class="w-3 h-3 text-indigo-400" />
                      <span>Edit</span>
                    </button>
                    <button
                      @click="$emit('delete', cat)"
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
      </div>

      <!-- Pagination Component -->
      <AppPagination
        :page="pagination.page"
        :total-pages="pagination.totalPages"
        :total="pagination.total"
        :limit="pagination.limit"
        :loading="loading"
        @change="$emit('page-change', $event)"
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
  </div>
</template>

<script setup lang="ts">
import AppPagination from '~/components/AppPagination.vue'

defineProps<{
  categories: any[]
  loading: boolean
  isSuperAdmin: boolean
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}>()

defineEmits<{
  (e: 'edit', cat: any): void
  (e: 'delete', cat: any): void
  (e: 'page-change', page: number): void
}>()
</script>
