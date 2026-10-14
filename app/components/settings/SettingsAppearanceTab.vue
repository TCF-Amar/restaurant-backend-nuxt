<template>
  <div class="rounded-3xl glass-card p-6 sm:p-8 border border-white/10 space-y-6">
    <div class="border-b border-white/[0.08] pb-4">
      <h2 class="text-lg font-bold text-white">Interface & Glass UI Appearance</h2>
      <p class="text-xs text-slate-400">Tune the sidebar dimensions, glassmorphism blur intensity, and glow accents.</p>
    </div>

    <!-- Sidebar Resizer Controls -->
    <div class="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06] space-y-4">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-xs font-semibold text-white">Sidebar Default Width</p>
          <p class="text-[11px] text-slate-400">Adjust the open sidebar width (synced with drag handle)</p>
        </div>
        <span
          class="px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 font-mono text-xs font-bold border border-indigo-500/30">
          {{ Math.round(sidebarWidth) }}px
        </span>
      </div>

      <input type="range" :min="minWidth" :max="maxWidth" v-model.number="sidebarWidth" :disabled="isCollapsed"
        class="w-full accent-indigo-500 cursor-pointer disabled:opacity-40" />

      <div class="flex items-center justify-between text-[10px] text-slate-500">
        <span>{{ minWidth }}px (Compact)</span>
        <button @click="resetWidth" type="button"
          class="text-indigo-400 hover:text-indigo-300 underline underline-offset-2 cursor-pointer font-medium">
          Reset to default (280px)
        </button>
        <span>{{ maxWidth }}px (Wide)</span>
      </div>
    </div>

    <!-- Sidebar Mode Toggle -->
    <div class="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between">
      <div>
        <p class="text-xs font-semibold text-white">Sidebar Collapse Mode</p>
        <p class="text-[11px] text-slate-400">Switch between expanded navigation and compact icon-rail mode</p>
      </div>
      <div class="flex items-center gap-2">
        <button @click="setCollapsed(false)" type="button" :class="[
          'px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer border',
          !isCollapsed ? 'bg-indigo-600/40 border-indigo-500/50 text-white' : 'bg-white/[0.03] border-white/10 text-slate-400'
        ]">
          Expanded
        </button>
        <button @click="setCollapsed(true)" type="button" :class="[
          'px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer border',
          isCollapsed ? 'bg-indigo-600/40 border-indigo-500/50 text-white' : 'bg-white/[0.03] border-white/10 text-slate-400'
        ]">
          Icon Rail
        </button>
      </div>
    </div>

    <!-- Glass Blur Radius Pixel Controller -->
    <div class="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06] space-y-4">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-xs font-semibold text-white flex items-center gap-1.5">
            <LucideSparkles class="w-3.5 h-3.5 text-indigo-400" />
            <span>Glass Blur Radius (Pixels)</span>
          </p>
          <p class="text-[11px] text-slate-400">Choose exact backdrop blur radius in pixels for header, sidebar, footer & cards</p>
        </div>
        <div class="flex items-center gap-2">
          <input type="number" min="0" max="32" step="0.5" :value="blurRadius"
            @input="e => setBlur(parseFloat((e.target as HTMLInputElement).value))"
            class="w-16 px-2 py-1 rounded-lg glass-input text-xs text-center font-mono text-indigo-300 font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500" />
          <span class="text-xs text-slate-400 font-mono">px</span>
        </div>
      </div>

      <!-- Range Slider -->
      <input type="range" min="0" max="32" step="0.5" :value="blurRadius"
        @input="e => setBlur(parseFloat((e.target as HTMLInputElement).value))"
        class="w-full accent-indigo-500 cursor-pointer" />

      <!-- Presets buttons -->
      <div class="space-y-1.5">
        <span class="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Quick Pixel Presets:</span>
        <div class="grid grid-cols-3 sm:grid-cols-6 gap-2">
          <button v-for="preset in presets" :key="preset.px" @click="setBlur(preset.px)" type="button" :class="[
            'py-2 px-1 text-[11px] font-mono rounded-xl border text-center transition cursor-pointer',
            blurRadius === preset.px
              ? 'bg-indigo-600/30 border-indigo-500/60 text-white shadow-sm'
              : 'bg-white/[0.02] border-white/10 text-slate-400 hover:text-white'
          ]">
            {{ preset.label }}
          </button>
        </div>
      </div>

      <!-- Mini Live Preview Box -->
      <div
        class="mt-4 p-4 h-50 flex justify-center items-center rounded-xl border border-white/10 relative overflow-hidden bg-cover bg-center"
        style="background-image: url('/images/dashboard-bg.jpg')">
        <div
          class="glass-header border border-white/20 w-[90%] h-[70%] flex flex-col justify-center items-center gap-3 rounded-lg text-center"
          :style="{ backdropFilter: `blur(${blurRadius}px)` }">
          <p class="text-xs font-semibold text-white">Live Blur Preview: {{ blurRadius }}px</p>
          <p class="text-[10px] text-slate-300">Header, sidebar & footer instantly update to this exact blur radius.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { sidebarWidth, minWidth, maxWidth, isCollapsed, setCollapsed, resetWidth } = useSidebar()
const { blurRadius, setBlur } = useGlassSettings()

const presets = [
  { px: 0, label: '0px (Clear)' },
  { px: 1.5, label: '1.5px (Subtle)' },
  { px: 4, label: '4px (Light)' },
  { px: 8, label: '8px (Frosted)' },
  { px: 16, label: '16px (Dense)' },
  { px: 24, label: '24px (Heavy)' },
]
</script>
