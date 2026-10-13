<template>
  <div class="max-w-7xl mx-auto space-y-6">
    <!-- Top Hero Banner -->
    <div class="rounded-3xl glass-card p-6 sm:p-8 border border-white/10 relative overflow-hidden shadow-2xl">
      <div class="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 blur-3xl pointer-events-none"></div>

      <div class="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div class="space-y-1.5">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-medium backdrop-blur-md">
            <LucideUsers class="w-3.5 h-3.5" />
            <span>Identity & Access Management</span>
          </div>
          <h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Users & Roles Directory
          </h1>
          <p class="text-sm text-slate-300">
            Audit user accounts, assign restaurant permissions, modify roles, and manage account suspensions.
          </p>
        </div>

        <button
          @click="loadUsers"
          type="button"
          class="px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-white text-xs font-semibold backdrop-blur-md transition cursor-pointer flex items-center gap-2 self-start sm:self-auto"
        >
          <LucideRotateCcw class="w-3.5 h-3.5" :class="{ 'animate-spin': isLoading }" />
          <span>Refresh</span>
        </button>
      </div>

      <!-- Quick Metrics Strip -->
      <div class="mt-6 pt-5 border-t border-white/[0.08] grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
        <div>
          <span class="text-slate-400">Total Users:</span>
          <p class="text-lg font-bold text-white">{{ usersList.length }}</p>
        </div>
        <div>
          <span class="text-slate-400">Restaurant Owners:</span>
          <p class="text-lg font-bold text-purple-300">{{ ownerCount }}</p>
        </div>
        <div>
          <span class="text-slate-400">Administrators:</span>
          <p class="text-lg font-bold text-indigo-300">{{ adminCount }}</p>
        </div>
        <div>
          <span class="text-slate-400">Suspended Accounts:</span>
          <p class="text-lg font-bold text-rose-400">{{ suspendedCount }}</p>
        </div>
      </div>
    </div>

    <!-- Search & Filter Controls -->
    <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
      <div class="relative flex-1 max-w-md group">
        <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-400">
          <LucideSearch class="w-4 h-4" />
        </div>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search by name, email, or phone..."
          class="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl glass-input text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
        />
      </div>

      <div class="flex items-center gap-1.5 p-1 rounded-xl bg-white/[0.03] border border-white/10 self-start sm:self-auto text-xs overflow-x-auto">
        <button
          v-for="role in ['ALL', 'CUSTOMER', 'RESTAURANT_OWNER', 'DELIVERY_PARTNER', 'ADMIN']"
          :key="role"
          @click="selectedRole = role"
          type="button"
          :class="[
            'px-3 py-1.5 rounded-lg transition cursor-pointer font-medium whitespace-nowrap',
            selectedRole === role
              ? 'bg-indigo-600/40 text-white border border-indigo-500/50'
              : 'text-slate-400 hover:text-slate-200'
          ]"
        >
          {{ role === 'RESTAURANT_OWNER' ? 'OWNER' : role }}
        </button>
      </div>
    </div>

    <!-- Users Table -->
    <div v-if="isLoading" class="p-12 text-center text-slate-400 text-xs">
      <LucideLoader2 class="w-6 h-6 animate-spin mx-auto text-indigo-400 mb-2" />
      <span>Loading users directory...</span>
    </div>

    <div v-else-if="filteredUsers.length > 0" class="rounded-3xl glass-card p-6 border border-white/10 overflow-x-auto">
      <table class="w-full text-left text-xs">
        <thead>
          <tr class="border-b border-white/[0.08] text-slate-400">
            <th class="pb-3 font-semibold">User</th>
            <th class="pb-3 font-semibold">Contact Info</th>
            <th class="pb-3 font-semibold">Role</th>
            <th class="pb-3 font-semibold">Status</th>
            <th class="pb-3 font-semibold">Assigned Outlets</th>
            <th class="pb-3 font-semibold">Joined</th>
            <th class="pb-3 font-semibold text-right">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-white/[0.05]">
          <tr v-for="user in filteredUsers" :key="user.id" class="hover:bg-white/[0.03] transition">
            <!-- User Name & Avatar -->
            <td class="py-3">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600/50 to-purple-600/50 flex items-center justify-center font-bold text-white text-xs border border-white/10">
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
              <span
                :class="[
                  'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border',
                  user.role === 'ADMIN'
                    ? 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                    : user.role === 'RESTAURANT_OWNER'
                    ? 'bg-purple-500/15 border-purple-500/30 text-purple-300'
                    : user.role === 'DELIVERY_PARTNER'
                    ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                    : 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300'
                ]"
              >
                {{ user.role === 'RESTAURANT_OWNER' ? 'OWNER' : user.role }}
              </span>
            </td>

            <!-- Status: Active / Suspended -->
            <td class="py-3">
              <button
                @click="toggleSuspendUser(user)"
                type="button"
                :title="user.isSuspended ? 'Click to unsuspend user' : 'Click to suspend user'"
                :class="[
                  'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border transition cursor-pointer active:scale-95',
                  user.isSuspended
                    ? 'bg-rose-500/10 hover:bg-rose-500/20 border-rose-500/30 text-rose-300'
                    : 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 text-emerald-300'
                ]"
              >
                <span
                  :class="[
                    'w-1.5 h-1.5 rounded-full',
                    user.isSuspended ? 'bg-rose-400' : 'bg-emerald-400 animate-pulse'
                  ]"
                ></span>
                <span>{{ user.isSuspended ? 'Suspended' : 'Active' }}</span>
              </button>
            </td>

            <!-- Assigned Outlets -->
            <td class="py-3">
              <div v-if="user.restaurantStaff && user.restaurantStaff.length > 0" class="flex flex-wrap gap-1">
                <span
                  v-for="s in user.restaurantStaff"
                  :key="s.restaurantId"
                  class="px-2 py-0.5 rounded-md text-[10px] bg-white/[0.04] border border-white/10 text-slate-300"
                >
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
              <NuxtLink
                :to="`/users/${user.id}`"
                class="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-white font-medium text-xs transition cursor-pointer"
              >
                <span>Manage</span>
                <LucideArrowRight class="w-3.5 h-3.5" />
              </NuxtLink>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Pagination Component -->
      <AppPagination
        :page="pagination.page"
        :total-pages="pagination.totalPages"
        :total="pagination.total"
        :limit="pagination.limit"
        :loading="isLoading"
        @change="onPageChange"
      />
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

