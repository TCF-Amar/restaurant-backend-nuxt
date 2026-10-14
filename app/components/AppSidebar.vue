<template>
  <div>
    <!-- Mobile Backdrop Overlay -->
    <Transition enter-active-class="transition-opacity duration-300 ease-out" enter-from-class="opacity-0"
      enter-to-class="opacity-100" leave-active-class="transition-opacity duration-200 ease-in"
      leave-from-class="opacity-100" leave-to-class="opacity-0">
      <div v-if="isMobileOpen" @click="closeMobile" class="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden">
      </div>
    </Transition>

    <!-- Sidebar Container -->
    <aside :style="sidebarInlineStyle" :class="[
      'fixed top-16 bottom-0 left-0 z-40 flex flex-col glass-sidebar transition-all select-none',
      // On mobile, slide in/out
      isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
      // When not dragging, enable smooth transition for collapsing/expanding
      !isDragging ? 'duration-300 ease-in-out' : 'duration-0'
    ]">
      <!-- Ambient side glow accent -->
      <div
        class="absolute inset-y-0 right-0 w-[1px] bg-gradient-to-b from-indigo-500/30 via-purple-500/20 to-transparent pointer-events-none">
      </div>

      <!-- Top Section of Sidebar: Workspace Info or Collapsed Toggle -->
      <div class="h-14 px-3 flex items-center justify-between border-b border-white/[0.06] shrink-0">
        <!-- When Expanded -->
        <div v-if="!isCollapsed" class="flex items-center gap-2.5 px-2 overflow-hidden">
          <div class="w-2 h-2 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(99,102,241,0.8)] shrink-0"></div>
          <div class="flex flex-col truncate">
            <span class="text-xs font-semibold text-slate-200 tracking-wide uppercase truncate">
              {{ isSuperAdmin ? 'Admin Workspace' : (isRestaurantOwner ? 'Restaurant Portal' : 'Customer Portal') }}
            </span>
            <span class="text-[10px] text-slate-400 truncate">
              {{ user?.name || 'Workspace Console' }}
            </span>
          </div>
        </div>

        <!-- When Collapsed -->
        <div v-else class="w-full flex items-center justify-center">
          <div class="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.9)] animate-pulse"
            title="System Active"></div>
        </div>

        <!-- Quick Collapse Button (Desktop) -->
        <button v-if="!isCollapsed" @click="toggleCollapse" type="button"
          class="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition cursor-pointer"
          title="Collapse to icon rail">
          <LucideChevronLeft class="w-4 h-4" />
        </button>
      </div>

      <!-- Navigation Links (Scrollable area) -->
      <nav class="flex-1 overflow-y-auto overflow-x-hidden p-2.5 space-y-6">
        <!-- Section: Overview -->
        <div>
          <div v-if="!isCollapsed"
            class="px-2.5 pb-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            Core
          </div>
          <div class="space-y-1">
            <template v-for="item in coreNavItems" :key="item.path">
              <NuxtLink :to="item.path" :class="[
                'group relative flex items-center rounded-xl transition-all duration-200 cursor-pointer',
                isCollapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5',
                isActiveRoute(item.path)
                  ? 'bg-gradient-to-r from-indigo-500/25 to-purple-500/15 text-white border border-indigo-500/40 shadow-[0_0_16px_rgba(99,102,241,0.25)]'
                  : 'text-slate-300 hover:text-white hover:bg-white/[0.06] border border-transparent'
              ]">
                <!-- Active Indicator Bar -->
                <span v-if="isActiveRoute(item.path) && !isCollapsed"
                  class="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-indigo-400 shadow-[0_0_8px_rgba(99,102,241,1)]"></span>

                <!-- Icon -->
                <component :is="item.icon" class="w-5 h-5 shrink-0 transition-transform group-hover:scale-110"
                  :class="isActiveRoute(item.path) ? 'text-indigo-300' : 'text-slate-400 group-hover:text-slate-200'" />

                <!-- Label & Badge (Shown only when open) -->
                <div v-if="!isCollapsed" class="flex items-center justify-between flex-1 overflow-hidden">
                  <span class="text-xs font-medium truncate">{{ item.label }}</span>
                  <span v-if="item.badge"
                    class="ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {{ item.badge }}
                  </span>
                </div>

                <!-- Floating Tooltip when Collapsed (Only Icon Mode) -->
                <div v-if="isCollapsed"
                  class="pointer-events-none fixed left-[86px] z-50 hidden group-hover:flex items-center px-2.5 py-1.5 rounded-lg glass-panel text-xs text-white shadow-xl whitespace-nowrap border border-white/10">
                  <span>{{ item.label }}</span>
                  <span v-if="item.badge"
                    class="ml-2 text-[10px] px-1 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {{ item.badge }}
                  </span>
                </div>
              </NuxtLink>
            </template>
          </div>
        </div>

        <!-- Section: Management -->
        <div v-if="managementNavItems.length > 0">
          <div v-if="!isCollapsed"
            class="px-2.5 pb-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            Management
          </div>
          <div class="space-y-1">
            <template v-for="item in managementNavItems" :key="item.path">
              <NuxtLink :to="item.path" :class="[
                'group relative flex items-center rounded-xl transition-all duration-200 cursor-pointer',
                isCollapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5',
                isActiveRoute(item.path)
                  ? 'bg-gradient-to-r from-indigo-500/25 to-purple-500/15 text-white border border-indigo-500/40 shadow-[0_0_16px_rgba(99,102,241,0.25)]'
                  : 'text-slate-300 hover:text-white hover:bg-white/[0.06] border border-transparent'
              ]">
                <component :is="item.icon" class="w-5 h-5 shrink-0 transition-transform group-hover:scale-110"
                  :class="isActiveRoute(item.path) ? 'text-indigo-300' : 'text-slate-400 group-hover:text-slate-200'" />

                <div v-if="!isCollapsed" class="flex items-center justify-between flex-1 overflow-hidden">
                  <span class="text-xs font-medium truncate">{{ item.label }}</span>
                  <span v-if="item.badge"
                    class="ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    {{ item.badge }}
                  </span>
                </div>

                <!-- Floating Tooltip when Collapsed -->
                <div v-if="isCollapsed"
                  class="pointer-events-none fixed left-[86px] z-50 hidden group-hover:flex items-center px-2.5 py-1.5 rounded-lg glass-panel text-xs text-white shadow-xl whitespace-nowrap border border-white/10">
                  <span>{{ item.label }}</span>
                  <span v-if="item.badge"
                    class="ml-2 text-[10px] px-1 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    {{ item.badge }}
                  </span>
                </div>
              </NuxtLink>
            </template>
          </div>
        </div>

        <!-- Section: System & Developer -->
        <div v-if="systemNavItems.length > 0">
          <div v-if="!isCollapsed"
            class="px-2.5 pb-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            System
          </div>
          <div class="space-y-1">
            <template v-for="item in systemNavItems" :key="item.path">
              <NuxtLink :to="item.path" :target="item.target || undefined" :class="[
                'group relative flex items-center rounded-xl transition-all duration-200 cursor-pointer',
                isCollapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5',
                isActiveRoute(item.path)
                  ? 'bg-gradient-to-r from-indigo-500/25 to-purple-500/15 text-white border border-indigo-500/40 shadow-[0_0_16px_rgba(99,102,241,0.25)]'
                  : 'text-slate-300 hover:text-white hover:bg-white/[0.06] border border-transparent'
              ]">
                <component :is="item.icon" class="w-5 h-5 shrink-0 transition-transform group-hover:scale-110"
                  :class="isActiveRoute(item.path) ? 'text-indigo-300' : 'text-slate-400 group-hover:text-slate-200'" />

                <div v-if="!isCollapsed" class="flex items-center justify-between flex-1 overflow-hidden">
                  <span class="text-xs font-medium truncate">{{ item.label }}</span>
                  <span v-if="item.badge"
                    class="ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {{ item.badge }}
                  </span>
                </div>

                <!-- Floating Tooltip when Collapsed -->
                <div v-if="isCollapsed"
                  class="pointer-events-none fixed left-[86px] z-50 hidden group-hover:flex items-center px-2.5 py-1.5 rounded-lg glass-panel text-xs text-white shadow-xl whitespace-nowrap border border-white/10">
                  <span>{{ item.label }}</span>
                </div>
              </NuxtLink>
            </template>
          </div>
        </div>
      </nav>

      <!-- Bottom Status & Collapse Rail Toggle -->
      <div class="p-2 border-t border-white/[0.06] shrink-0">
        <!-- Re-expand button when collapsed -->
        <button v-if="isCollapsed" @click="toggleCollapse" type="button"
          class="w-full flex items-center justify-center p-2 rounded-xl text-slate-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 transition cursor-pointer group"
          title="Expand sidebar">
          <LucideChevronRight class="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
        </button>

        <!-- Admin Resize Hint and Reset Pill when expanded -->
        <div v-else
          class="flex items-center justify-between px-2 py-1.5 rounded-xl bg-white/[0.02] border border-white/[0.05] text-[10px] text-slate-400">
          <span class="flex items-center gap-1.5">
            <LucideMoveHorizontal class="w-3 h-3 text-indigo-400" />
            <span>Drag border to resize</span>
          </span>
          <button @click="resetWidth" type="button"
            class="hover:text-indigo-300 transition underline underline-offset-2 cursor-pointer"
            title="Reset width to default (280px)">
            Reset
          </button>
        </div>
      </div>

      <!-- Resizable Drag Handle (Right Edge) - Only Active When Expanded -->
      <div v-if="!isCollapsed" @mousedown="startDrag" @dblclick="resetWidth"
        class="hidden lg:flex absolute top-0 right-0 bottom-0 w-2.5 cursor-col-resize z-50 group/handle items-center justify-center select-none"
        title="Click and drag to extend or shrink sidebar. Double click to reset.">
        <!-- Resizer Vertical Highlight Bar -->
        <div :class="[
          'w-[2px] h-full transition-all duration-150',
          isDragging
            ? 'bg-indigo-400 shadow-[0_0_12px_rgba(99,102,241,1)] w-[3px]'
            : 'bg-white/10 group-hover/handle:bg-indigo-400/80 group-hover/handle:shadow-[0_0_8px_rgba(99,102,241,0.6)]'
        ]"></div>

        <!-- Central Grab Handle Pill -->
        <div :class="[
          'absolute top-1/2 -translate-y-1/2 w-3.5 h-8 rounded-full glass-panel flex items-center justify-center transition-all shadow-md border border-white/20',
          isDragging
            ? 'scale-110 bg-indigo-600/80 border-indigo-400 shadow-[0_0_12px_rgba(99,102,241,0.8)]'
            : 'opacity-0 group-hover/handle:opacity-100 hover:scale-105'
        ]">
          <LucideGripVertical class="w-2.5 h-2.5 text-slate-200" />
        </div>

        <!-- Floating Width Tooltip while dragging -->
        <div v-if="isDragging"
          class="absolute top-1/2 -translate-y-1/2 left-4 pointer-events-none px-2 py-1 rounded-md bg-indigo-600/90 text-white font-mono text-[10px] shadow-lg whitespace-nowrap z-50 border border-white/20">
          {{ Math.round(Number(sidebarWidth)) }}px
        </div>
      </div>
    </aside>
  </div>
