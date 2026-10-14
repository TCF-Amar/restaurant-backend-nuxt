<template>
  <div class="rounded-3xl glass-card p-6 sm:p-8 border border-white/10 space-y-6">
    <div>
      <h2 class="text-base font-bold text-white">Outlet Configuration</h2>
      <p class="text-xs text-slate-400">Update restaurant profile, branding, and contact details</p>
    </div>

    <form @submit.prevent="$emit('save-settings')" class="space-y-4 max-w-2xl">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div class="space-y-1.5">
          <label class="text-xs font-semibold text-slate-300">Restaurant Name *</label>
          <input v-model="form.name" type="text" required
            class="w-full px-3.5 py-2.5 text-xs rounded-xl glass-input text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/50" />
        </div>
        <div class="space-y-1.5">
          <label class="text-xs font-semibold text-slate-300">Contact Phone</label>
          <input v-model="form.phone" type="text" placeholder="+1 (555) 000-0000"
            class="w-full px-3.5 py-2.5 text-xs rounded-xl glass-input text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/50" />
        </div>
      </div>

      <div class="space-y-1.5">
        <label class="text-xs font-semibold text-slate-300">Physical Address</label>
        <input v-model="form.address" type="text" placeholder="123 Gourmet Ave, Suite 100, Culinary City"
          class="w-full px-3.5 py-2.5 text-xs rounded-xl glass-input text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/50" />
      </div>

      <div class="space-y-1.5">
        <label class="text-xs font-semibold text-slate-300">Description</label>
        <textarea v-model="form.description" rows="3"
          placeholder="Tell patrons about your cuisine, kitchen specialty, and dining experience..."
          class="w-full px-3.5 py-2.5 text-xs rounded-xl glass-input text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/50"></textarea>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div class="space-y-1.5">
          <label class="text-xs font-semibold text-slate-300">Logo Image URL</label>
          <input v-model="form.logoUrl" type="url" placeholder="https://..."
            class="w-full px-3.5 py-2.5 text-xs rounded-xl glass-input text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/50" />
        </div>
        <div class="space-y-1.5">
          <label class="text-xs font-semibold text-slate-300">Banner Cover Image URL</label>
          <input v-model="form.bannerUrl" type="url" placeholder="https://..."
            class="w-full px-3.5 py-2.5 text-xs rounded-xl glass-input text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/50" />
        </div>
      </div>

      <div class="pt-4 border-t border-white/[0.08] flex items-center justify-end gap-3">
        <button :disabled="isSubmitting" type="submit"
          class="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold transition shadow-lg flex items-center gap-2 cursor-pointer">
          <LucideLoader2 v-if="isSubmitting" class="w-3.5 h-3.5 animate-spin" />
          <LucideSave v-else class="w-3.5 h-3.5" />
          <span>Save Outlet Changes</span>
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  form: {
    name: string
    description: string
    address: string
    phone: string
    logoUrl: string
    bannerUrl: string
  }
  isSubmitting?: boolean
}>()

defineEmits<{
  (e: 'save-settings'): void
}>()
</script>
