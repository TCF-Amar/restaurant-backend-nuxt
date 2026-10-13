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
      <div class="rounded-3xl glass-card p-6 sm:p-8 border border-white/10 relative overflow-hidden shadow-2xl">
        <div class="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 blur-3xl pointer-events-none"></div>

        <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div class="flex items-start sm:items-center gap-4">
            <!-- Large Avatar -->
            <div class="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center font-extrabold text-white text-2xl sm:text-3xl border border-white/20 shadow-xl shrink-0">
              {{ user.name.charAt(0).toUpperCase() }}
            </div>

            <div class="space-y-1">
              <div class="flex flex-wrap items-center gap-2">
                <h1 class="text-xl sm:text-2xl font-black tracking-tight text-white">
                  {{ user.name }}
                </h1>

                <!-- Suspended / Active Badge -->
                <span
                  :class="[
                    'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border backdrop-blur-md',
                    user.isSuspended
                      ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                      : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                  ]"
                >
                  <span class="w-1.5 h-1.5 rounded-full" :class="user.isSuspended ? 'bg-rose-400 animate-pulse' : 'bg-emerald-400'"></span>
                  {{ user.isSuspended ? 'Suspended' : 'Active Account' }}
                </span>

                <!-- Role Badge -->
                <span
                  :class="[
                    'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border backdrop-blur-md',
                    user.role === 'ADMIN'
                      ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
                      : user.role === 'RESTAURANT_OWNER'
                      ? 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                      : user.role === 'DELIVERY_PARTNER'
                      ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                      : 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                  ]"
                >
                  <LucideShield class="w-3 h-3" />
                  {{ formatRole(user.role) }}
                </span>
              </div>

              <!-- Contact & ID info -->
              <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300">
                <span v-if="user.email" class="inline-flex items-center gap-1 text-slate-300">
                  <LucideMail class="w-3.5 h-3.5 text-slate-400" />
                  {{ user.email }}
                </span>
                <span v-if="user.phone" class="inline-flex items-center gap-1 text-slate-300">
                  <LucidePhone class="w-3.5 h-3.5 text-slate-400" />
                  {{ user.phone }}
                </span>
                <span class="inline-flex items-center gap-1 text-slate-400 font-mono text-[11px]">
                  <LucideHash class="w-3.5 h-3.5 text-slate-500" />
                  {{ user.id }}
                </span>
              </div>
            </div>
          </div>

          <!-- Quick Actions -->
          <div class="flex flex-wrap items-center gap-2.5 self-start md:self-center">
            <!-- Toggle Suspend Button -->
            <button
              @click="toggleSuspension"
              :disabled="isSubmitting"
              type="button"
              :class="[
                'px-4 py-2 rounded-xl text-xs font-semibold border backdrop-blur-md transition cursor-pointer flex items-center gap-2 shadow-lg disabled:opacity-50',
                user.isSuspended
                  ? 'bg-emerald-500/20 hover:bg-emerald-500/30 border-emerald-500/40 text-emerald-300'
                  : 'bg-rose-500/20 hover:bg-rose-500/30 border-rose-500/40 text-rose-300'
              ]"
            >
              <LucideUserCheck v-if="user.isSuspended" class="w-4 h-4" />
              <LucideUserX v-else class="w-4 h-4" />
              <span>{{ user.isSuspended ? 'Reactivate Account' : 'Suspend Account' }}</span>
            </button>

            <!-- Refresh Button -->
            <button
              @click="fetchUserDetails"
              type="button"
              class="px-3.5 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-white text-xs font-semibold backdrop-blur-md transition cursor-pointer flex items-center gap-1.5"
            >
              <LucideRotateCcw class="w-3.5 h-3.5" :class="{ 'animate-spin': isRefreshing }" />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        <!-- Metrics Strip -->
        <div class="mt-6 pt-5 border-t border-white/[0.08] grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span class="text-slate-400 flex items-center gap-1.5">
              <LucideShoppingBag class="w-3.5 h-3.5 text-indigo-400" />
              Total Orders
            </span>
            <p class="text-lg font-bold text-white mt-0.5">{{ user._count?.orders ?? 0 }}</p>
          </div>
          <div>
            <span class="text-slate-400 flex items-center gap-1.5">
              <LucideKey class="w-3.5 h-3.5 text-purple-400" />
              Active Sessions
            </span>
            <p class="text-lg font-bold text-purple-300 mt-0.5">{{ user._count?.sessions ?? 0 }}</p>
          </div>
          <div>
            <span class="text-slate-400 flex items-center gap-1.5">
              <LucideStore class="w-3.5 h-3.5 text-blue-400" />
              Assigned Outlets
            </span>
            <p class="text-lg font-bold text-blue-300 mt-0.5">{{ user.restaurantStaff?.length ?? 0 }}</p>
          </div>
          <div>
            <span class="text-slate-400 flex items-center gap-1.5">
              <LucideCalendar class="w-3.5 h-3.5 text-emerald-400" />
              Joined On
            </span>
            <p class="text-sm font-semibold text-white mt-1">{{ formatDate(user.createdAt) }}</p>
          </div>
        </div>
      </div>

      <!-- Main Columns Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Left Column: Role & Security Management (1 Col) -->
        <div class="space-y-6">
          <!-- Role Management Card -->
          <div class="rounded-3xl glass-card p-6 border border-white/10 space-y-4">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <div class="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300">
                  <LucideShield class="w-4 h-4" />
                </div>
                <div>
                  <h2 class="text-sm font-bold text-white">System Role</h2>
                  <p class="text-[11px] text-slate-400">Manage account authorization level</p>
                </div>
              </div>
            </div>

            <div class="space-y-2">
              <div
                v-for="roleOption in availableRoles"
                :key="roleOption.value"
                @click="selectedRole = roleOption.value"
                :class="[
                  'p-3 rounded-2xl border transition cursor-pointer flex items-center justify-between',
                  selectedRole === roleOption.value
                    ? 'bg-indigo-600/20 border-indigo-500/50 text-white shadow-md'
                    : 'bg-white/[0.02] border-white/5 hover:border-white/15 text-slate-300'
                ]"
              >
                <div class="space-y-0.5">
                  <div class="flex items-center gap-2">
                    <span class="text-xs font-semibold">{{ roleOption.label }}</span>
                    <span v-if="user.role === roleOption.value" class="text-[9px] px-1.5 py-0.2 rounded bg-white/10 text-slate-300 uppercase">
                      Current
                    </span>
                  </div>
                  <p class="text-[11px] text-slate-400">{{ roleOption.description }}</p>
                </div>
                <div
                  :class="[
                    'w-4 h-4 rounded-full border flex items-center justify-center shrink-0',
                    selectedRole === roleOption.value
                      ? 'border-indigo-400 bg-indigo-500 text-white'
                      : 'border-slate-600 bg-transparent'
                  ]"
                >
                  <LucideCheck v-if="selectedRole === roleOption.value" class="w-2.5 h-2.5" />
                </div>
              </div>
            </div>

            <button
              @click="updateRole"
              :disabled="isSubmitting || selectedRole === user.role"
              type="button"
              class="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white text-xs font-bold transition shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
            >
              <LucideLoader2 v-if="isUpdatingRole" class="w-3.5 h-3.5 animate-spin" />
              <LucideSave v-else class="w-3.5 h-3.5" />
              <span>Update System Role</span>
            </button>
          </div>

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

        <!-- Right Column: Restaurant Access Management (2 Cols) -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Restaurant Staff Outlets Card -->
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
                @click="openAssignModal()"
                type="button"
                class="px-3.5 py-2 rounded-xl bg-purple-600/40 hover:bg-purple-600/60 border border-purple-500/50 text-white text-xs font-semibold transition cursor-pointer flex items-center gap-2 self-start sm:self-auto shadow-md"
              >
                <LucidePlus class="w-3.5 h-3.5" />
                <span>Assign Outlet Access</span>
              </button>
            </div>

            <!-- List of Assigned Outlets -->
            <div v-if="user.restaurantStaff && user.restaurantStaff.length > 0" class="space-y-3">
              <div
                v-for="staff in user.restaurantStaff"
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
                      @click="openAssignModal(staff)"
                      type="button"
                      class="px-2.5 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-slate-300 hover:text-white text-xs font-medium transition cursor-pointer flex items-center gap-1"
                    >
                      <LucideSlidersHorizontal class="w-3 h-3 text-indigo-400" />
                      <span>Edit Permissions</span>
                    </button>
                    <button
                      @click="revokeAccess(staff.restaurant?.id, staff.restaurant?.name)"
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
                @click="openAssignModal()"
                type="button"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/40 text-purple-200 text-xs font-medium transition cursor-pointer"
              >
                <LucidePlus class="w-3.5 h-3.5" />
                <span>Assign Outlet</span>
              </button>
            </div>
          </div>

          <!-- User Activity & Metadata Card -->
          <div class="rounded-3xl glass-card p-6 border border-white/10 space-y-4">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-300">
                <LucideActivity class="w-4 h-4" />
              </div>
              <div>
                <h2 class="text-sm font-bold text-white">Account Diagnostics</h2>
                <p class="text-[11px] text-slate-400">Account identity, metadata, and timestamps</p>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div class="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                <span class="text-slate-400 text-[11px]">User ID (UUID)</span>
                <p class="text-white font-mono text-[11px] select-all break-all">{{ user.id }}</p>
              </div>
              <div class="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                <span class="text-slate-400 text-[11px]">Primary Email</span>
                <p class="text-white font-medium">{{ user.email || 'None Provided' }}</p>
              </div>
              <div class="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                <span class="text-slate-400 text-[11px]">Contact Phone</span>
                <p class="text-white font-medium">{{ user.phone || 'None Provided' }}</p>
              </div>
              <div class="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                <span class="text-slate-400 text-[11px]">Registered Date</span>
                <p class="text-white font-medium">{{ formatDate(user.createdAt) }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal: Assign Outlet / Edit Access -->
    <transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0" leave-active-class="transition duration-150 ease-in" leave-to-class="opacity-0">
      <div v-if="showAssignModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
        <div class="w-full max-w-lg rounded-3xl glass-card border border-white/20 p-6 sm:p-7 space-y-5 shadow-2xl relative">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300">
                <LucideStore class="w-4 h-4" />
              </div>
              <div>
                <h3 class="text-base font-bold text-white">
                  {{ isEditingStaff ? 'Edit Outlet Permissions' : 'Assign Restaurant Outlet' }}
                </h3>
                <p class="text-xs text-slate-400">Configure access and operational rights</p>
              </div>
            </div>

            <button
              @click="showAssignModal = false"
              type="button"
              class="w-8 h-8 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
            >
              <LucideX class="w-4 h-4" />
            </button>
          </div>

          <!-- Restaurant Selector -->
          <div class="space-y-1.5">
            <label class="text-xs font-semibold text-slate-300">Select Restaurant Outlet</label>
            <select
              v-model="assignForm.restaurantId"
              :disabled="isEditingStaff"
              class="w-full px-3.5 py-2.5 text-xs rounded-xl glass-input text-white focus:outline-none focus:ring-1 focus:ring-purple-500/50 bg-[#141226] border border-white/10 disabled:opacity-50"
            >
              <option value="" disabled class="bg-slate-900 text-slate-400">Choose a restaurant...</option>
              <option
                v-for="rest in availableRestaurants"
                :key="rest.id"
                :value="rest.id"
                class="bg-slate-900 text-white"
              >
                {{ rest.name }} ({{ rest.slug }})
              </option>
            </select>
          </div>

          <!-- Granular Permissions Checklist -->
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <label class="text-xs font-semibold text-slate-300">Operational Permissions</label>
              <div class="flex items-center gap-2 text-[11px]">
                <button
                  @click="selectAllPermissions"
                  type="button"
                  class="text-purple-400 hover:text-purple-300 underline cursor-pointer"
                >
                  Select All
                </button>
                <span class="text-slate-600">|</span>
                <button
                  @click="assignForm.permissions = []"
                  type="button"
                  class="text-slate-400 hover:text-slate-300 underline cursor-pointer"
                >
                  Clear
                </button>
              </div>
            </div>

            <div class="space-y-2 max-h-56 overflow-y-auto pr-1">
              <label
                v-for="perm in permissionOptions"
                :key="perm.id"
                :class="[
                  'p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition',
                  assignForm.permissions.includes(perm.id)
                    ? 'bg-purple-600/15 border-purple-500/40 text-white'
                    : 'bg-white/[0.02] border-white/5 hover:border-white/15 text-slate-300'
                ]"
              >
                <input
                  type="checkbox"
                  :value="perm.id"
                  v-model="assignForm.permissions"
                  class="mt-0.5 rounded border-white/20 bg-white/5 text-purple-600 focus:ring-purple-500/50"
                />
                <div class="text-xs space-y-0.5">
                  <div class="font-bold text-white">{{ perm.label }}</div>
                  <div class="text-[11px] text-slate-400">{{ perm.description }}</div>
                </div>
              </label>
            </div>
          </div>

          <!-- Primary Outlet Checkbox -->
          <label class="p-3 rounded-xl bg-white/[0.02] border border-white/10 flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              v-model="assignForm.isPrimary"
              class="rounded border-white/20 bg-white/5 text-purple-600 focus:ring-purple-500/50"
            />
            <div class="text-xs">
              <div class="font-semibold text-white">Set as Primary Outlet</div>
              <div class="text-[11px] text-slate-400">Makes this the default active outlet when the user logs into merchant portal.</div>
            </div>
          </label>

          <p class="text-[11px] text-indigo-300 bg-indigo-500/10 p-2.5 rounded-xl border border-indigo-500/20">
            <strong>Note:</strong> Assigning outlet access will automatically elevate a Customer's role to <strong>Restaurant Owner</strong>.
          </p>

          <!-- Buttons -->
          <div class="flex items-center justify-end gap-2.5 pt-2 border-t border-white/10">
            <button
              @click="showAssignModal = false"
              type="button"
              class="px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 text-xs font-semibold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              @click="saveAccessAssignment"
              :disabled="isSubmitting || !assignForm.restaurantId || assignForm.permissions.length === 0"
              type="button"
              class="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:hover:bg-purple-600 text-white text-xs font-bold transition shadow-lg flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed"
            >
              <LucideLoader2 v-if="isSubmitting" class="w-3.5 h-3.5 animate-spin" />
              <span>{{ isEditingStaff ? 'Save Changes' : 'Grant Access' }}</span>
            </button>
          </div>
        </div>
      </div>
    </transition>
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

