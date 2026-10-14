<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div>
        <h2 class="text-base font-bold text-white">Authorized Outlet Staff</h2>
        <p class="text-xs text-slate-400">Users with administrative & operational authority over this outlet</p>
      </div>

      <button @click="$emit('open-assign-staff')" type="button"
        class="px-3.5 py-2 rounded-xl bg-purple-600/40 hover:bg-purple-600/60 border border-purple-500/50 text-white text-xs font-semibold transition cursor-pointer flex items-center gap-2 self-start sm:self-auto shadow-md">
        <LucideUserPlus class="w-3.5 h-3.5" />
        <span>Assign New Staff Member</span>
      </button>
    </div>

    <!-- Staff List Grid -->
    <div v-if="staffList && staffList.length > 0" class="space-y-3">
      <div v-for="staff in staffList" :key="staff.id"
        class="p-4 rounded-2xl glass-card border border-white/10 space-y-3">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600/50 to-indigo-600/50 border border-white/10 flex items-center justify-center font-bold text-white text-sm">
              {{ staff.user?.name ? staff.user.name.charAt(0).toUpperCase() : 'U' }}
            </div>
            <div>
              <div class="flex items-center gap-2">
                <NuxtLink :to="`/users/${staff.user?.id}`"
                  class="text-xs font-bold text-white hover:text-purple-300 transition">
                  {{ staff.user?.name || 'Unknown User' }}
                </NuxtLink>
                <span v-if="staff.isPrimary"
                  class="px-1.5 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-300 text-[10px] font-semibold">
                  Primary Outlet
                </span>
                <span :class="[
                  'px-1.5 py-0.5 rounded-full text-[10px] font-semibold border',
                  staff.user?.isSuspended
                    ? 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                    : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                ]">
                  {{ staff.user?.isSuspended ? 'Suspended' : 'Active' }}
                </span>
              </div>
              <div class="flex items-center gap-3 text-[11px] text-slate-400">
                <span>{{ staff.user?.email || 'No email' }}</span>
                <span>•</span>
                <span>Role: {{ staff.user?.role }}</span>
              </div>
            </div>
          </div>

          <!-- Staff Actions -->
          <div class="flex items-center gap-2 self-end sm:self-auto">
            <NuxtLink :to="`/users/${staff.user?.id}`"
              class="px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-white text-xs font-medium transition cursor-pointer flex items-center gap-1">
              <LucideUserCheck class="w-3.5 h-3.5 text-indigo-400" />
              <span>Manage User</span>
            </NuxtLink>
            <button @click="$emit('revoke-staff', staff)" type="button"
              class="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-300 text-xs font-medium transition cursor-pointer flex items-center gap-1">
              <LucideTrash2 class="w-3.5 h-3.5 text-rose-400" />
              <span>Revoke</span>
            </button>
          </div>
        </div>

        <!-- Granular Permissions Badges -->
        <div class="pt-2 border-t border-white/[0.05] flex flex-wrap items-center gap-1.5">
          <span class="text-[11px] text-slate-400 mr-1">Permissions:</span>
          <span v-for="perm in staff.permissions" :key="perm"
            class="px-2 py-0.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[10px] font-medium inline-flex items-center gap-1">
            <LucideCheck class="w-2.5 h-2.5 text-indigo-400" />
            {{ formatPermission(perm) }}
          </span>
        </div>
      </div>
    </div>

    <!-- Empty Staff -->
    <div v-else class="rounded-3xl glass-card p-12 text-center border border-white/10 space-y-3">
      <LucideUsers class="w-10 h-10 text-slate-500 mx-auto" />
      <h3 class="text-sm font-semibold text-white">No Staff Assigned</h3>
      <p class="text-xs text-slate-400 max-w-sm mx-auto">
        Only administrators currently have access to this outlet. Assign staff members to delegate kitchen and order management.
      </p>
      <button @click="$emit('open-assign-staff')" type="button"
        class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600/40 hover:bg-purple-600/60 border border-purple-500/50 text-white text-xs font-semibold transition cursor-pointer">
        <LucideUserPlus class="w-3.5 h-3.5" />
        <span>Assign First Staff Member</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  staffList: any[]
}>()

defineEmits<{
  (e: 'open-assign-staff'): void
  (e: 'revoke-staff', staff: any): void
}>()

const permissionLabels: Record<string, string> = {
  MANAGE_OUTLET: 'Outlet Settings',
  MANAGE_CATEGORIES: 'Categories',
  MANAGE_MENU_ITEMS: 'Menu Items',
  MANAGE_ORDERS: 'Live Orders',
}

function formatPermission(perm: string) {
  return permissionLabels[perm] || perm
}
</script>