</template>

<script setup lang="ts">
interface NavItem {
  label: string
  path: string
  icon: string
  badge?: string
  target?: string
}

const route = useRoute()
const {
  user,
  isSuperAdmin,
  isRestaurantOwner,
  canAccessRestaurants,
  canAccessCategories,
  canAccessOrders,
  canAccessUsers,
  canAccessDocs,
} = useAuth()

const {
  isCollapsed,
  sidebarWidth,
  isDragging,
  isMobileOpen,
  collapsedWidth,
  toggleCollapse,
  closeMobile,
  resetWidth,
  startDrag,
} = useSidebar()

// Computed inline style for dynamic width
const sidebarInlineStyle = computed(() => {
  if (isCollapsed.value) {
    return { width: `${collapsedWidth}px` }
  }
  return { width: `${sidebarWidth.value}px` }
})

function isActiveRoute(path: string) {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}

// Navigation structure dynamically tailored to user role and permissions
const coreNavItems = computed<NavItem[]>(() => {
  const items: NavItem[] = [
    { label: 'Dashboard', path: '/', icon: 'LucideLayoutDashboard' },
  ]
  // Analytics available for admins and restaurant owners
  if (isSuperAdmin.value || canAccessRestaurants.value) {
    items.push({ label: 'Analytics', path: '/analytics', icon: 'LucideBarChart3', badge: 'Live' })
  }
  return items
})

