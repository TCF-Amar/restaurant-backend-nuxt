<template>
  <transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0"
    leave-active-class="transition duration-150 ease-in" leave-to-class="opacity-0">
    <div v-if="show"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div
        class="w-full max-w-2xl rounded-3xl glass-card border border-white/20 p-6 sm:p-7 space-y-5 shadow-2xl relative max-h-[85vh] flex flex-col">
        <div class="flex items-center justify-between shrink-0">
          <div class="flex items-center gap-2.5">
            <div
              class="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300">
              <LucideFolderTree class="w-4 h-4" />
            </div>
            <div>
              <h3 class="text-base font-bold text-white">Manage Outlet Categories</h3>
              <p class="text-xs text-slate-400">Add, edit, or delete global and outlet-specific food categories</p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button @click="$emit('open-add-category')" type="button"
              class="px-3 py-1.5 rounded-xl bg-purple-600/40 hover:bg-purple-600/60 border border-purple-500/50 text-white text-xs font-semibold transition cursor-pointer flex items-center gap-1.5">
              <LucidePlus class="w-3.5 h-3.5" />
              <span>New Category</span>
            </button>
            <button @click="$emit('close')" class="text-slate-400 hover:text-white p-1">
              <LucideX class="w-4 h-4" />
            </button>
          </div>
        </div>

        <!-- Categories List inside Modal -->
        <div class="flex-1 overflow-y-auto space-y-2.5 pr-1">
          <div v-for="cat in categories" :key="cat.id"
            class="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-white/20 transition flex items-center justify-between gap-3">
            <div class="flex items-center gap-3">
              <div v-if="cat.imageUrl"
                class="w-10 h-10 rounded-xl border border-white/10 overflow-hidden shrink-0 bg-slate-800">
                <img :src="cat.imageUrl" :alt="cat.name" class="w-full h-full object-cover" />
              </div>
              <div v-else
                class="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300 shrink-0">
                <LucideFolder class="w-4 h-4" />
              </div>

              <div class="space-y-1">
                <div class="flex items-center gap-2">
                  <span class="text-xs font-bold text-white">{{ cat.name }}</span>
                  <span :class="[
                    'px-2 py-0.2 rounded-full text-[10px] font-semibold border',
                    !cat.restaurantId
                      ? 'bg-purple-500/20 border-purple-500/40 text-purple-300'
                      : 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300'
                  ]">
                    {{ !cat.restaurantId ? 'Global Platform' : 'Outlet Custom' }}
                  </span>
                </div>
                <p class="text-[11px] text-slate-400">{{ cat.description || 'No description provided' }}</p>
                <p class="text-[10px] text-slate-500">
                  {{ cat._count?.menuItems || 0 }} dishes currently in this outlet
                </p>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex items-center gap-1.5 shrink-0">
              <button v-if="!cat.restaurantId && userRole !== 'ADMIN'" type="button"
                title="Global platform category managed by administrator"
                class="px-2.5 py-1 rounded-lg bg-white/[0.02] border border-white/5 text-slate-500 text-xs font-medium cursor-not-allowed flex items-center gap-1">
                <LucideLock class="w-3 h-3 text-slate-500" />
                <span>Locked</span>
              </button>
              <template v-else>
                <button @click="$emit('edit-category', cat)" type="button"
                  class="px-2.5 py-1 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-slate-300 hover:text-white text-xs font-medium transition cursor-pointer flex items-center gap-1">
                  <LucideEdit class="w-3 h-3 text-indigo-400" />
                  <span>Edit</span>
                </button>
                <button @click="$emit('delete-category', cat)" type="button"
                  class="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-300 text-xs font-medium transition cursor-pointer flex items-center gap-1">
                  <LucideTrash2 class="w-3 h-3 text-rose-400" />
                  <span>Delete</span>
                </button>
              </template>
            </div>
          </div>
        </div>

        <div class="shrink-0 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
          <span>{{ categories.length }} total categories accessible to this outlet</span>
          <button @click="$emit('close')" type="button"
            class="px-4 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-white font-semibold cursor-pointer">
            Done
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
defineProps<{
  show: boolean
  categories: any[]
  userRole?: string
}>()

defineEmits<{
  (e: 'close'): void
  (e: 'open-add-category'): void
  (e: 'edit-category', cat: any): void
  (e: 'delete-category', cat: any): void
}>()
</script>
