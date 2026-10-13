<template>
  <div v-if="totalPages > 1 || total > 0" class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-white/[0.08] text-xs">
    <!-- Results Summary -->
    <div class="text-slate-400">
      Showing
      <span class="font-bold text-white">{{ startItem }}</span>
      to
      <span class="font-bold text-white">{{ endItem }}</span>
      of
      <span class="font-bold text-white">{{ total }}</span>
      results
    </div>

    <!-- Navigation Controls -->
    <div class="flex items-center gap-1.5 self-center sm:self-auto">
      <!-- Previous Page -->
      <button
        @click="goToPage(currentPage - 1)"
        :disabled="currentPage <= 1 || loading"
        type="button"
        class="px-2.5 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-slate-300 hover:text-white disabled:opacity-40 disabled:hover:bg-white/[0.04] disabled:cursor-not-allowed transition cursor-pointer flex items-center gap-1"
      >
        <LucideChevronLeft class="w-3.5 h-3.5" />
        <span class="hidden sm:inline">Previous</span>
      </button>

      <!-- Page Number Buttons -->
      <div class="flex items-center gap-1">
        <template v-for="(p, idx) in visiblePages" :key="idx">
          <span v-if="p === '...'" class="px-2 py-1 text-slate-500 font-mono">...</span>
          <button
            v-else
            @click="goToPage(Number(p))"
            :disabled="loading"
            type="button"
            :class="[
              'w-8 h-8 rounded-xl font-semibold transition cursor-pointer flex items-center justify-center text-xs',
              currentPage === p
                ? 'bg-indigo-600 border border-indigo-400/50 text-white shadow-md'
                : 'bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 text-slate-300 hover:text-white'
            ]"
          >
            {{ p }}
          </button>
        </template>
      </div>

      <!-- Next Page -->
      <button
        @click="goToPage(currentPage + 1)"
        :disabled="currentPage >= totalPages || loading"
        type="button"
        class="px-2.5 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-slate-300 hover:text-white disabled:opacity-40 disabled:hover:bg-white/[0.04] disabled:cursor-not-allowed transition cursor-pointer flex items-center gap-1"
      >
        <span class="hidden sm:inline">Next</span>
        <LucideChevronRight class="w-3.5 h-3.5" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    page?: number
    totalPages?: number
    total?: number
    limit?: number
    loading?: boolean
  }>(),
  {
    page: 1,
    totalPages: 1,
    total: 0,
    limit: 10,
    loading: false,
  }
)

const emit = defineEmits<{
  (e: 'update:page', page: number): void
  (e: 'change', page: number): void
}>()

const currentPage = computed(() => Math.max(1, props.page || 1))
const totalPages = computed(() => Math.max(1, props.totalPages || 1))

const startItem = computed(() => {
  if (props.total === 0) return 0
  return (currentPage.value - 1) * props.limit + 1
})

const endItem = computed(() => {
  return Math.min(props.total, currentPage.value * props.limit)
})

const visiblePages = computed(() => {
  const current = currentPage.value
  const total = totalPages.value
  const pages: (number | string)[] = []

  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i)
    return pages
  }

  pages.push(1)

  if (current > 3) {
    pages.push('...')
  }

  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)

  for (let i = start; i <= end; i++) {
    pages.push(i)
  }

  if (current < total - 2) {
    pages.push('...')
  }

  pages.push(total)

  return pages
})

function goToPage(pageNumber: number) {
  if (pageNumber < 1 || pageNumber > totalPages.value || pageNumber === currentPage.value) return
  emit('update:page', pageNumber)
  emit('change', pageNumber)
}
</script>
