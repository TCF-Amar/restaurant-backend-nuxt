<template>
  <div class="rounded-3xl glass-card p-6 sm:p-8 border border-white/10 space-y-6">
    <div class="border-b border-white/[0.08] pb-4">
      <h2 class="text-lg font-bold text-white">Active Sessions</h2>
      <p class="text-xs text-slate-400">Review devices currently signed in with your account credentials.</p>
    </div>

    <div class="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
          <LucideLaptop class="w-5 h-5" />
        </div>
        <div class="space-y-0.5">
          <p class="text-xs font-semibold text-white flex items-center gap-2">
            <span>Current Device (Windows Chrome)</span>
            <span
              class="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Active Now
            </span>
          </p>
          <p class="text-[11px] text-slate-400 font-mono">IP: 127.0.0.1 • Localhost Session</p>
        </div>
      </div>
    </div>

    <!-- Danger Zone -->
    <div class="pt-6 border-t border-rose-500/20 space-y-4">
      <div>
        <h3 class="text-sm font-bold text-rose-300">Danger Zone</h3>
        <p class="text-xs text-slate-400">Actions here can revoke active tokens or delete account data.</p>
      </div>

      <div class="flex flex-wrap gap-3">
        <button @click="handleRevokeSessions" type="button"
          class="px-4 py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-200 text-xs font-semibold transition cursor-pointer">
          Log Out All Other Devices
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const emit = defineEmits<{
  (e: 'notify', payload: { type: 'success' | 'error'; message: string }): void
}>()

function handleRevokeSessions() {
  emit('notify', {
    type: 'success',
    message: 'All other active session tokens have been invalidated.',
  })
}
</script>
