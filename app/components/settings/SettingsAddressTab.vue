<template>
  <div class="space-y-6">
    <!-- Header with Add Address button -->
    <div class="rounded-3xl glass-card p-6 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h2 class="text-base font-bold text-white flex items-center gap-2">
          <LucideMapPin class="w-4 h-4 text-indigo-400" />
          <span>Saved Addresses</span>
        </h2>
        <p class="text-xs text-slate-300 mt-0.5">
          Manage your personal delivery and dispatch addresses synchronized across web and mobile.
        </p>
      </div>

      <button
        @click="openAddModal"
        type="button"
        class="px-4 py-2 rounded-xl bg-indigo-600/40 hover:bg-indigo-600/60 border border-indigo-500/50 text-white text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 self-start sm:self-auto shadow-md"
      >
        <LucidePlus class="w-3.5 h-3.5" />
        <span>Add New Address</span>
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="p-12 text-center text-slate-400 text-xs">
      <LucideLoader2 class="w-6 h-6 animate-spin mx-auto text-indigo-400 mb-2" />
      <span>Loading addresses...</span>
    </div>

    <!-- Address Cards Grid -->
    <div v-else-if="addresses.length > 0" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div
        v-for="addr in addresses"
        :key="addr.id"
        class="rounded-3xl glass-card p-5 border border-white/10 hover:border-white/20 transition flex flex-col justify-between space-y-4"
      >
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/[0.05] border border-white/10 text-white">
              <LucideHome v-if="addr.label?.toLowerCase() === 'home'" class="w-3 h-3 text-indigo-400" />
              <LucideBriefcase v-else-if="addr.label?.toLowerCase() === 'work'" class="w-3 h-3 text-purple-400" />
              <LucideMapPin v-else class="w-3 h-3 text-emerald-400" />
              <span>{{ addr.label || 'Home' }}</span>
            </span>

            <span
              v-if="addr.isDefault"
              class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 border border-emerald-500/40 text-emerald-300"
            >
              Default
            </span>
          </div>

          <div class="text-xs text-slate-200 space-y-1">
            <p class="font-bold text-white text-sm">{{ addr.recipientName }}</p>
            <p class="text-[11px] text-slate-400 flex items-center gap-1">
              <LucidePhone class="w-3 h-3 text-slate-500" />
              <span>{{ addr.phone }}</span>
            </p>
            <p class="pt-1 text-slate-300 leading-relaxed">
              {{ addr.addressLine1 }}<span v-if="addr.addressLine2">, {{ addr.addressLine2 }}</span>
            </p>
            <p v-if="addr.landmark" class="text-[11px] text-slate-400">
              Landmark: {{ addr.landmark }}
            </p>
            <p class="text-[11px] text-slate-400 font-medium">
              {{ addr.city }}, {{ addr.state }} - {{ addr.postalCode }}
            </p>
          </div>
        </div>

        <!-- Address Card Actions -->
        <div class="pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs">
          <button
            v-if="!addr.isDefault"
            @click="setDefault(addr.id)"
            type="button"
            class="text-[11px] text-indigo-300 hover:text-indigo-200 font-medium cursor-pointer transition flex items-center gap-1"
          >
            <LucideCheckCircle2 class="w-3 h-3" />
            <span>Set as Default</span>
          </button>
          <span v-else class="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
            <LucideCheck class="w-3 h-3" />
            <span>Primary Delivery Location</span>
          </span>

          <div class="flex items-center gap-1.5">
            <button
              @click="openEditModal(addr)"
              type="button"
              class="p-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 hover:text-white transition cursor-pointer"
              title="Edit Address"
            >
              <LucideEdit class="w-3.5 h-3.5 text-indigo-400" />
            </button>
            <button
              @click="deleteAddress(addr.id)"
              type="button"
              class="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 transition cursor-pointer"
              title="Delete Address"
            >
              <LucideTrash2 class="w-3.5 h-3.5 text-rose-400" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="rounded-3xl glass-card p-12 text-center border border-white/10 space-y-3">
      <LucideMapPin class="w-10 h-10 text-slate-500 mx-auto" />
      <h3 class="text-sm font-semibold text-white">No Saved Addresses</h3>
      <p class="text-xs text-slate-400 max-w-sm mx-auto">
        Add your delivery location or headquarters dispatch addresses to use across the platform.
      </p>
      <button
        @click="openAddModal"
        type="button"
        class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600/40 hover:bg-indigo-600/60 border border-indigo-500/50 text-white text-xs font-semibold transition cursor-pointer"
      >
        <LucidePlus class="w-3.5 h-3.5" />
        <span>Add First Address</span>
      </button>
    </div>

    <!-- Address Modal (Add / Edit) -->
    <Teleport to="body">
      <div v-if="isModalOpen" class="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        <div class="fixed inset-0 bg-black/80 backdrop-blur-md" @click="isModalOpen = false"></div>

        <div class="relative w-full max-w-lg rounded-3xl glass-card border border-white/10 shadow-2xl p-6 space-y-5 z-10 my-auto max-h-[85vh] overflow-y-auto">
        <div class="flex items-center justify-between border-b border-white/10 pb-4">
          <h3 class="text-base font-bold text-white flex items-center gap-2">
            <LucideMapPin class="w-4 h-4 text-indigo-400" />
            <span>{{ editingId ? 'Edit Address' : 'Add New Address' }}</span>
          </h3>
          <button @click="isModalOpen = false" class="p-1.5 text-slate-400 hover:text-white rounded-lg">
            <LucideX class="w-4 h-4" />
          </button>
        </div>

        <form @submit.prevent="saveAddress" class="space-y-4 text-xs">
          <!-- Label picker (Home, Work, Other) -->
          <div>
            <label class="block text-slate-300 font-medium mb-1.5">Address Label</label>
            <div class="flex items-center gap-2">
              <button
                v-for="l in ['Home', 'Work', 'Office', 'Other']"
                :key="l"
                type="button"
                @click="form.label = l"
                :class="[
                  'px-3 py-1.5 rounded-xl font-medium transition cursor-pointer border',
                  form.label === l
                    ? 'bg-indigo-600/40 text-white border-indigo-500/60'
                    : 'bg-white/[0.03] text-slate-400 border-white/10 hover:text-white'
                ]"
              >
                {{ l }}
              </button>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-slate-300 font-medium mb-1">Recipient Name *</label>
              <input
                v-model="form.recipientName"
                type="text"
                required
                placeholder="e.g. John Doe"
                class="w-full px-3.5 py-2.5 rounded-xl glass-input text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
              />
            </div>
            <div>
              <label class="block text-slate-300 font-medium mb-1">Phone Number *</label>
              <input
                v-model="form.phone"
                type="tel"
                required
                placeholder="+1 (555) 000-0000"
                class="w-full px-3.5 py-2.5 rounded-xl glass-input text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
              />
            </div>
          </div>

          <div>
            <label class="block text-slate-300 font-medium mb-1">Address Line 1 (Street / Building) *</label>
            <input
              v-model="form.addressLine1"
              type="text"
              required
              placeholder="123 Artisan Way, Apt 4B"
              class="w-full px-3.5 py-2.5 rounded-xl glass-input text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
            />
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-slate-300 font-medium mb-1">Address Line 2 (Optional)</label>
              <input
                v-model="form.addressLine2"
                type="text"
                placeholder="Floor, Unit, Suite"
                class="w-full px-3.5 py-2.5 rounded-xl glass-input text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
              />
            </div>
            <div>
              <label class="block text-slate-300 font-medium mb-1">Landmark (Optional)</label>
              <input
                v-model="form.landmark"
                type="text"
                placeholder="Near Central Park Gate"
                class="w-full px-3.5 py-2.5 rounded-xl glass-input text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
              />
            </div>
          </div>

          <div class="grid grid-cols-3 gap-3">
            <div>
              <label class="block text-slate-300 font-medium mb-1">City *</label>
              <input
                v-model="form.city"
                type="text"
                required
                placeholder="New York"
                class="w-full px-3.5 py-2.5 rounded-xl glass-input text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
              />
            </div>
            <div>
              <label class="block text-slate-300 font-medium mb-1">State *</label>
              <input
                v-model="form.state"
                type="text"
                required
                placeholder="NY"
                class="w-full px-3.5 py-2.5 rounded-xl glass-input text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
              />
            </div>
            <div>
              <label class="block text-slate-300 font-medium mb-1">Postal Code *</label>
              <input
                v-model="form.postalCode"
                type="text"
                required
                placeholder="10001"
                class="w-full px-3.5 py-2.5 rounded-xl glass-input text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
              />
            </div>
          </div>

          <div class="flex items-center gap-2 pt-1">
            <input
              id="isDefault"
              v-model="form.isDefault"
              type="checkbox"
              class="w-4 h-4 rounded border-white/20 bg-white/5 text-indigo-500 focus:ring-indigo-500/40"
            />
            <label for="isDefault" class="text-xs text-slate-300 cursor-pointer">
              Set as my default primary address
            </label>
          </div>

          <div class="flex items-center justify-end gap-2 pt-4 border-t border-white/10">
            <button
              @click="isModalOpen = false"
              type="button"
              class="px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 hover:text-white transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="isSubmitting"
              class="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition cursor-pointer flex items-center gap-1.5 shadow-md disabled:opacity-50"
            >
              <LucideLoader2 v-if="isSubmitting" class="w-3.5 h-3.5 animate-spin" />
              <span>{{ editingId ? 'Update Address' : 'Save Address' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
  </div>
</template>

<script setup lang="ts">
const emit = defineEmits<{
  (e: 'notify', payload: { type: 'success' | 'error'; message: string }): void
}>()

const api = useApi()
const addresses = ref<any[]>([])
const isLoading = ref(true)
const isSubmitting = ref(false)
const isModalOpen = ref(false)
const editingId = ref<string | null>(null)

const form = reactive({
  label: 'Home',
  recipientName: '',
  phone: '',
  addressLine1: '',
  addressLine2: '',
  landmark: '',
  city: '',
  state: '',
  postalCode: '',
  isDefault: false,
})

async function fetchAddresses() {
  isLoading.value = true
  try {
    const res = await api.get<any>('/api/v1/user/addresses')
    addresses.value = res?.addresses || []
  } catch (err: any) {
    addresses.value = []
  } finally {
    isLoading.value = false
  }
}

function openAddModal() {
  editingId.value = null
  form.label = 'Home'
  form.recipientName = ''
  form.phone = ''
  form.addressLine1 = ''
  form.addressLine2 = ''
  form.landmark = ''
  form.city = ''
  form.state = ''
  form.postalCode = ''
  form.isDefault = addresses.value.length === 0
  isModalOpen.value = true
}

function openEditModal(addr: any) {
  editingId.value = addr.id
  form.label = addr.label || 'Home'
  form.recipientName = addr.recipientName || ''
  form.phone = addr.phone || ''
  form.addressLine1 = addr.addressLine1 || ''
  form.addressLine2 = addr.addressLine2 || ''
  form.landmark = addr.landmark || ''
  form.city = addr.city || ''
  form.state = addr.state || ''
  form.postalCode = addr.postalCode || ''
  form.isDefault = !!addr.isDefault
  isModalOpen.value = true
}

async function saveAddress() {
  isSubmitting.value = true
  try {
    if (editingId.value) {
      await api.put(`/api/v1/user/addresses/${editingId.value}`, form)
      emit('notify', { type: 'success', message: 'Address updated successfully' })
    } else {
      await api.post('/api/v1/user/addresses', form)
      emit('notify', { type: 'success', message: 'New address added to your address book' })
    }
    isModalOpen.value = false
    await fetchAddresses()
  } catch (err: any) {
    emit('notify', { type: 'error', message: err.data?.message || 'Failed to save address' })
  } finally {
    isSubmitting.value = false
  }
}

async function setDefault(id: string) {
  try {
    await api.patch(`/api/v1/user/addresses/${id}/default`)
    emit('notify', { type: 'success', message: 'Default address updated' })
    await fetchAddresses()
  } catch (err: any) {
    emit('notify', { type: 'error', message: 'Failed to update default address' })
  }
}

async function deleteAddress(id: string) {
  if (!confirm('Are you sure you want to remove this address?')) return
  try {
    await api.delete(`/api/v1/user/addresses/${id}`)
    emit('notify', { type: 'success', message: 'Address removed successfully' })
    await fetchAddresses()
  } catch (err: any) {
    emit('notify', { type: 'error', message: 'Failed to remove address' })
  }
}

onMounted(() => {
  fetchAddresses()
})
</script>
