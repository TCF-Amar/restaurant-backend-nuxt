<template>
  <Teleport to="body">
    <transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0" leave-active-class="transition duration-150 ease-in" leave-to-class="opacity-0">
      <div v-if="show" class="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto">
        <div class="w-full max-w-lg rounded-3xl glass-card border border-white/20 p-6 sm:p-7 space-y-5 shadow-2xl relative my-auto max-h-[85vh] overflow-y-auto">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300">
              <LucideStore class="w-4 h-4" />
            </div>
            <div>
              <h3 class="text-base font-bold text-white">
                {{ isEditing ? 'Edit Outlet Permissions' : 'Assign Restaurant Outlet' }}
              </h3>
              <p class="text-xs text-slate-400">Configure access and operational rights</p>
            </div>
          </div>

          <button
            @click="$emit('close')"
            type="button"
            class="w-8 h-8 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <LucideX class="w-4 h-4" />
          </button>
        </div>

        <!-- Restaurant Selector -->
        <div class="space-y-1.5">
          <label class="text-xs font-semibold text-slate-300">Select Restaurant Outlet</label>
          <select
            v-model="form.restaurantId"
            :disabled="isEditing"
            class="w-full px-3.5 py-2.5 text-xs rounded-xl glass-input text-white focus:outline-none focus:ring-1 focus:ring-purple-500/50 bg-[#141226] border border-white/10 disabled:opacity-50"
          >
            <option value="" disabled class="bg-slate-900 text-slate-400">Choose a restaurant...</option>
            <option
              v-for="rest in availableRestaurants"
              :key="rest.id"
              :value="rest.id"
              class="bg-slate-900 text-white"
            >
              {{ rest.name }} ({{ rest.slug }})
            </option>
          </select>
        </div>

        <!-- Granular Permissions Checklist -->
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <label class="text-xs font-semibold text-slate-300">Operational Permissions</label>
            <div class="flex items-center gap-2 text-[11px]">
              <button
                @click="selectAllPermissions"
                type="button"
                class="text-purple-400 hover:text-purple-300 underline cursor-pointer"
              >
                Select All
              </button>
              <span class="text-slate-600">|</span>
              <button
                @click="form.permissions = []"
                type="button"
                class="text-slate-400 hover:text-slate-300 underline cursor-pointer"
              >
                Clear
              </button>
            </div>
          </div>

          <div class="space-y-2 max-h-56 overflow-y-auto pr-1">
            <label
              v-for="perm in permissionOptions"
              :key="perm.id"
              :class="[
                'p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition',
                form.permissions.includes(perm.id)
                  ? 'bg-purple-600/15 border-purple-500/40 text-white'
                  : 'bg-white/[0.02] border-white/5 hover:border-white/15 text-slate-300'
              ]"
            >
              <input
                type="checkbox"
                :value="perm.id"
                v-model="form.permissions"
                class="mt-0.5 rounded border-white/20 bg-white/5 text-purple-600 focus:ring-purple-500/50"
              />
              <div class="text-xs space-y-0.5">
                <div class="font-bold text-white">{{ perm.label }}</div>
                <div class="text-[11px] text-slate-400">{{ perm.description }}</div>
              </div>
            </label>
          </div>
        </div>

        <!-- Primary Outlet Checkbox -->
        <label class="p-3 rounded-xl bg-white/[0.02] border border-white/10 flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            v-model="form.isPrimary"
            class="rounded border-white/20 bg-white/5 text-purple-600 focus:ring-purple-500/50"
          />
          <div class="text-xs">
            <div class="font-semibold text-white">Set as Primary Outlet</div>
            <div class="text-[11px] text-slate-400">Makes this the default active outlet when the user logs into merchant portal.</div>
          </div>
        </label>

        <p class="text-[11px] text-indigo-300 bg-indigo-500/10 p-2.5 rounded-xl border border-indigo-500/20">
          <strong>Note:</strong> Assigning outlet access will automatically elevate a Customer's role to <strong>Restaurant Owner</strong>.
        </p>

        <!-- Buttons -->
        <div class="flex items-center justify-end gap-2.5 pt-2 border-t border-white/10">
          <button
            @click="$emit('close')"
            type="button"
            class="px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 text-xs font-semibold transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            @click="$emit('submit')"
            :disabled="isSubmitting || !form.restaurantId || form.permissions.length === 0"
            type="button"
            class="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:hover:bg-purple-600 text-white text-xs font-bold transition shadow-lg flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed"
          >
            <LucideLoader2 v-if="isSubmitting" class="w-3.5 h-3.5 animate-spin" />
            <span>{{ isEditing ? 'Save Changes' : 'Grant Access' }}</span>
          </button>
        </div>
      </div>
    </div>
  </transition>
</Teleport>
</template>

<script setup lang="ts">
const props = defineProps<{
  show: boolean
  isEditing: boolean
  isSubmitting?: boolean
  availableRestaurants: any[]
  form: {
    restaurantId: string
    permissions: string[]
    isPrimary: boolean
  }
}>()

defineEmits<{
  (e: 'close'): void
  (e: 'submit'): void
}>()

const permissionOptions = [
  {
    id: 'MANAGE_OUTLET',
    label: 'Manage Outlet Profile & Settings',
    description: 'Configure restaurant name, contact, operating hours, and active status.',
  },
  {
    id: 'MANAGE_CATEGORIES',
    label: 'Manage Food Categories',
    description: 'Create, edit, reorder, and remove menu categories.',
  },
  {
    id: 'MANAGE_MENU_ITEMS',
    label: 'Manage Menu Items & Prices',
    description: 'Add dishes, update pricing, toggle stock availability, and manage variants.',
  },
  {
    id: 'MANAGE_ORDERS',
    label: 'Manage Live Orders',
    description: 'View incoming kitchen orders, accept, prepare, and update status.',
  },
]

function selectAllPermissions() {
  props.form.permissions = ['MANAGE_OUTLET', 'MANAGE_CATEGORIES', 'MANAGE_MENU_ITEMS', 'MANAGE_ORDERS']
}
</script>