const managementNavItems = computed<NavItem[]>(() => {
  const items: NavItem[] = []

  // 1. Restaurants: shown if admin OR if owner has assigned outlets
  if (canAccessRestaurants.value) {
    items.push({ label: 'Restaurants', path: '/restaurants', icon: 'LucideUtensils' })
  }

  // 2. Categories: shown if admin OR if owner has MANAGE_CATEGORIES permission
  if (canAccessCategories.value) {
    items.push({ label: 'Categories', path: '/categories', icon: 'LucideFolderTree' })
  }

  // 3. Orders: shown if admin OR if owner has MANAGE_ORDERS permission OR customer
  if (canAccessOrders.value) {
    items.push({ label: 'Orders Feed', path: '/orders', icon: 'LucideShoppingBag' })
  }

  // 4. Users & Roles: ONLY for admin; NEVER for restaurant owner or customer
  if (canAccessUsers.value) {
    items.push({ label: 'Users & Roles', path: '/users', icon: 'LucideUsers' })
  }

  return items
})

const systemNavItems = computed<NavItem[]>(() => {
  const items: NavItem[] = []

  // API Scalar Docs: ONLY for admin; NEVER for restaurant owner or customer
  if (canAccessDocs.value) {
    items.push({ label: 'API Scalar Docs', path: '/docs', icon: 'LucideBookOpen', target: '_blank', badge: 'v1' })
  }

  // Settings: accessible to all authenticated accounts
  items.push({ label: 'Settings', path: '/settings', icon: 'LucideSettings' })

  return items
})
</script>
