<template>
  <div
    class="min-h-screen bg-[#070510] text-slate-100 flex flex-col relative overflow-x-hidden selection:bg-indigo-500 selection:text-white">
    <!-- Fluid 3D Glassmorphic Background Image -->
    <div class="fixed inset-0 pointer-events-none overflow-hidden z-0">
      <img src="/images/dashboard-bg.jpg" alt="Fluid 3D Glass Ambient Background"
        class="absolute inset-0 w-full h-full object-cover object-center select-none " />
      <!-- Ambient overlay & subtle glow orbs -->
      <div class="absolute inset-0 bg-[#04020a]/30"></div>
      <div class="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-indigo-600/20 blur-[140px]"></div>
      <div class="absolute top-1/4 -right-32 w-[30rem] h-[30rem] rounded-full bg-purple-600/15 blur-[160px]"></div>
      <div class="absolute -bottom-20 right-1/4 w-[28rem] h-[28rem] rounded-full bg-cyan-600/10 blur-[160px]"></div>
    </div>

    <!-- Global Glass Header -->
    <AppHeader />

    <!-- Sidebar & Main Screen Body Wrapper (offset for fixed 64px header) -->
    <div class="flex-1 flex relative z-10 pt-16">
      <!-- Resizable Glass Sidebar -->
      <AppSidebar />

      <!-- Main Screen Area (Responsive margin to accommodate sidebar) -->
      <div :style="mainAreaStyle" :class="[
        'flex-1 flex flex-col min-w-0 transition-all',
        !isDragging ? 'duration-300 ease-in-out' : 'duration-0'
      ]">
        <!-- Page Slot -->
        <main class="flex-1 p-4 sm:p-6 lg:p-8">
          <slot />
        </main>

        <!-- Glass Footer -->
        <AppFooter />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { isCollapsed, sidebarWidth, isDragging, collapsedWidth } = useSidebar()
const { blurRadius } = useGlassSettings()

// Dynamic left margin on desktop (lg screen and up) matching the sidebar size
const isLgScreen = ref(true)

onMounted(() => {
  if (import.meta.client) {
    const updateScreen = () => {
      isLgScreen.value = window.innerWidth >= 1024
    }
    updateScreen()
    window.addEventListener('resize', updateScreen)
    onUnmounted(() => window.removeEventListener('resize', updateScreen))
  }
})

const mainAreaStyle = computed(() => {
  if (!isLgScreen.value) {
    return { marginLeft: '0px' }
  }
  const offset = isCollapsed.value ? collapsedWidth : sidebarWidth.value
  return {
    marginLeft: `${offset}px`,
  }
})
</script>
