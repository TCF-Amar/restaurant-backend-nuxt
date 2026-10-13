<template>
  <header class="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16">
        <!-- Logo & Brand -->
        <div class="flex items-center gap-8">
          <NuxtLink to="/" class="flex items-center gap-3 group">
            <div
              class="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-200">
              <svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div class="flex flex-col">
              <span class="font-bold text-base tracking-tight text-white group-hover:text-indigo-300 transition-colors">
                Projet
              </span>
              <span class="text-[10px] text-slate-400 uppercase tracking-widest font-medium">Dashboard</span>
            </div>
          </NuxtLink>

          <!-- Desktop Navigation -->
          <nav class="hidden md:flex items-center gap-1">
            <NuxtLink to="/" class="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
              :class="route.path === '/' ? 'bg-slate-800/80 text-white font-semibold' : 'text-slate-400 hover:text-white hover:bg-slate-900/60'">
              Dashboard
            </NuxtLink>

            <NuxtLink v-if="user?.role === 'ADMIN'" to="/admin"
              class="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5"
              :class="route.path.startsWith('/admin') ? 'bg-rose-500/10 text-rose-300 border border-rose-500/30 font-semibold' : 'text-slate-400 hover:text-rose-300 hover:bg-rose-500/10'">
              <span class="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
              Admin
            </NuxtLink>
          </nav>
        </div>

        <!-- Right Side: User Profile & Actions -->
        <div class="hidden md:flex items-center gap-3">
          <template v-if="user">
            <!-- Role Badge -->
            <span class="px-2.5 py-1 text-xs font-semibold rounded-full border" :class="roleBadgeClasses">
              {{ user.role }}
            </span>

            <!-- User Menu / Info -->
            <div class="flex items-center gap-3 pl-3 border-l border-slate-800">
              <div class="flex items-center gap-2.5">
                <div
                  class="w-8 h-8 rounded-full bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 flex items-center justify-center font-bold text-xs uppercase shadow-inner">
                  {{ userInitials }}
                </div>
                <div class="flex flex-col text-left">
                  <span class="text-xs font-semibold text-slate-200 leading-tight">{{ user.name }}</span>
                  <span class="text-[11px] text-slate-500 truncate max-w-[140px]">{{ user.email || user.phone }}</span>
                </div>
              </div>

              <!-- Logout Button -->
              <button @click="logout" title="Log out"
                class="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 rounded-lg transition-colors cursor-pointer">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round"
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </template>

          <template v-else>
            <NuxtLink to="/login"
              class="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-900 rounded-lg transition-colors">
              Sign In
            </NuxtLink>
            <NuxtLink to="/register"
              class="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-md shadow-indigo-600/20 transition-all">
              Get Started
            </NuxtLink>
          </template>
        </div>

        <!-- Mobile Menu Toggle Button -->
        <div class="flex md:hidden items-center gap-2">
          <button @click="mobileMenuOpen = !mobileMenuOpen"
            class="p-2 text-slate-400 hover:text-white hover:bg-slate-900 rounded-lg transition-colors cursor-pointer"
            aria-label="Toggle menu">
            <svg v-if="!mobileMenuOpen" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"
              stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <svg v-else class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Mobile Dropdown Navigation -->
    <div v-if="mobileMenuOpen" class="md:hidden border-t border-slate-800 bg-slate-950/95 px-4 pt-3 pb-4 space-y-3">
      <nav class="space-y-1">
        <NuxtLink to="/" @click="mobileMenuOpen = false"
          class="block px-3 py-2 rounded-lg text-sm font-medium transition-colors"
          :class="route.path === '/' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400 hover:text-white hover:bg-slate-900'">
          Dashboard
        </NuxtLink>
        <NuxtLink v-if="user?.role === 'ADMIN'" to="/admin" @click="mobileMenuOpen = false"
          class="block px-3 py-2 rounded-lg text-sm font-medium transition-colors"
          :class="route.path.startsWith('/admin') ? 'bg-rose-500/10 text-rose-300 font-semibold' : 'text-slate-400 hover:text-rose-300 hover:bg-rose-500/10'">
          Admin Console
        </NuxtLink>
      </nav>

      <div class="pt-3 border-t border-slate-800">
        <div v-if="user" class="space-y-3">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <div
                class="w-8 h-8 rounded-full bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 flex items-center justify-center font-bold text-xs uppercase">
                {{ userInitials }}
              </div>
              <div class="flex flex-col">
                <span class="text-xs font-semibold text-slate-200">{{ user.name }}</span>
                <span class="text-[11px] text-slate-500">{{ user.email || user.phone }}</span>
              </div>
            </div>
            <span class="px-2 py-0.5 text-[10px] font-semibold rounded-full border" :class="roleBadgeClasses">
              {{ user.role }}
            </span>
          </div>

          <button @click="logout(); mobileMenuOpen = false"
            class="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold bg-rose-600/20 text-rose-300 border border-rose-500/30 rounded-lg hover:bg-rose-600 hover:text-white transition cursor-pointer">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>

        <div v-else class="flex flex-col gap-2">
          <NuxtLink to="/login" @click="mobileMenuOpen = false"
            class="w-full py-2 text-center text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 rounded-lg">
            Sign In
          </NuxtLink>
          <NuxtLink to="/register" @click="mobileMenuOpen = false"
            class="w-full py-2 text-center text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg">
            Get Started
          </NuxtLink>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
const route = useRoute()
const { user, logout } = useAuth()

const mobileMenuOpen = ref(false)

// Close mobile menu when navigating to another route
watch(() => route.path, () => {
  mobileMenuOpen.value = false
})

const userInitials = computed(() => {
  if (!user.value?.name) return "U"
  return user.value.name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase()
})

const roleBadgeClasses = computed(() => {
  switch (user.value?.role) {
    case "ADMIN":
      return "bg-rose-500/10 text-rose-300 border-rose-500/30"
    case "RESTAURANT_OWNER":
      return "bg-amber-500/10 text-amber-300 border-amber-500/30"
    case "DELIVERY_PARTNER":
      return "bg-cyan-500/10 text-cyan-300 border-cyan-500/30"
    case "CUSTOMER":
    default:
      return "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
  }
})
</script>
