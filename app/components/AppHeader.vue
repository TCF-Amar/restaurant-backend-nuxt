<template>
  <header class="fixed top-0 left-0 right-0 z-50 w-full glass-header select-none transition-colors">
    <!-- Ambient top glow line -->
    <div class="h-[1px] w-full bg-gradient-to-r from-transparent via-indigo-500/60 to-transparent"></div>

    <div class="h-16 px-4 sm:px-6 flex items-center justify-between gap-4">
      <!-- Left: Sidebar toggle + Brand -->
      <div class="flex items-center gap-3">
        <!-- Sidebar Toggle Button (Desktop & Mobile) -->
        <button @click="toggleSidebarAction" type="button"
          class="relative group p-2 rounded-xl text-slate-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-indigo-500/40 transition-all duration-200 active:scale-95 cursor-pointer"
          :title="isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'">
          <LucidePanelLeftClose v-if="!isCollapsed"
            class="w-5 h-5 transition-transform group-hover:scale-105 text-indigo-300" />
          <LucidePanelLeftOpen v-else class="w-5 h-5 transition-transform group-hover:scale-105 text-slate-300" />
          <!-- Subtle glow ring on hover -->
          <span
            class="absolute inset-0 rounded-xl bg-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity blur-sm pointer-events-none"></span>
        </button>

        <!-- Brand / Logo -->
        <NuxtLink to="/" class="flex items-center gap-2.5 group cursor-pointer">
          <div
            class="relative w-9 h-9 rounded-xl p-[1px] shadow-lg shadow-indigo-500/25 group-hover:shadow-indigo-500/40 transition-all duration-300">
            <div class="w-full h-full rounded-[11px] bg-slate-950/90 backdrop-blur-md flex items-center justify-center">
              <LucideSparkles class="w-4 h-4 text-indigo-400 group-hover:text-pink-300 transition-colors" />
            </div>
            <!-- Glow backlight -->
            <div
              class="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-pink-500 rounded-xl blur-md opacity-30 group-hover:opacity-60 transition duration-300 pointer-events-none">
            </div>
          </div>
          <div class="flex flex-col">
            <div class="flex items-center gap-1.5">
              <span class="font-bold tracking-tight text-base text-white group-hover:text-indigo-200 transition-colors">
                PROJET
              </span>
              <span
                class="text-[10px] font-medium tracking-wider uppercase px-1.5 py-0.5 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300">
                PRO
              </span>
            </div>
            <span class="text-[10px] text-slate-400 hidden sm:block">Glass Console</span>
          </div>
        </NuxtLink>
      </div>

      <!-- Center: Search Bar with Glass effect -->
      <div class="hidden md:flex items-center flex-1 max-w-md mx-4">
        <div class="relative w-full group">
          <div
            class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-400 transition-colors">
            <LucideSearch class="w-4 h-4" />
          </div>
          <input v-model="searchQuery" type="text" placeholder="Search commands, restaurants, analytics..."
            class="w-full pl-9 pr-14 py-2 text-xs rounded-xl glass-input text-slate-100 placeholder-slate-400/70 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all shadow-inner" />
          <div class="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none">
            <kbd
              class="px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-white/5 border border-white/10 rounded-md shadow-xs">
              ⌘K
            </kbd>
          </div>
          <!-- Glow under search input on focus -->
          <div
            class="absolute -inset-0.5 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition duration-300 pointer-events-none -z-10">
          </div>
        </div>
      </div>

      <!-- Right: Actions & User Profile -->
      <div class="flex items-center gap-2 sm:gap-3">
        <!-- System Health Pill -->
        <!-- <div
          class="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/[0.08] border border-emerald-500/20 backdrop-blur-md">
          <span class="relative flex h-2 w-2">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span class="text-[11px] font-medium text-emerald-300">Live</span>
        </div> -->

        <!-- Notifications -->
        <button type="button"
          class="relative p-2 rounded-xl text-slate-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 transition cursor-pointer"
          title="Notifications">
          <LucideBell class="w-4 h-4" />
          <span class="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-500 ring-2 ring-slate-950"></span>
        </button>

        <!-- User Role Pill -->
        <div v-if="user?.role"
          class="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium tracking-wide uppercase border border-indigo-500/30 text-indigo-200">
          <LucideShield class="w-3 h-3 text-indigo-400" />
          <span>{{ user.role }}</span>
        </div>

        <!-- Profile Menu Dropdown -->
        <div class="relative" ref="profileDropdownRef">
          <button @click="isDropdownOpen = !isDropdownOpen" type="button"
            class="flex items-center gap-2.5 p-1 sm:px-2.5 sm:py-1 rounded-xl bg-white/[0.04] hover:bg-white/[0.09] border border-white/10 transition cursor-pointer">
            <!-- Avatar -->
            <div
              class="w-7 h-7 rounded-lg bg-gradient-to-tr  flex items-center justify-center text-xs font-semibold text-white shadow-sm ring-1 ring-white/20">
              <span v-if="user?.name">{{ user.name.charAt(0).toUpperCase() }}</span>
              <LucideUser v-else class="w-3.5 h-3.5" />
            </div>
            <!-- Name & Role -->
            <div class="hidden md:flex flex-col text-left">
              <span class="text-xs font-medium text-slate-200 leading-tight">
                {{ user?.name || 'Admin User' }}
              </span>
              <span class="text-[10px] text-slate-400 leading-tight">
                {{ user?.email || 'admin@projet.dev' }}
              </span>
            </div>
            <LucideChevronDown class="w-3.5 h-3.5 text-slate-400 hidden sm:block transition-transform duration-200"
              :class="{ 'rotate-180': isDropdownOpen }" />
          </button>

          <!-- Glass Dropdown Menu -->
          <Transition enter-active-class="transition duration-150 ease-out"
            enter-from-class="transform scale-95 opacity-0 -translate-y-2"
            enter-to-class="transform scale-100 opacity-100 translate-y-0"
            leave-active-class="transition duration-100 ease-in"
            leave-from-class="transform scale-100 opacity-100 translate-y-0"
            leave-to-class="transform scale-95 opacity-0 -translate-y-2">
            <div v-if="isDropdownOpen"
              class="absolute right-0 mt-2 w-56 rounded-2xl glass-panel p-2 z-50 text-xs shadow-2xl divide-y divide-white/[0.06]">
              <div class="px-3 py-2">
                <p class="font-semibold text-slate-200">{{ user?.name || 'Administrator' }}</p>
                <p class="text-[11px] text-slate-400 truncate">{{ user?.email || 'admin@projet.dev' }}</p>
                <span
                  class="inline-block mt-1.5 px-2 py-0.5 rounded text-[10px] font-medium bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Role: {{ user?.role || 'ADMIN' }}
                </span>
              </div>

              <div class="py-1 space-y-0.5">
                <NuxtLink to="/" @click="isDropdownOpen = false"
                  class="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/[0.08] transition cursor-pointer">
                  <LucideLayoutDashboard class="w-4 h-4 text-indigo-400" />
                  <span>Dashboard</span>
                </NuxtLink>
                <NuxtLink v-if="user?.role === 'ADMIN'" to="/docs" target="_blank" @click="isDropdownOpen = false"
                  class="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/[0.08] transition cursor-pointer">
                  <LucideBookOpen class="w-4 h-4 text-purple-400" />
                  <span>API Docs (Scalar)</span>
                </NuxtLink>
              </div>

              <div class="pt-1">
                <button @click="handleLogout" type="button"
                  class="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-300 hover:text-rose-100 hover:bg-rose-500/20 transition cursor-pointer">
                  <LucideLogOut class="w-4 h-4" />
                  <span>Log out</span>
                </button>
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
const { user, logout } = useAuth()
const { isCollapsed, toggleCollapse, toggleMobile } = useSidebar()

const searchQuery = ref('')
const isDropdownOpen = ref(false)
const profileDropdownRef = ref<HTMLElement | null>(null)

function toggleSidebarAction() {
  if (import.meta.client && window.innerWidth < 1024) {
    toggleMobile()
  } else {
    toggleCollapse()
  }
}

async function handleLogout() {
  isDropdownOpen.value = false
  await logout()
}

// Close dropdown on outside click
onMounted(() => {
  if (import.meta.client) {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileDropdownRef.value && !profileDropdownRef.value.contains(e.target as Node)) {
        isDropdownOpen.value = false
      }
    }
    window.addEventListener('click', handleClickOutside)
    onUnmounted(() => window.removeEventListener('click', handleClickOutside))
  }
})
</script>