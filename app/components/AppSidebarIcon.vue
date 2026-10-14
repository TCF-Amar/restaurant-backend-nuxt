<template>
  <span class="shrink-0 flex items-center justify-center">
    <LucideLayoutDashboard v-if="name === 'LucideLayoutDashboard'" :class="classNames" />
    <LucideBarChart3 v-else-if="name === 'LucideBarChart3'" :class="classNames" />
    <LucideUtensils v-else-if="name === 'LucideUtensils'" :class="classNames" />
    <LucideFolderTree v-else-if="name === 'LucideFolderTree'" :class="classNames" />
    <LucideShoppingBag v-else-if="name === 'LucideShoppingBag'" :class="classNames" />
    <LucideCreditCard v-else-if="name === 'LucideCreditCard'" :class="classNames" />
    <LucideUsers v-else-if="name === 'LucideUsers'" :class="classNames" />
    <LucideBookOpen v-else-if="name === 'LucideBookOpen'" :class="classNames" />
    <LucideFileCode v-else-if="name === 'LucideFileCode'" :class="classNames" />
    <LucideSettings v-else-if="name === 'LucideSettings'" :class="classNames" />
    <LucideCircleDot v-else :class="classNames" />
  </span>
</template>

<script setup lang="ts">
defineProps<{
  name: string
  classNames?: string
}>()
</script>
