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
        class="mt-4 p-4 h-50 flex justify-center items-center rounded-xl border border-white/10 relative overflow-hidden bg-cover bg-center transition-all duration-700"
        :style="{ backgroundImage: `url(${backgroundImage})` }">
        <div
          class="glass-header border border-white/20 w-[90%] h-[70%] flex flex-col justify-center items-center gap-3 rounded-lg text-center"
          :style="{ backdropFilter: `blur(${blurRadius}px)` }">
          <p class="text-xs font-semibold text-white">Live Blur & Wallpaper Preview: {{ blurRadius }}px</p>
          <p class="text-[10px] text-slate-300">Header, sidebar & footer instantly update with your selected wallpaper and blur.</p>
        </div>
      </div>
    </div>

    <!-- Background Wallpaper & Theme Ambience -->
    <div class="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06] space-y-5">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-xs font-semibold text-white flex items-center gap-1.5">
            <LucideImage class="w-3.5 h-3.5 text-indigo-400" />
            <span>Background Wallpaper & Ambience</span>
          </p>
          <p class="text-[11px] text-slate-400">Choose from curated 3D liquid glass wallpapers or enter a custom image URL</p>
        </div>
        <button
          v-if="backgroundImage !== defaultWallpaper"
          @click="resetWallpaper"
          type="button"
          class="text-[11px] text-indigo-400 hover:text-indigo-300 underline underline-offset-2 cursor-pointer flex items-center gap-1"
        >
          <LucideRotateCcw class="w-3 h-3" />
          <span>Reset Wallpaper</span>
        </button>
      </div>

      <!-- Wallpaper Preset Cards Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <div
          v-for="wp in wallpaperPresets"
          :key="wp.url"
          @click="setBackgroundImage(wp.url)"
          :class="[
            'group relative rounded-xl border p-2 flex flex-col gap-2 cursor-pointer transition-all duration-300 overflow-hidden text-left',
            backgroundImage === wp.url
              ? 'bg-indigo-600/20 border-indigo-500 shadow-lg shadow-indigo-500/20 ring-1 ring-indigo-500/60'
              : 'bg-white/[0.02] border-white/10 hover:border-white/30 hover:bg-white/[0.04]'
          ]"
        >
          <!-- Thumbnail with overlay -->
          <div class="relative w-full h-24 rounded-lg overflow-hidden bg-slate-900 border border-white/5">
            <img
              :src="wp.url"
              :alt="wp.title"
              class="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
            />
            <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
            <!-- Active Check Badge -->
            <div
              v-if="backgroundImage === wp.url"
              class="absolute top-2 right-2 px-1.5 py-0.5 rounded-full bg-indigo-500 text-white text-[10px] font-bold flex items-center gap-1 shadow-sm"
            >
              <LucideCheck class="w-2.5 h-2.5" />
              <span>Active</span>
            </div>
            <!-- Tag -->
            <div class="absolute bottom-1.5 left-2">
              <span class="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/15 backdrop-blur-md text-white border border-white/10">
                {{ wp.tag }}
              </span>
            </div>
          </div>

          <!-- Description -->
          <div class="px-1 py-0.5">
            <p class="text-xs font-semibold text-white">{{ wp.title }}</p>
            <p class="text-[10px] text-slate-400 line-clamp-1">{{ wp.desc }}</p>
          </div>
        </div>
      </div>

      <!-- Custom Wallpaper URL Input -->
      <div class="pt-3 border-t border-white/[0.06] space-y-2">
        <label class="text-[11px] font-medium text-slate-300 flex items-center gap-1.5">
          <LucideLink class="w-3 h-3 text-slate-400" />
          <span>Custom Background Image URL</span>
        </label>
        <div class="flex items-center gap-2">
          <input
            v-model="customUrl"
            type="url"
            placeholder="https://example.com/your-wallpaper.jpg"
            @keyup.enter="applyCustomUrl"
            class="flex-1 px-3 py-2 rounded-xl glass-input text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
          />
          <button
            @click="applyCustomUrl"
            :disabled="!customUrl.trim()"
            type="button"
            class="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-medium text-white shadow-sm transition cursor-pointer"
          >
            Apply
          </button>
        </div>
        <p class="text-[10px] text-slate-500">Supports direct URLs to PNG, JPG, or WebP images.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { sidebarWidth, minWidth, maxWidth, isCollapsed, setCollapsed, resetWidth } = useSidebar()
const { blurRadius, setBlur, backgroundImage, setBackgroundImage } = useGlassSettings()

const defaultWallpaper = '/images/cyber-glass-bg.jpg'
const customUrl = ref('')

const wallpaperPresets = [
  {
    title: 'Liquid Chromatic Ribbon',
    desc: 'Iridescent refractive glass ribbons in deep obsidian space',
    url: '/images/cyber-glass-bg.jpg',
    tag: 'Ultra Luxury',
  },
  {
    title: 'Dark Obsidian Wave',
    desc: 'Sleek dark fluid ribbons with violet and electric cyan neon glow',
    url: '/images/dark-bg.jpg',
    tag: 'Dark Mode',
  },
  {
    title: 'Atmospheric Deep Violet',
    desc: 'Luminous violet ambient glass with subtle deep purple glow',
    url: '/images/auth-bg.jpg',
    tag: 'Deep Focus',
  },
  {
    title: 'Prismatic Light Glass',
    desc: 'Bright translucent crystal dispersion with pure ethereal highlights',
    url: '/images/dashboard-bg-light.jpg',
    tag: 'Light Accent',
  },
  {
    title: 'Cosmic Nebula Glass',
    desc: 'Vibrant galactic glass refraction with soft electric glow',
    url: '/images/dashboard-bg-prev.jpg',
    tag: 'Cosmic',
  },
]

const applyCustomUrl = () => {
  if (customUrl.value && customUrl.value.trim()) {
    setBackgroundImage(customUrl.value.trim())
    customUrl.value = ''
  }
}

const resetWallpaper = () => {
  setBackgroundImage(defaultWallpaper)
}

const presets = [
  { px: 0, label: '0px (Clear)' },
  { px: 1.5, label: '1.5px (Subtle)' },
  { px: 4, label: '4px (Light)' },
  { px: 8, label: '8px (Frosted)' },
  { px: 16, label: '16px (Dense)' },
  { px: 24, label: '24px (Heavy)' },
]
</script>

