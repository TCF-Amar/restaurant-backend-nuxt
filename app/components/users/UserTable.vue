<template>
  <div>
    <!-- Loading State -->
    <div v-if="loading" class="p-12 text-center text-slate-400 text-xs">
      <LucideLoader2 class="w-6 h-6 animate-spin mx-auto text-indigo-400 mb-2" />
      <span>Loading users directory...</span>
    </div>

    <!-- Users Table -->
    <div v-else-if="users.length > 0" class="rounded-3xl glass-card p-6 border border-white/10 overflow-x-auto">
      <table class="w-full text-left text-xs">
        <thead>
          <tr class="border-b border-white/[0.08] text-slate-400">
            <th class="pb-3 font-semibold">{{ isOwnerView ? 'Owner' : 'Customer' }}</th>
            <th class="pb-3 font-semibold">Contact Info</th>
            <th class="pb-3 font-semibold">Role</th>
            <th class="pb-3 font-semibold">Status</th>
            <th v-if="isOwnerView" class="pb-3 font-semibold">Assigned Outlets</th>
            <th class="pb-3 font-semibold">Joined</th>
            <th class="pb-3 font-semibold text-right">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-white/[0.05]">
          <tr v-for="user in users" :key="user.id" class="hover:bg-white/[0.03] transition">
            <!-- User Name & Avatar -->
            <td class="py-3">
              <div class="flex items-center gap-3">
                <div
                  class="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600/50 to-purple-600/50 flex items-center justify-center font-bold text-white text-xs border border-white/10">
                  {{ user.name.charAt(0).toUpperCase() }}
                </div>
                <div class="truncate">
                  <NuxtLink :to="`/users/${user.id}`" class="text-white font-medium hover:text-indigo-300 transition">
                    {{ user.name }}
                  </NuxtLink>
                  <p class="text-[10px] text-slate-500 font-mono truncate">{{ user.id }}</p>
                </div>
              </div>
            </td>

            <!-- Contact info -->
            <td class="py-3">
              <p class="text-slate-200">{{ user.email || '—' }}</p>
              <p class="text-[11px] text-slate-400 font-mono">{{ user.phone || '' }}</p>
            </td>

            <!-- Role badge -->
            <td class="py-3">
              <span :class="[
                'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border',
                user.role === 'ADMIN'
                  ? 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                  : user.role === 'RESTAURANT_OWNER'
                    ? 'bg-purple-500/15 border-purple-500/30 text-purple-300'
                    : user.role === 'DELIVERY_PARTNER'
                      ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                      : 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300'
              ]">
                <span>{{ user.role === 'RESTAURANT_OWNER' ? 'OWNER' : user.role }}</span>
                <LucideLock v-if="user.role === 'ADMIN'" class="w-2.5 h-2.5 ml-0.5 text-rose-300" />
              </span>
            </td>

            <!-- Status: Active / Suspended -->
            <td class="py-3">
              <button @click="$emit('toggle-suspend', user)" type="button"
                :title="user.isSuspended ? 'Click to unsuspend user' : 'Click to suspend user'" :class="[
                  'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border transition cursor-pointer active:scale-95',
                  user.isSuspended
                    ? 'bg-rose-500/10 hover:bg-rose-500/20 border-rose-500/30 text-rose-300'
                    : 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 text-emerald-300'
                ]">
                <span :class="[
                  'w-1.5 h-1.5 rounded-full',
                  user.isSuspended ? 'bg-rose-400' : 'bg-emerald-400 animate-pulse'
                ]"></span>
                <span>{{ user.isSuspended ? 'Suspended' : 'Active' }}</span>
              </button>
            </td>

            <!-- Assigned Outlets (Only shown in Restaurant Owners view) -->
            <td v-if="isOwnerView" class="py-3">
              <div v-if="user.restaurantStaff && user.restaurantStaff.length > 0" class="flex flex-wrap gap-1">
                <span v-for="s in user.restaurantStaff" :key="s.restaurantId"
                  class="px-2 py-0.5 rounded-md text-[10px] bg-white/[0.04] border border-white/10 text-slate-300">
                  {{ s.restaurant?.name || 'Outlet' }}
                </span>
              </div>
              <span v-else class="text-slate-500 text-[11px]">—</span>
            </td>

            <!-- Joined Date -->
            <td class="py-3 text-slate-400 text-[11px]">
              {{ new Date(user.createdAt).toLocaleDateString() }}
            </td>

            <!-- Action buttons -->
            <td class="py-3 text-right">
              <NuxtLink :to="`/users/${user.id}`"
                class="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-white font-medium text-xs transition cursor-pointer">
                <span>Manage</span>
                <LucideArrowRight class="w-3.5 h-3.5" />
              </NuxtLink>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Pagination Component -->
      <AppPagination :page="pagination.page" :total-pages="pagination.totalPages" :total="pagination.total"
        :limit="pagination.limit" :loading="loading" @change="$emit('page-change', $event)" />
    </div>

    <!-- Empty State -->
    <div v-else class="rounded-3xl glass-card p-12 text-center border border-white/10 space-y-3">
      <LucideUsers class="w-10 h-10 text-slate-500 mx-auto" />
      <h3 class="text-sm font-semibold text-white">No Users Found</h3>
      <p class="text-xs text-slate-400 max-w-sm mx-auto">
        No accounts matched your search criteria.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import AppPagination from '~/components/AppPagination.vue'

defineProps<{
  users: any[]
  loading: boolean
  isOwnerView?: boolean
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}>()

defineEmits<{
  (e: 'toggle-suspend', user: any): void
  (e: 'page-change', page: number): void
}>()
</script>
