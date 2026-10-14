<template>
  <div class="rounded-3xl glass-card p-6 border border-white/10 space-y-4">
    <div class="flex items-center gap-2">
      <div class="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-300">
        <LucideActivity class="w-4 h-4" />
      </div>
      <div>
        <h2 class="text-sm font-bold text-white">Account Diagnostics</h2>
        <p class="text-[11px] text-slate-400">Account identity, metadata, and timestamps</p>
      </div>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
      <div class="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
        <span class="text-slate-400 text-[11px]">User ID (UUID)</span>
        <p class="text-white font-mono text-[11px] select-all break-all">{{ user.id }}</p>
      </div>
      <div class="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
        <span class="text-slate-400 text-[11px]">Primary Email</span>
        <p class="text-white font-medium">{{ user.email || 'None Provided' }}</p>
      </div>
      <div class="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
        <span class="text-slate-400 text-[11px]">Contact Phone</span>
        <p class="text-white font-medium">{{ user.phone || 'None Provided' }}</p>
      </div>
      <div class="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
        <span class="text-slate-400 text-[11px]">Registered Date</span>
        <p class="text-white font-medium">{{ formatDate(user.createdAt) }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  user: any
}>()

function formatDate(dateString?: string) {
  if (!dateString) return '—'
  return new Date(dateString).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}
</script>
