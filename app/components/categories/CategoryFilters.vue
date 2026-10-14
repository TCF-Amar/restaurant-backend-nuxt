<template>
  <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
    <div class="relative flex-1 max-w-md group">
      <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-400">
        <LucideSearch class="w-4 h-4" />
      </div>
      <input
        :value="searchQuery"
        @input="$emit('update:searchQuery', ($event.target as HTMLInputElement).value)"
        type="text"
        placeholder="Search categories by name or description..."
        class="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl glass-input text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
      />
    </div>

    <div class="flex items-center gap-1.5 p-1 rounded-xl bg-white/[0.03] border border-white/10 self-start sm:self-auto text-xs">
      <button
        v-for="filter in ['ALL', 'GLOBAL', 'CUSTOM']"
        :key="filter"
        @click="$emit('update:selectedScope', filter)"
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
</template>

<script setup lang="ts">
defineProps<{
  searchQuery: string
  selectedScope: string
}>()

defineEmits<{
  (e: 'update:searchQuery', val: string): void
  (e: 'update:selectedScope', val: string): void
}>()
</script>
