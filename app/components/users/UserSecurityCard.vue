<template>
  <div class="space-y-6">
    <!-- Suspension & Security Info Card -->
    <div class="rounded-3xl glass-card p-6 border border-white/10 space-y-4">
      <div class="flex items-center gap-2">
        <div
          :class="[
            'w-8 h-8 rounded-xl border flex items-center justify-center',
            user.isSuspended
              ? 'bg-rose-500/20 border-rose-500/30 text-rose-300'
              : 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300'
          ]"
        >
          <LucideLock class="w-4 h-4" />
        </div>
        <div>
          <h2 class="text-sm font-bold text-white">Access Enforcement</h2>
          <p class="text-[11px] text-slate-400">Account status & session management</p>
        </div>
      </div>

      <div
        :class="[
          'p-3.5 rounded-2xl border text-xs space-y-2',
          user.isSuspended
            ? 'bg-rose-500/10 border-rose-500/20 text-rose-200'
            : 'bg-white/[0.02] border-white/10 text-slate-300'
        ]"
      >
        <div class="flex items-center justify-between font-semibold">
          <span>Account Status:</span>
          <span :class="user.isSuspended ? 'text-rose-400' : 'text-emerald-400'">
            {{ user.isSuspended ? 'SUSPENDED' : 'AUTHORIZED' }}
          </span>
        </div>
        <p class="text-[11px] text-slate-400 leading-relaxed">
          {{ user.isSuspended
            ? 'This user is barred from logging in or calling API endpoints. All previous login sessions were terminated.'
            : 'Suspending this user will immediately revoke all active JWT sessions and block further access across both web and mobile clients.'
          }}
        </p>
      </div>

      <!-- Verification Status Details -->
      <div class="space-y-2 text-xs pt-2 border-t border-white/[0.08]">
        <div class="flex items-center justify-between">
          <span class="text-slate-400">Email Verification:</span>
          <span
            class="font-medium"
            :class="user.emailVerifiedAt ? 'text-emerald-400' : 'text-amber-400'"
          >
            {{ user.emailVerifiedAt ? 'Verified' : 'Pending Verification' }}
          </span>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-slate-400">Phone Verification:</span>
          <span
            class="font-medium"
            :class="user.phoneVerifiedAt ? 'text-emerald-400' : 'text-amber-400'"
          >
            {{ user.phoneVerifiedAt ? 'Verified' : 'Pending Verification' }}
          </span>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-slate-400">Last Profile Update:</span>
          <span class="text-slate-300 font-mono text-[11px]">{{ formatDate(user.updatedAt) }}</span>
        </div>
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