const availableRoles = [
  {
    value: 'CUSTOMER',
    label: 'Customer',
    description: 'Standard end-user browsing menus and placing food orders.',
  },
  {
    value: 'RESTAURANT_OWNER',
    label: 'Restaurant Owner / Staff',
    description: 'Manages assigned restaurant outlets, menus, and incoming orders.',
  },
  {
    value: 'DELIVERY_PARTNER',
    label: 'Delivery Partner',
    description: 'Accepts order deliveries and updates courier dispatch status.',
  },
  {
    value: 'ADMIN',
    label: 'System Administrator',
    description: 'Full administrative access across all restaurants, users, and settings.',
  },
]

const permissionOptions = [
  {
    id: 'MANAGE_OUTLET',
    label: 'Manage Outlet Profile & Settings',
    description: 'Configure restaurant name, contact, operating hours, and active status.',
  },
  {
    id: 'MANAGE_CATEGORIES',
    label: 'Manage Food Categories',
    description: 'Create, edit, reorder, and remove menu categories.',
  },
  {
    id: 'MANAGE_MENU_ITEMS',
    label: 'Manage Menu Items & Prices',
    description: 'Add dishes, update pricing, toggle stock availability, and manage variants.',
  },
  {
    id: 'MANAGE_ORDERS',
    label: 'Manage Live Orders',
    description: 'View incoming kitchen orders, accept, prepare, and update status.',
  },
]

