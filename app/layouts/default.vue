<template>
  <div class="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased selection:bg-indigo-500 selection:text-white">
    <!-- Global Header -->
    <AppHeader />

    <!-- Page Content -->
    <main class="flex-1 flex flex-col">
      <slot />
    </main>

    <!-- Global Footer -->
    <footer class="border-t border-slate-900 bg-slate-950/80 py-6 text-center text-xs text-slate-500">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p>© 2026 Projet. All rights reserved.</p>
        <div class="flex items-center gap-4 text-slate-400">
          <span class="inline-flex items-center gap-1.5 text-xs text-emerald-400">
            <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            All systems normal
          </span>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
// Default layout with persistent header and footer
</script>
