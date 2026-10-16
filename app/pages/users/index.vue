<template>
  <div class="max-w-7xl mx-auto space-y-6">
    <!-- Top Segmented Tabs: Separation of Customer Management, Restaurant Owners & All Users -->
    <div class="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl glass-card border border-white/10 w-fit">
      <button
        @click="activeTab = 'customers'"
        type="button"
        :class="[
          'px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer',
          activeTab === 'customers'
            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
            : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
        ]"
      >
        <LucideUserCheck class="w-4 h-4" />
        <span>Customers</span>
        <span class="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20 text-white font-mono">
          {{ customerMetrics.total }}
        </span>
      </button>

      <button
        @click="activeTab = 'owners'"
        type="button"
        :class="[
          'px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer',
          activeTab === 'owners'
            ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
            : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
        ]"
      >
        <LucideUtensilsCrossed class="w-4 h-4" />
        <span>Restaurant Owners</span>
        <span class="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20 text-white font-mono">
          {{ ownerMetrics.total }}
        </span>
      </button>

      <button
        @click="activeTab = 'all'"
        type="button"
        :class="[
          'px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer',
          activeTab === 'all'
            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/30'
            : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
        ]"
      >
        <LucideUsers class="w-4 h-4" />
        <span>All Users</span>
        <span class="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20 text-white font-mono">
          {{ allMetrics.total }}
        </span>
      </button>
    </div>

    <!-- Top Hero Banner -->
    <UserHero
      :active-tab="activeTab"
      :total-count="activeTab === 'customers' ? customerMetrics.total : activeTab === 'owners' ? ownerMetrics.total : allMetrics.total"
      :active-count="activeTab === 'customers' ? customerMetrics.active : activeTab === 'owners' ? ownerMetrics.active : allMetrics.active"
      :suspended-count="activeTab === 'customers' ? customerMetrics.suspended : activeTab === 'owners' ? ownerMetrics.suspended : allMetrics.suspended"
      :loading="isLoading"
      @refresh="loadUsers"
    />

    <!-- Search & Status Filter Controls -->
    <UserFilters
      v-model:search-query="searchQuery"
      v-model:selected-status="selectedStatus"
      v-model:selected-role="selectedRole"
      :show-role-filter="activeTab === 'all'"
      :placeholder="activeTab === 'customers' ? 'Search customers by name, email, or phone...' : activeTab === 'owners' ? 'Search restaurant owners by name, email, or phone...' : 'Search all accounts across platform...'"
    />

    <!-- Users Table -->
    <UserTable
      :users="usersList"
      :is-owner-view="activeTab !== 'customers'"
      :loading="isLoading"
      :pagination="pagination"
      @toggle-suspend="toggleSuspendUser"
      @page-change="onPageChange"
    />
  </div>
</template>

<script setup lang="ts">
const activeTab = ref<'customers' | 'owners' | 'all'>('customers')
const usersList = ref<any[]>([])
const isLoading = ref(true)
const searchQuery = ref('')
const selectedStatus = ref('ALL')
const selectedRole = ref('ALL')
const currentPage = ref(1)

const pagination = ref({
  total: 0,
  page: 1,
  limit: 10,
  totalPages: 1,
})

const customerMetrics = ref({ total: 0, active: 0, suspended: 0 })
const ownerMetrics = ref({ total: 0, active: 0, suspended: 0 })
const allMetrics = ref({ total: 0, active: 0, suspended: 0 })

const api = useApi()

async function fetchMetrics() {
  try {
    const [custRes, ownRes, allRes] = await Promise.all([
      api.get<any>('/api/v1/admin/users', { params: { role: 'CUSTOMER', limit: 1000 } }),
      api.get<any>('/api/v1/admin/users', { params: { role: 'RESTAURANT_OWNER', limit: 1000 } }),
      api.get<any>('/api/v1/admin/users', { params: { limit: 1000 } }),
    ])
    const custUsers = custRes?.users || []
    customerMetrics.value = {
      total: custUsers.length,
      active: custUsers.filter((u: any) => !u.isSuspended).length,
      suspended: custUsers.filter((u: any) => u.isSuspended).length,
    }
    const ownUsers = ownRes?.users || []
    ownerMetrics.value = {
      total: ownUsers.length,
      active: ownUsers.filter((u: any) => !u.isSuspended).length,
      suspended: ownUsers.filter((u: any) => u.isSuspended).length,
    }
    const allUsers = allRes?.users || []
    allMetrics.value = {
      total: allUsers.length,
      active: allUsers.filter((u: any) => !u.isSuspended).length,
      suspended: allUsers.filter((u: any) => u.isSuspended).length,
    }
  } catch {
    // Fail silently on metrics count
  }
}

async function loadUsers() {
  isLoading.value = true
  try {
    let roleParam: string | undefined = undefined
    if (activeTab.value === 'customers') {
      roleParam = 'CUSTOMER'
    } else if (activeTab.value === 'owners') {
      roleParam = 'RESTAURANT_OWNER'
    } else if (selectedRole.value !== 'ALL') {
      roleParam = selectedRole.value
    }

    const res = await api.get<any>('/api/v1/admin/users', {
      params: {
        page: currentPage.value,
        limit: 10,
        role: roleParam,
        status: selectedStatus.value !== 'ALL' ? selectedStatus.value : undefined,
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

// Switching tab resets search, status and page
watch(activeTab, () => {
  currentPage.value = 1
  searchQuery.value = ''
  selectedStatus.value = 'ALL'
  selectedRole.value = 'ALL'
  loadUsers()
})

// Watch filters to reset page to 1
watch([selectedStatus, selectedRole, searchQuery], () => {
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
    const res = await api.patch<any>(`/api/v1/admin/users/${user.id}/suspend`)
    if (res?.user) {
      user.isSuspended = res.user.isSuspended
      fetchMetrics()
    }
  } catch (err: any) {
    alert(err?.data?.message || err?.message || 'Failed to update user status')
  }
}

onMounted(() => {
  loadUsers()
  fetchMetrics()
})
</script>
