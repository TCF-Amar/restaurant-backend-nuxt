<template>
  <Teleport to="body">
    <Transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100" leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 scale-100" leave-to-class="opacity-0 scale-95">
      <div v-if="isOpen"
        class="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/10 backdrop-blur-sm overflow-y-auto">
        <div
          class="w-full max-w-md rounded-3xl glass-panel p-6 sm:p-8 border border-white/10 space-y-5 shadow-2xl relative my-auto">
          <!-- Close Button -->
          <button @click="$emit('close')" type="button"
            class="absolute top-5 right-5 text-slate-400 hover:text-white transition cursor-pointer">
            <LucideX class="w-5 h-5" />
          </button>

          <div>
            <h2 class="text-lg font-bold text-white">New Restaurant Outlet</h2>
            <p class="text-xs text-slate-400">Register a new kitchen or restaurant location.</p>
          </div>

          <form @submit.prevent="handleSubmit" class="space-y-4">
            <div class="space-y-1.5">
              <label class="block text-xs font-medium text-slate-300">Restaurant Name</label>
              <input v-model="form.name" @input="autoGenerateSlug" type="text" required
                placeholder="e.g. Kyoto Sushi Bar"
                class="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50" />
            </div>

            <div class="space-y-1.5">
              <label class="block text-xs font-medium text-slate-300">URL Slug</label>
              <input v-model="form.slug" type="text" required placeholder="kyoto-sushi-bar"
                class="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 font-mono" />
            </div>

            <div class="space-y-1.5">
              <label class="block text-xs font-medium text-slate-300">Address / Location</label>
              <input v-model="form.address" type="text" placeholder="104 Elm Street, Downtown"
                class="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50" />
            </div>

            <div class="space-y-1.5">
              <label class="block text-xs font-medium text-slate-300">Phone</label>
              <input v-model="form.phone" type="tel" placeholder="+1 (555) 234-5678"
                class="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50" />
            </div>

            <div class="space-y-1.5">
              <label class="block text-xs font-medium text-slate-300">Description</label>
              <textarea v-model="form.description" rows="2"
                placeholder="Specialty ramen, authentic broth, quick lunch..."
                class="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"></textarea>
            </div>

            <div class="pt-2 flex items-center justify-end gap-3">
              <button @click="$emit('close')" type="button"
                class="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white transition cursor-pointer">
                Cancel
              </button>
              <button type="submit" :disabled="isSubmitting"
                class="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 border border-indigo-400/40 text-white text-xs font-semibold backdrop-blur-md shadow-lg transition active:scale-95 cursor-pointer disabled:opacity-50">
                <span v-if="isSubmitting">Creating...</span>
                <span v-else>Create Outlet</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
const props = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'created', restaurant: any): void
}>()

const isSubmitting = ref(false)

const form = reactive({
  name: '',
  slug: '',
  address: '',
  phone: '',
  description: '',
})

function autoGenerateSlug() {
  form.slug = form.name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

async function handleSubmit() {
  isSubmitting.value = true
  try {
    const res = await $fetch<{ status: string; restaurant: any }>('/api/v1/admin/restaurants', {
      method: 'POST',
      body: form,
    })
    if (res?.restaurant) {
      emit('created', res.restaurant)
      emit('close')
      form.name = ''
      form.slug = ''
      form.address = ''
      form.phone = ''
      form.description = ''
    }
  } catch (err: any) {
    alert(err?.data?.message || err?.message || 'Failed to create restaurant')
  } finally {
    isSubmitting.value = false
  }
}
</script>
