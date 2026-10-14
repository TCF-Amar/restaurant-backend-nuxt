<template>
  <div class="rounded-3xl glass-card p-6 border border-white/10 space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div class="flex items-center gap-2">
        <div class="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300">
          <LucideStore class="w-4 h-4" />
        </div>
        <div>
          <h2 class="text-sm font-bold text-white">Restaurant Staff Assignments</h2>
          <p class="text-[11px] text-slate-400">Grant outlet management & granular operational permissions</p>
        </div>
      </div>

      <button
        @click="$emit('open-assign')"
        type="button"
        class="px-3.5 py-2 rounded-xl bg-purple-600/40 hover:bg-purple-600/60 border border-purple-500/50 text-white text-xs font-semibold transition cursor-pointer flex items-center gap-2 self-start sm:self-auto shadow-md"
      >
        <LucidePlus class="w-3.5 h-3.5" />
        <span>Assign Outlet Access</span>
      </button>
    </div>

    <!-- List of Assigned Outlets -->
    <div v-if="staffList && staffList.length > 0" class="space-y-3">
      <div
        v-for="staff in staffList"
        :key="staff.id"
        class="p-4 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-white/20 transition space-y-3"
      >
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600/30 to-indigo-600/30 border border-white/10 flex items-center justify-center text-white font-bold text-xs">
              <LucideStore class="w-4 h-4 text-purple-300" />
            </div>
            <div>
              <div class="flex items-center gap-2">
                <NuxtLink
                  :to="`/restaurants/${staff.restaurant?.id}`"
                  class="text-xs font-bold text-white hover:text-purple-300 transition"
                >
                  {{ staff.restaurant?.name || 'Unknown Restaurant' }}
                </NuxtLink>
                <span
                  v-if="staff.isPrimary"
                  class="px-1.5 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-300 text-[10px] font-semibold"
                >
                  Primary Outlet
                </span>
                <span
                  :class="[
                    'px-1.5 py-0.5 rounded-full text-[10px] font-medium border',
                    staff.restaurant?.isActive
                      ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                      : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                  ]"
                >
                  {{ staff.restaurant?.isActive ? 'Active' : 'Inactive' }}
                </span>
              </div>
              <p class="text-[10px] text-slate-400 font-mono">slug: {{ staff.restaurant?.slug }}</p>
            </div>
          </div>

          <!-- Actions for this assigned outlet -->
          <div class="flex items-center gap-2 self-end sm:self-auto">
            <button
              @click="$emit('edit-assign', staff)"
              type="button"
              class="px-2.5 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-slate-300 hover:text-white text-xs font-medium transition cursor-pointer flex items-center gap-1"
            >
              <LucideSlidersHorizontal class="w-3 h-3 text-indigo-400" />
              <span>Edit Permissions</span>
            </button>
            <button
              @click="$emit('revoke-access', staff.restaurant?.id, staff.restaurant?.name)"
              type="button"
              class="px-2.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-300 text-xs font-medium transition cursor-pointer flex items-center gap-1"
            >
              <LucideTrash2 class="w-3 h-3 text-rose-400" />
              <span>Revoke</span>
            </button>
          </div>
        </div>

        <!-- Granular Permissions Badges -->
        <div class="pt-2 border-t border-white/[0.05] flex flex-wrap items-center gap-1.5">
          <span class="text-[11px] text-slate-400 mr-1">Granted Permissions:</span>
          <span
            v-for="perm in staff.permissions"
            :key="perm"
            class="px-2 py-0.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[10px] font-medium inline-flex items-center gap-1"
          >
            <LucideCheck class="w-2.5 h-2.5 text-indigo-400" />
            {{ formatPermission(perm) }}
          </span>
          <span v-if="!staff.permissions || staff.permissions.length === 0" class="text-[11px] text-slate-500 italic">
            No permissions assigned
          </span>
        </div>
      </div>
    </div>

    <!-- Empty Outlets State -->
    <div v-else class="rounded-2xl border border-dashed border-white/15 p-8 text-center space-y-3">
      <LucideBuilding2 class="w-8 h-8 text-slate-500 mx-auto" />
      <h3 class="text-xs font-semibold text-white">No Restaurant Outlets Assigned</h3>
      <p class="text-[11px] text-slate-400 max-w-sm mx-auto">
        This user currently does not manage any restaurant outlets. Click the button above to assign outlet access and grant operational permissions.
      </p>
      <button
        @click="$emit('open-assign')"
        type="button"
        class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/40 text-purple-200 text-xs font-medium transition cursor-pointer"
      >
        <LucidePlus class="w-3.5 h-3.5" />
        <span>Assign Outlet</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  staffList: any[]
}>()

defineEmits<{
  (e: 'open-assign'): void
  (e: 'edit-assign', staff: any): void
  (e: 'revoke-access', restId: string, restName: string): void
}>()

const permissionLabels: Record<string, string> = {
  MANAGE_OUTLET: 'Outlet Profile & Settings',
  MANAGE_CATEGORIES: 'Food Categories',
  MANAGE_MENU_ITEMS: 'Menu Items & Prices',
  MANAGE_ORDERS: 'Live Orders',
}

function formatPermission(perm: string) {
  return permissionLabels[perm] || perm
}
</script>