function formatRole(role: string) {
  if (role === 'RESTAURANT_OWNER') return 'Restaurant Owner'
  if (role === 'DELIVERY_PARTNER') return 'Delivery Partner'
  if (role === 'ADMIN') return 'Administrator'
  return 'Customer'
}

function formatPermission(perm: string) {
  const match = permissionOptions.find((p) => p.id === perm)
  return match ? match.label : perm
}

function formatDate(dateString?: string) {
  if (!dateString) return '—'
  return new Date(dateString).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

async function fetchUserDetails() {
  if (!userId.value) return
  isRefreshing.value = true
  fetchError.value = null

  try {
    const res = await $fetch<any>(`/api/v1/admin/users/${userId.value}`)
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
    const res = await $fetch<any>(`/api/v1/admin/users/${user.value.id}/suspend`, {
      method: 'PATCH',
      body: { isSuspended: willSuspend },
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
    const res = await $fetch<any>(`/api/v1/admin/users/${user.value.id}/role`, {
      method: 'PUT',
      body: { role: selectedRole.value },
    })

    if (res?.user) {
      user.value.role = res.user.role
      selectedRole.value = res.user.role
      statusMessage.value = {
        type: 'success',
        text: `Role successfully updated to ${formatRole(res.user.role)}`,
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

function selectAllPermissions() {
  assignForm.value.permissions = ['MANAGE_OUTLET', 'MANAGE_CATEGORIES', 'MANAGE_MENU_ITEMS', 'MANAGE_ORDERS']
}

async function saveAccessAssignment() {
  if (!assignForm.value.restaurantId || assignForm.value.permissions.length === 0) return

  isSubmitting.value = true
  try {
    const res = await $fetch<any>(`/api/v1/admin/users/${user.value.id}/access`, {
      method: 'POST',
      body: {
        restaurantId: assignForm.value.restaurantId,
        permissions: assignForm.value.permissions,
        isPrimary: assignForm.value.isPrimary,
      },
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
    const res = await $fetch<any>(`/api/v1/admin/users/${user.value.id}/access?restaurantId=${restId}`, {
      method: 'DELETE',
    })

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