const usersList = ref<any[]>([])
const isLoading = ref(true)
const searchQuery = ref('')
const selectedRole = ref('ALL')
const currentPage = ref(1)
const pagination = ref({
  total: 0,
  page: 1,
  limit: 10,
  totalPages: 1,
})

async function loadUsers() {
  isLoading.value = true
  try {
    const res = await $fetch<any>('/api/v1/admin/users', {
      params: {
        page: currentPage.value,
        limit: 10,
        role: selectedRole.value !== 'ALL' ? selectedRole.value : undefined,
        search: searchQuery.value.trim() || undefined,
      },
    })
    usersList.value = res?.users || []
    if (res?.pagination) {
      pagination.value = res.pagination
    }
  } catch (err) {
    usersList.value = []
  } finally {
    isLoading.value = false
  }
}

function onPageChange(newPage: number) {
  currentPage.value = newPage
  loadUsers()
}

// Watch filters to reset page to 1
watch([selectedRole, searchQuery], () => {
  currentPage.value = 1
  loadUsers()
})

async function toggleSuspendUser(user: any) {
  const confirmAction = confirm(
    user.isSuspended
      ? `Reactivate access for ${user.name}?`
      : `Suspend ${user.name}? Their active sessions will be terminated immediately.`
  )
  if (!confirmAction) return

  try {
    const res = await $fetch<any>(`/api/v1/admin/users/${user.id}/suspend`, {
      method: 'PATCH',
    })
    if (res?.user) {
      user.isSuspended = res.user.isSuspended
    }
  } catch (err: any) {
    alert(err?.data?.message || err?.message || 'Failed to update user status')
  }
}

const filteredUsers = computed(() => usersList.value)

const ownerCount = computed(
  () => usersList.value.filter((u) => u.role === 'RESTAURANT_OWNER').length
)
const adminCount = computed(
  () => usersList.value.filter((u) => u.role === 'ADMIN').length
)
const suspendedCount = computed(
  () => usersList.value.filter((u) => u.isSuspended).length
)

onMounted(() => {
  loadUsers()
})
</script>
