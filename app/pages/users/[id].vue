<template>
  <div class="max-w-7xl mx-auto space-y-6">
    <!-- Back button & Breadcrumb -->
    <div class="flex items-center gap-3">
      <NuxtLink
        to="/users"
        class="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-slate-300 hover:text-white text-xs font-medium transition cursor-pointer"
      >
        <LucideArrowLeft class="w-3.5 h-3.5" />
        <span>Back to Users</span>
      </NuxtLink>
      <span class="text-slate-500 text-xs">/</span>
      <span class="text-slate-400 text-xs truncate max-w-xs">{{ user?.name || 'User Details' }}</span>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="p-16 text-center text-slate-400 text-xs">
      <LucideLoader2 class="w-8 h-8 animate-spin mx-auto text-indigo-400 mb-3" />
      <span>Loading user details & permissions...</span>
    </div>

    <!-- Error State -->
    <div v-else-if="fetchError" class="rounded-3xl glass-card p-10 text-center border border-rose-500/30 space-y-3">
      <LucideAlertTriangle class="w-10 h-10 text-rose-400 mx-auto" />
      <h3 class="text-base font-bold text-white">User Not Found</h3>
      <p class="text-xs text-slate-400 max-w-md mx-auto">{{ fetchError }}</p>
      <NuxtLink
        to="/users"
        class="inline-block mt-2 px-4 py-2 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-white text-xs font-semibold transition"
      >
        Return to Directory
      </NuxtLink>
    </div>

    <!-- Main Content -->
    <div v-else-if="user" class="space-y-6">
      <!-- Status Toast / Alert -->
      <transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0 -translate-y-2" leave-active-class="transition duration-150 ease-in" leave-to-class="opacity-0 -translate-y-2">
        <div
          v-if="statusMessage"
          :class="[
            'p-4 rounded-2xl border text-xs font-medium flex items-center justify-between gap-3 shadow-lg backdrop-blur-md',
            statusMessage.type === 'success'
              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-200'
              : 'bg-rose-500/15 border-rose-500/30 text-rose-200'
          ]"
        >
          <div class="flex items-center gap-2.5">
            <LucideCheckCircle2 v-if="statusMessage.type === 'success'" class="w-4 h-4 text-emerald-400 shrink-0" />
            <LucideAlertTriangle v-else class="w-4 h-4 text-rose-400 shrink-0" />
            <span>{{ statusMessage.text }}</span>
          </div>
          <button @click="statusMessage = null" class="text-slate-400 hover:text-white p-1 rounded-lg">
            <LucideX class="w-3.5 h-3.5" />
          </button>
        </div>
      </transition>

      <!-- Profile Header Hero -->
      <UserDetailHero
        :user="user"
        :is-submitting="isSubmitting"
        :is-refreshing="isRefreshing"
        @toggle-suspend="toggleSuspension"
        @refresh="fetchUserDetails"
      />

      <!-- Main Columns Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Left Column: Role & Security Management (1 Col) -->
        <div class="space-y-6">
          <UserRoleCard
            :current-role="user.role"
            v-model:selected-role="selectedRole"
            :is-submitting="isSubmitting"
            :is-updating-role="isUpdatingRole"
            @save-role="updateRole"
          />

          <UserSecurityCard :user="user" />
        </div>

        <!-- Right Column: Restaurant Access Management (2 Cols) -->
        <div class="lg:col-span-2 space-y-6">
          <UserStaffAssignments
            :staff-list="user.restaurantStaff"
            @open-assign="openAssignModal()"
            @edit-assign="openAssignModal"
            @revoke-access="revokeAccess"
          />

          <UserDiagnosticsCard :user="user" />
        </div>
      </div>
    </div>

    <!-- Modal: Assign Outlet / Edit Access -->
    <UserAssignStaffModal
      :show="showAssignModal"
      :is-editing="isEditingStaff"
      :is-submitting="isSubmitting"
      :available-restaurants="availableRestaurants"
      :form="assignForm"
      @close="showAssignModal = false"
      @submit="saveAccessAssignment"
    />
  </div>
</template>

<script setup lang="ts">

const route = useRoute()
const userId = computed(() => String(route.params.id))

const user = ref<any>(null)
const availableRestaurants = ref<any[]>([])
const isLoading = ref(true)
const isRefreshing = ref(false)
const isSubmitting = ref(false)
const isUpdatingRole = ref(false)
const fetchError = ref<string | null>(null)
const statusMessage = ref<{ type: 'success' | 'error'; text: string } | null>(null)

const selectedRole = ref('CUSTOMER')

// Modal state
const showAssignModal = ref(false)
const isEditingStaff = ref(false)
const assignForm = ref({
  restaurantId: '',
  permissions: [] as string[],
  isPrimary: false,
})

const api = useApi()

