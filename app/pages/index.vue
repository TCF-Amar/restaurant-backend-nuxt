<template>
  <div class="flex-1 flex flex-col items-center justify-center p-6 sm:p-8">
    <div class="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      <div class="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <h1 class="text-xl font-bold text-white">Dashboard</h1>
          <p class="text-xs text-slate-400">Protected Home Page</p>
        </div>
        <button @click="logout"
          class="px-3 py-1.5 text-xs font-semibold bg-rose-600/20 text-rose-300 border border-rose-500/30 rounded-lg hover:bg-rose-600 hover:text-white transition cursor-pointer">
          Logout
        </button>
      </div>

      <div v-if="user" class="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800/80">
        <p class="text-sm text-slate-400">Welcome,</p>
        <p class="text-lg font-bold text-indigo-400">{{ user.name }}</p>
        <div class="text-xs text-slate-400 space-y-1">
          <p><span class="text-slate-500 font-medium">Email:</span> {{ user.email }}</p>
          <p><span class="text-slate-500 font-medium">Role:</span> <span
              class="uppercase tracking-wider font-semibold text-emerald-400">{{ user.role }}</span></p>
          <p><span class="text-slate-500 font-medium">ID:</span> <code class="text-slate-400">{{ user.id }}</code></p>
        </div>
      </div>

      <div class="space-y-4 pt-2">
        <CompOne />
        <CompTwo />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { user, logout } = useAuth()
</script>