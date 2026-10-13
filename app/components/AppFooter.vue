<template>
  <footer class="w-full glass-footer select-none relative z-20">
    <!-- Ambient top glow hairline -->
    <div class="h-[1px] w-full bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
      <!-- Left: Copyright & Branding -->
      <div class="flex items-center gap-3">
        <div class="flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]"></span>
          <span class="font-semibold text-slate-200">PROJET Console</span>
        </div>
        <span class="text-slate-600">|</span>
        <p class="text-slate-400">© 2026 All rights reserved.</p>
      </div>

      <!-- Center / Right: System metrics with Glass glow -->
      <div class="flex flex-wrap items-center gap-4 sm:gap-6">
        <!-- Live Engine Status -->
        <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[11px] backdrop-blur-md">
          <span class="relative flex h-1.5 w-1.5">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400"></span>
          </span>
          <span>Prisma DB Active</span>
        </div>

        <!-- Latency Indicator -->
        <div class="hidden md:inline-flex items-center gap-1.5 text-[11px] text-slate-400">
          <LucideActivity class="w-3.5 h-3.5 text-indigo-400" />
          <span>Latency: <strong class="text-slate-200 font-mono">18ms</strong></span>
        </div>

        <!-- Documentation & Quick Links -->
        <div class="flex items-center gap-3 text-slate-400">
          <NuxtLink
            to="/docs"
            target="_blank"
            class="hover:text-white transition flex items-center gap-1 hover:underline cursor-pointer"
          >
            <LucideBookOpen class="w-3 h-3 text-slate-400" />
            <span>API Docs</span>
          </NuxtLink>
          <span class="text-slate-700">•</span>
          <a href="#" class="hover:text-white transition">Privacy</a>
          <span class="text-slate-700">•</span>
          <a href="#" class="hover:text-white transition">Terms</a>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
// Glass footer component
</script>