async function fetchUserDetails() {
  if (!userId.value) return
  isRefreshing.value = true
  fetchError.value = null

  try {
    const res = await api.get<any>(`/api/v1/admin/users/${userId.value}`)
    user.value = res.user
    availableRestaurants.value = res.availableRestaurants || []
    selectedRole.value = res.user.role
  } catch (err: any) {
    fetchError.value = err?.data?.statusMessage || err?.message || 'Failed to load user'
  } finally {
    isLoading.value = false
    isRefreshing.value = false
  }
}

async function toggleSuspension() {
  if (!user.value) return

  const willSuspend = !user.value.isSuspended
  const actionText = willSuspend
    ? `Suspend user "${user.value.name}"? This will terminate all their active sessions immediately.`
    : `Reactivate access for "${user.value.name}"?`

  if (!confirm(actionText)) return

  isSubmitting.value = true
  try {
    const res = await api.patch<any>(`/api/v1/admin/users/${user.value.id}/suspend`, {
      isSuspended: willSuspend,
    })

    if (res?.user) {
      user.value.isSuspended = res.user.isSuspended
      // Invalidate active session count in UI if suspended
      if (res.user.isSuspended && user.value._count) {
        user.value._count.sessions = 0
      }
      statusMessage.value = {
        type: 'success',
        text: res.message || `User status updated to ${res.user.isSuspended ? 'Suspended' : 'Active'}`,
      }
    }
  } catch (err: any) {
    statusMessage.value = {
      type: 'error',
      text: err?.data?.statusMessage || err?.data?.message || err?.message || 'Failed to update suspension status',
    }
  } finally {
    isSubmitting.value = false
  }
}

async function updateRole() {
  if (!user.value || selectedRole.value === user.value.role) return

  isUpdatingRole.value = true
  isSubmitting.value = true

  try {
    const res = await api.put<any>(`/api/v1/admin/users/${user.value.id}/role`, {
      role: selectedRole.value,
    })

    if (res?.user) {
      user.value.role = res.user.role
      selectedRole.value = res.user.role
      statusMessage.value = {
        type: 'success',
        text: `Role successfully updated to ${res.user.role}`,
      }
    }
  } catch (err: any) {
    statusMessage.value = {
      type: 'error',
      text: err?.data?.statusMessage || err?.data?.message || err?.message || 'Failed to update role',
    }
  } finally {
    isUpdatingRole.value = false
    isSubmitting.value = false
  }
}

function openAssignModal(existingStaff?: any) {
  if (existingStaff) {
    isEditingStaff.value = true
    assignForm.value = {
      restaurantId: existingStaff.restaurantId || existingStaff.restaurant?.id,
      permissions: [...(existingStaff.permissions || [])],
      isPrimary: !!existingStaff.isPrimary,
    }
  } else {
    isEditingStaff.value = false
    assignForm.value = {
      restaurantId: availableRestaurants.value[0]?.id || '',
      permissions: ['MANAGE_OUTLET', 'MANAGE_CATEGORIES', 'MANAGE_MENU_ITEMS', 'MANAGE_ORDERS'],
      isPrimary: (user.value?.restaurantStaff?.length || 0) === 0,
    }
  }
  showAssignModal.value = true
}

async function saveAccessAssignment() {
  if (!assignForm.value.restaurantId || assignForm.value.permissions.length === 0) return

  isSubmitting.value = true
  try {
    const res = await api.post<any>(`/api/v1/admin/users/${user.value.id}/access`, {
      restaurantId: assignForm.value.restaurantId,
      permissions: assignForm.value.permissions,
      isPrimary: assignForm.value.isPrimary,
    })

    if (res?.assignment) {
      showAssignModal.value = false
      statusMessage.value = {
        type: 'success',
        text: 'Restaurant outlet access and permissions granted successfully',
      }
      // Reload full user details to refresh staff table and updated role
      await fetchUserDetails()
    }
  } catch (err: any) {
    statusMessage.value = {
      type: 'error',
      text: err?.data?.statusMessage || err?.data?.message || err?.message || 'Failed to assign restaurant access',
    }
  } finally {
    isSubmitting.value = false
  }
}

async function revokeAccess(restId: string, restName: string) {
  if (!confirm(`Revoke staff access to "${restName}" for this user?`)) return

  isSubmitting.value = true
  try {
    const res = await api.delete<any>(`/api/v1/admin/users/${user.value.id}/access?restaurantId=${restId}`)

    if (res?.status === 'ok') {
      statusMessage.value = {
        type: 'success',
        text: `Revoked access to ${restName}`,
      }
      await fetchUserDetails()
    }
  } catch (err: any) {
    statusMessage.value = {
      type: 'error',
      text: err?.data?.statusMessage || err?.data?.message || err?.message || 'Failed to revoke restaurant access',
    }
  } finally {
    isSubmitting.value = false
  }
}

onMounted(() => {
  fetchUserDetails()
})
</script>
