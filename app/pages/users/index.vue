<template>
  <div class="max-w-7xl mx-auto space-y-6">
    <!-- Top Hero Banner -->
    <UserHero
      :total-users="usersList.length"
      :owner-count="ownerCount"
      :admin-count="adminCount"
      :suspended-count="suspendedCount"
      :loading="isLoading"
      @refresh="loadUsers"
    />

    <!-- Search & Filter Controls -->
    <UserFilters
      v-model:search-query="searchQuery"
      v-model:selected-role="selectedRole"
    />

    <!-- Users Table -->
    <UserTable
      :users="filteredUsers"
      :loading="isLoading"
      :pagination="pagination"
      @toggle-suspend="toggleSuspendUser"
      @page-change="onPageChange"
    />
  </div>
</template>

<script setup lang="ts">

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

const api = useApi()

async function loadUsers() {
  isLoading.value = true
  try {
    const res = await api.get<any>('/api/v1/admin/users', {
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
    const res = await api.patch<any>(`/api/v1/admin/users/${user.id}/suspend`)
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
