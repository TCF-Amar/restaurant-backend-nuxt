<template>
  <Teleport to="body">
    <transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0"
      leave-active-class="transition duration-150 ease-in" leave-to-class="opacity-0">
      <div v-if="show"
        class="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/10 backdrop-blur-md overflow-y-auto">
        <div
          class="w-full max-w-md rounded-3xl glass-card border border-white/20 p-6 sm:p-7 space-y-5 shadow-2xl relative my-auto max-h-[85vh] overflow-y-auto">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2.5">
              <div
                class="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300">
                <LucideFolderTree class="w-4 h-4" />
              </div>
              <h3 class="text-base font-bold text-white">
                {{ isEditing ? 'Edit Category' : 'Create Food Category' }}
              </h3>
            </div>
            <button @click="$emit('close')" type="button" class="text-slate-400 hover:text-white p-1">
              <LucideX class="w-4 h-4" />
            </button>
          </div>

          <form @submit.prevent="$emit('save')" class="space-y-4">
            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-slate-300">Category Name *</label>
              <input v-model="form.name" type="text" required placeholder="e.g. Gourmet Burgers, Artisanal Pizzas"
                class="w-full px-3.5 py-2.5 text-xs rounded-xl glass-input text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/50" />
            </div>

            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-slate-300">Image URL</label>
              <div class="flex items-center gap-2">
                <div v-if="form.imageUrl"
                  class="w-9 h-9 rounded-xl overflow-hidden border border-white/10 shrink-0 bg-slate-800">
                  <img :src="form.imageUrl" alt="Preview" class="w-full h-full object-cover" />
                </div>
                <input v-model="form.imageUrl" type="url" placeholder="https://images.unsplash.com/... (optional)"
                  class="w-full px-3.5 py-2.5 text-xs rounded-xl glass-input text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/50" />
              </div>
            </div>

            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-slate-300">Description</label>
              <textarea v-model="form.description" rows="2" placeholder="Optional description of this food section..."
                class="w-full px-3.5 py-2.5 text-xs rounded-xl glass-input text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/50"></textarea>
            </div>

            <!-- Scope Choice -->
            <div class="space-y-2">
              <label class="text-xs font-semibold text-slate-300">Scope & Availability</label>
              <div class="space-y-2">
                <label v-if="isSuperAdmin" :class="[
                  'p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition',
                  form.isGlobal
                    ? 'bg-purple-600/15 border-purple-500/40 text-white'
                    : 'bg-white/[0.02] border-white/5 text-slate-300'
                ]">
                  <input type="radio" :value="true" v-model="form.isGlobal"
                    class="mt-0.5 text-purple-600 focus:ring-purple-500/50" />
                  <div class="text-xs space-y-0.5">
                    <div class="font-bold text-white">Global Platform Category</div>
                    <div class="text-[11px] text-slate-400">Available to all current and future restaurants on the
                      platform.</div>
                  </div>
                </label>

                <label :class="[
                  'p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition',
                  !form.isGlobal
                    ? 'bg-indigo-600/15 border-indigo-500/40 text-white'
                    : 'bg-white/[0.02] border-white/5 text-slate-300'
                ]">
                  <input type="radio" :value="false" v-model="form.isGlobal"
                    class="mt-0.5 text-indigo-600 focus:ring-indigo-500/50" />
                  <div class="text-xs space-y-0.5">
                    <div class="font-bold text-white">Restaurant Specific (Custom)</div>
                    <div class="text-[11px] text-slate-400">Only accessible to a single designated restaurant outlet.
                    </div>
                  </div>
                </label>
              </div>
            </div>

            <!-- Restaurant Selector if Custom -->
            <div v-if="!form.isGlobal" class="space-y-1.5">
              <label class="text-xs font-semibold text-slate-300">Assign to Outlet *</label>
              <select v-model="form.restaurantId" required
                class="w-full px-3.5 py-2.5 text-xs rounded-xl glass-input text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/50 bg-[#141226] border border-white/10">
                <option value="" disabled class="bg-slate-900 text-slate-400">Select Restaurant Outlet</option>
                <option v-for="rest in restaurantsList" :key="rest.id" :value="rest.id" class="bg-slate-900 text-white">
                  {{ rest.name }} ({{ rest.slug }})
                </option>
              </select>
            </div>

            <div class="flex items-center justify-end gap-2.5 pt-3 border-t border-white/10">
              <button @click="$emit('close')" type="button"
                class="px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 text-xs font-semibold transition cursor-pointer">
                Cancel
              </button>
              <button :disabled="isSubmitting || !form.name.trim() || (!form.isGlobal && !form.restaurantId)"
                type="submit"
                class="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-bold transition shadow-lg flex items-center gap-2 cursor-pointer">
                <LucideLoader2 v-if="isSubmitting" class="w-3.5 h-3.5 animate-spin" />
                <span>{{ isEditing ? 'Save Changes' : 'Create Category' }}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup lang="ts">
defineProps<{
  show: boolean
  isEditing: boolean
  isSubmitting?: boolean
  isSuperAdmin: boolean
  restaurantsList: any[]
  form: {
    name: string
    imageUrl: string
    description: string
    isGlobal: boolean
    restaurantId: string
  }
}>()

defineEmits<{
  (e: 'close'): void
  (e: 'save'): void
}>()
</script>
