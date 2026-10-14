<template>
  <div class="rounded-3xl glass-card p-6 sm:p-8 border border-white/10 space-y-6">
    <div class="border-b border-white/[0.08] pb-4">
      <h2 class="text-lg font-bold text-white">Notification Preferences</h2>
      <p class="text-xs text-slate-400">Configure how and when you receive order alerts and system events.</p>
    </div>

    <div class="space-y-4">
      <div v-for="item in notificationSettings" :key="item.id"
        class="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
        <div class="space-y-0.5">
          <p class="text-xs font-semibold text-white">{{ item.title }}</p>
          <p class="text-[11px] text-slate-400">{{ item.description }}</p>
        </div>
        <input type="checkbox" v-model="item.enabled" class="w-4 h-4 rounded accent-indigo-600 cursor-pointer" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const notificationSettings = ref([
  { id: 'orders', title: 'Real-time Order Updates', description: 'Get notified when customer orders change status', enabled: true },
  { id: 'security', title: 'Security & Login Alerts', description: 'Receive email alerts on logins from new devices', enabled: true },
  { id: 'digest', title: 'Daily Analytics Digest', description: 'Daily summary report of restaurant revenues', enabled: false },
])
</script>
