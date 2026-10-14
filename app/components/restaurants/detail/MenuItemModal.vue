<template>
  <Teleport to="body">
    <transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0"
      leave-active-class="transition duration-150 ease-in" leave-to-class="opacity-0">
      <div v-if="show"
        class="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/10 backdrop-blur-md overflow-y-auto">
        <div
          class="w-full max-w-xl rounded-3xl glass-card border border-white/20 p-6 sm:p-7 space-y-5 shadow-2xl relative my-auto max-h-[85vh] flex flex-col">
          <div class="flex items-center justify-between shrink-0">
            <div class="flex items-center gap-2.5">
              <div
                class="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300">
                <LucideEdit v-if="isEditing" class="w-4 h-4" />
                <LucidePlus v-else class="w-4 h-4" />
              </div>
              <h3 class="text-base font-bold text-white">
                {{ isEditing ? 'Edit Menu Item' : 'Add New Menu Item' }}
              </h3>
            </div>
            <button @click="$emit('close')" class="text-slate-400 hover:text-white p-1">
              <LucideX class="w-4 h-4" />
            </button>
          </div>

          <form @submit.prevent="$emit('save')" class="flex-1 overflow-y-auto space-y-4 pr-1">
            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-slate-300">Dish Name *</label>
              <input v-model="form.name" type="text" required placeholder="e.g. Truffle Woodfired Pizza"
                class="w-full px-3.5 py-2.5 text-xs rounded-xl glass-input text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/50" />
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div class="space-y-1.5">
                <label class="text-xs font-semibold text-slate-300">Category *</label>
                <select v-model="form.categoryId" required
                  class="w-full px-3.5 py-2.5 text-xs rounded-xl glass-input text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/50 bg-[#141226] border border-white/10">
                  <option value="" disabled class="bg-slate-900 text-slate-400">Select Category</option>
                  <option v-for="cat in categories" :key="cat.id" :value="cat.id" class="bg-slate-900 text-white">
                    {{ cat.name }} {{ !cat.restaurantId ? '— [Global Category]' : '— [Custom]' }}
                  </option>
                </select>
              </div>

              <div class="space-y-1.5">
                <label class="text-xs font-semibold text-slate-300">Base Price ($) *</label>
                <input v-model.number="form.price" type="number" step="0.01" min="0.01" required placeholder="14.99"
                  class="w-full px-3.5 py-2.5 text-xs rounded-xl glass-input text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/50" />
              </div>
            </div>

            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-slate-300">Dish Photo URL</label>
              <div class="flex items-center gap-2">
                <div v-if="form.imageUrl"
                  class="w-9 h-9 rounded-xl overflow-hidden border border-white/10 shrink-0 bg-slate-800">
                  <img :src="form.imageUrl" alt="Preview" class="w-full h-full object-cover" />
                </div>
                <input v-model="form.imageUrl" type="url" placeholder="https://images.unsplash.com/..."
                  class="w-full px-3.5 py-2.5 text-xs rounded-xl glass-input text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/50" />
              </div>
            </div>

            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-slate-300">Description</label>
              <textarea v-model="form.description" rows="2"
                placeholder="Key ingredients, flavor profile, allergen notices..."
                class="w-full px-3.5 py-2.5 text-xs rounded-xl glass-input text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/50"></textarea>
            </div>

            <!-- VARIANTS (SIZES / PORTIONS) REPEATER -->
            <div class="p-3.5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
              <div class="flex items-center justify-between">
                <div>
                  <h4 class="text-xs font-bold text-white flex items-center gap-1.5">
                    <LucideLayers class="w-3.5 h-3.5 text-purple-400" />
                    <span>Item Variants (Sizes / Portions)</span>
                  </h4>
                  <p class="text-[11px] text-slate-400">Optional portion sizes and their prices (e.g. Small, Medium,
                    Large)</p>
                </div>
                <button @click="$emit('add-variant')" type="button"
                  class="px-2.5 py-1 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 text-[11px] font-semibold transition cursor-pointer flex items-center gap-1">
                  <LucidePlus class="w-3 h-3" />
                  <span>Add Variant</span>
                </button>
              </div>

              <div v-if="form.variants.length === 0" class="text-center py-2 text-[11px] text-slate-500">
                No variants added. Base price applies.
              </div>

              <div v-else class="space-y-2">
                <div v-for="(variant, idx) in form.variants" :key="idx" class="flex items-center gap-2">
                  <input v-model="variant.name" type="text" required
                    placeholder="Size / Variant (e.g. Regular, Large, 12-inch)"
                    class="flex-1 px-3 py-1.5 text-xs rounded-xl glass-input text-white focus:outline-none focus:ring-1 focus:ring-purple-500/50" />
                  <div class="relative w-28">
                    <span class="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-400 text-xs">$</span>
                    <input v-model.number="variant.price" type="number" step="0.01" min="0.01" required
                      placeholder="0.00"
                      class="w-full pl-6 pr-2.5 py-1.5 text-xs rounded-xl glass-input text-white focus:outline-none focus:ring-1 focus:ring-purple-500/50" />
                  </div>
                  <button @click="$emit('remove-variant', idx)" type="button"
                    class="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 cursor-pointer">
                    <LucideTrash2 class="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            <!-- ADDONS & EXTRAS REPEATER -->
            <div class="p-3.5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
              <div class="flex items-center justify-between">
                <div>
                  <h4 class="text-xs font-bold text-white flex items-center gap-1.5">
                    <LucidePlusCircle class="w-3.5 h-3.5 text-indigo-400" />
                    <span>Item Addons & Extras</span>
                  </h4>
                  <p class="text-[11px] text-slate-400">Optional add-ons (e.g. Extra Cheese, Truffle Dip, Bacon)</p>
                </div>
                <button @click="$emit('add-addon')" type="button"
                  class="px-2.5 py-1 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 text-[11px] font-semibold transition cursor-pointer flex items-center gap-1">
                  <LucidePlus class="w-3 h-3" />
                  <span>Add Addon</span>
                </button>
              </div>

              <div v-if="form.addons.length === 0" class="text-center py-2 text-[11px] text-slate-500">
                No addons added.
              </div>

              <div v-else class="space-y-2">
                <div v-for="(addon, idx) in form.addons" :key="idx" class="flex items-center gap-2">
                  <input v-model="addon.name" type="text" required placeholder="Addon (e.g. Extra Cheese, Bacon Slice)"
                    class="flex-1 px-3 py-1.5 text-xs rounded-xl glass-input text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/50" />
                  <div class="relative w-28">
                    <span class="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-400 text-xs">+$</span>
                    <input v-model.number="addon.price" type="number" step="0.01" min="0" required placeholder="0.00"
                      class="w-full pl-7 pr-2.5 py-1.5 text-xs rounded-xl glass-input text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/50" />
                  </div>
                  <button @click="$emit('remove-addon', idx)" type="button"
                    class="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 cursor-pointer">
                    <LucideTrash2 class="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            <label class="p-3 rounded-xl bg-white/[0.02] border border-white/10 flex items-center gap-3 cursor-pointer">
              <input type="checkbox" v-model="form.isAvailable"
                class="rounded border-white/20 bg-white/5 text-indigo-600 focus:ring-indigo-500/50" />
              <div class="text-xs">
                <span class="font-semibold text-white">Item In Stock & Available for Ordering</span>
              </div>
            </label>

            <div class="flex items-center justify-end gap-2.5 pt-3 border-t border-white/10 shrink-0">
              <button @click="$emit('close')" type="button"
                class="px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 text-xs font-semibold transition cursor-pointer">
                Cancel
              </button>
              <button :disabled="isSubmitting || !form.categoryId || !form.name || !form.price" type="submit"
                class="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-bold transition shadow-lg flex items-center gap-2 cursor-pointer">
                <LucideLoader2 v-if="isSubmitting" class="w-3.5 h-3.5 animate-spin" />
                <span>{{ isEditing ? 'Save Changes' : 'Create Dish' }}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup lang="ts">
export interface VariantRow {
  name: string
  price: number | null
}

export interface AddonRow {
  name: string
  price: number | null
}

defineProps<{
  show: boolean
  isEditing: boolean
  isSubmitting?: boolean
  categories: any[]
  form: {
    name: string
    description: string
    price: number | null
    categoryId: string
    imageUrl: string
    isAvailable: boolean
    variants: VariantRow[]
    addons: AddonRow[]
  }
}>()

defineEmits<{
  (e: 'close'): void
  (e: 'save'): void
  (e: 'add-variant'): void
  (e: 'remove-variant', index: number): void
  (e: 'add-addon'): void
  (e: 'remove-addon', index: number): void
}>()
</script>
