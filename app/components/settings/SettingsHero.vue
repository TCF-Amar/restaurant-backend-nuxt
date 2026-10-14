<template>
  <div class="rounded-3xl glass-card p-6 sm:p-8 border border-white/10 relative overflow-hidden shadow-2xl">
    <div
      class="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 blur-3xl pointer-events-none">
    </div>

    <div class="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div class="space-y-1.5">
        <div
          class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-medium backdrop-blur-md">
          <LucideSliders class="w-3.5 h-3.5" />
          <span>Workspace Configuration</span>
        </div>
        <h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
          Settings & Preferences
        </h1>
        <p class="text-sm text-slate-300">
          Manage your account security, interface layout, notifications, and active sessions.
        </p>
      </div>

      <div class="flex items-center gap-3">
        <div
          class="px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 backdrop-blur-md flex items-center gap-2 text-xs">
          <span class="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"></span>
          <span class="text-slate-300">Role: <strong class="text-white">{{ userRole }}</strong></span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  userRole: string
}>()
</script>
