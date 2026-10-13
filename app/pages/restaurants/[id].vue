<template>
  <div class="max-w-7xl mx-auto space-y-6">
    <!-- Breadcrumb & Back Navigation -->
    <div class="flex items-center gap-3">
      <NuxtLink to="/restaurants"
        class="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-slate-300 hover:text-white text-xs font-medium transition cursor-pointer">
        <LucideArrowLeft class="w-3.5 h-3.5" />
        <span>Back to Restaurants</span>
      </NuxtLink>
      <span class="text-slate-500 text-xs">/</span>
      <span class="text-slate-400 text-xs truncate max-w-xs">{{ restaurant?.name || 'Restaurant Details' }}</span>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="p-16 text-center text-slate-400 text-xs">
      <LucideLoader2 class="w-8 h-8 animate-spin mx-auto text-indigo-400 mb-3" />
      <span>Loading restaurant outlet details & menu...</span>
    </div>

    <!-- Error State -->
    <div v-else-if="fetchError" class="rounded-3xl glass-card p-10 text-center border border-rose-500/30 space-y-3">
      <LucideAlertTriangle class="w-10 h-10 text-rose-400 mx-auto" />
      <h3 class="text-base font-bold text-white">Outlet Not Found</h3>
      <p class="text-xs text-slate-400 max-w-md mx-auto">{{ fetchError }}</p>
      <NuxtLink to="/restaurants"
        class="inline-block mt-2 px-4 py-2 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-white text-xs font-semibold transition">
        Return to Restaurants
      </NuxtLink>
    </div>

    <!-- Main Content -->
    <div v-else-if="restaurant" class="space-y-6">
      <!-- Toast Alert -->
      <transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0 -translate-y-2"
        leave-active-class="transition duration-150 ease-in" leave-to-class="opacity-0 -translate-y-2">
        <div v-if="statusMessage" :class="[
          'p-4 rounded-2xl border text-xs font-medium flex items-center justify-between gap-3 shadow-lg backdrop-blur-md',
          statusMessage.type === 'success'
            ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-200'
            : 'bg-rose-500/15 border-rose-500/30 text-rose-200'
        ]">
          <div class="flex items-center gap-2.5">
            <LucideCheckCircle2 v-if="statusMessage.type === 'success'" class="w-4 h-4 text-emerald-400 shrink-0" />
            <LucideAlertTriangle v-else class="w-4 h-4 text-rose-400 shrink-0" />
            <span>{{ statusMessage.text }}</span>
          </div>
          <button @click="statusMessage = null" class="text-slate-400 hover:text-white p-1 rounded-lg">
            <LucideX class="w-3.5 h-3.5" />
          </button>
        </div>
      </transition>

      <!-- Outlet Hero Banner -->
      <div class="rounded-3xl glass-card p-6 sm:p-8 border border-white/10 relative overflow-hidden shadow-2xl">
        <!-- Optional Banner Background overlay -->
        <div v-if="restaurant.bannerUrl" class="absolute inset-0 bg-cover bg-center opacity-15 pointer-events-none"
          :style="{ backgroundImage: `url(${restaurant.bannerUrl})` }"></div>
        <div
          class="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-gradient-to-br from-purple-500/20 to-indigo-500/20 blur-3xl pointer-events-none">
        </div>

        <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div class="flex items-start sm:items-center gap-4">
            <!-- Restaurant Logo / Initial Avatar -->
            <div
              class="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center font-black text-white text-2xl sm:text-3xl border border-white/20 shadow-xl shrink-0 overflow-hidden">
              <img v-if="restaurant.logoUrl" :src="restaurant.logoUrl" :alt="restaurant.name"
                class="w-full h-full object-cover" />
              <span v-else>{{ restaurant.name.charAt(0).toUpperCase() }}</span>
            </div>

            <div class="space-y-1">
              <div class="flex flex-wrap items-center gap-2.5">
                <h1 class="text-xl sm:text-2xl font-black tracking-tight text-white">
                  {{ restaurant.name }}
                </h1>

                <!-- Status Badge Button -->
                <button v-if="isSuperAdmin || hasRestaurantPermission('MANAGE_OUTLET', restaurantId)"
                  @click="toggleOutletStatus" :disabled="isSubmitting" type="button"
                  :title="restaurant.isActive ? 'Click to deactivate outlet' : 'Click to activate outlet'" :class="[
                    'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition cursor-pointer active:scale-95 disabled:opacity-50',
                    restaurant.isActive
                      ? 'bg-emerald-500/15 hover:bg-emerald-500/25 border-emerald-500/30 text-emerald-300'
                      : 'bg-rose-500/15 hover:bg-rose-500/25 border-rose-500/30 text-rose-300'
                  ]">
                  <span :class="[
                    'w-2 h-2 rounded-full',
                    restaurant.isActive ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
                  ]"></span>
                  <span>{{ restaurant.isActive ? 'Active (Open)' : 'Inactive (Closed)' }}</span>
                </button>
                <div v-else :class="[
                  'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border',
                  restaurant.isActive
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                ]">
                  <span :class="[
                    'w-2 h-2 rounded-full',
                    restaurant.isActive ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
                  ]"></span>
                  <span>{{ restaurant.isActive ? 'Active (Open)' : 'Inactive (Closed)' }}</span>
                </div>
              </div>

              <p class="text-xs text-slate-300 font-mono">@{{ restaurant.slug }}</p>

              <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300 pt-1">
                <span v-if="restaurant.address" class="inline-flex items-center gap-1.5 text-slate-300">
                  <LucideMapPin class="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  {{ restaurant.address }}
                </span>
                <span v-if="restaurant.phone" class="inline-flex items-center gap-1.5 text-slate-300">
                  <LucidePhone class="w-3.5 h-3.5 text-purple-400 shrink-0" />
                  {{ restaurant.phone }}
                </span>
              </div>
            </div>
          </div>

          <!-- Quick Action Buttons -->
          <div class="flex flex-wrap items-center gap-2.5 self-start md:self-center">
            <NuxtLink v-if="isSuperAdmin || hasRestaurantPermission('MANAGE_ORDERS', restaurantId)"
              :to="`/orders?restaurantId=${restaurant.id}`"
              class="px-4 py-2 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-white text-xs font-semibold transition cursor-pointer flex items-center gap-2 shadow-lg">
              <LucideShoppingBag class="w-3.5 h-3.5 text-indigo-300" />
              <span>Live Kitchen Feed</span>
            </NuxtLink>

            <button v-if="isSuperAdmin || hasRestaurantPermission('MANAGE_OUTLET', restaurantId)" @click="openEditModal"
              type="button"
              class="px-3.5 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-white text-xs font-semibold backdrop-blur-md transition cursor-pointer flex items-center gap-1.5">
              <LucideSettings class="w-3.5 h-3.5" />
              <span>Edit Details</span>
            </button>

            <button @click="fetchRestaurantDetails" type="button"
              class="px-3 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-white text-xs font-semibold backdrop-blur-md transition cursor-pointer flex items-center gap-1.5">
              <LucideRotateCcw class="w-3.5 h-3.5" :class="{ 'animate-spin': isRefreshing }" />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        <!-- Metrics Strip -->
        <div class="mt-6 pt-5 border-t border-white/[0.08] grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span class="text-slate-400 flex items-center gap-1.5">
              <LucideUtensils class="w-3.5 h-3.5 text-indigo-400" />
              Menu Items
            </span>
            <p class="text-lg font-bold text-white mt-0.5">{{ restaurant._count?.menuItems ?? menuItems.length }}</p>
          </div>
          <div>
            <span class="text-slate-400 flex items-center gap-1.5">
              <LucideFolder class="w-3.5 h-3.5 text-purple-400" />
              Categories
            </span>
            <p class="text-lg font-bold text-purple-300 mt-0.5">{{ restaurant.categories?.length ?? 0 }}</p>
          </div>
          <div>
            <span class="text-slate-400 flex items-center gap-1.5">
              <LucideShoppingBag class="w-3.5 h-3.5 text-blue-400" />
              Total Orders
            </span>
            <p class="text-lg font-bold text-blue-300 mt-0.5">{{ restaurant._count?.orders ?? 0 }}</p>
          </div>
          <div>
            <span class="text-slate-400 flex items-center gap-1.5">
              <LucideUsers class="w-3.5 h-3.5 text-emerald-400" />
              Assigned Staff
            </span>
            <p class="text-lg font-bold text-emerald-300 mt-0.5">{{ restaurant.owners?.length ?? 0 }}</p>
          </div>
        </div>
      </div>

      <!-- Tab Navigation Navigation -->
      <div class="flex items-center gap-2 border-b border-white/[0.08] pb-3 overflow-x-auto text-xs">
        <button v-for="tab in tabs" :key="tab.id" @click="activeTab = tab.id" type="button" :class="[
          'px-4 py-2 rounded-xl font-semibold transition cursor-pointer flex items-center gap-2 whitespace-nowrap',
          activeTab === tab.id
            ? 'bg-indigo-600/30 border border-indigo-500/40 text-white shadow-md'
            : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
        ]">
          <LucideUtensils v-if="tab.id === 'menu'" class="w-3.5 h-3.5" />
          <LucideUsers v-else-if="tab.id === 'staff'" class="w-3.5 h-3.5" />
          <LucideShoppingBag v-else-if="tab.id === 'orders'" class="w-3.5 h-3.5" />
          <LucideSettings v-else-if="tab.id === 'settings'" class="w-3.5 h-3.5" />
          <span>{{ tab.label }}</span>
          <span v-if="tab.badge !== undefined"
            class="px-1.5 py-0.2 rounded-full text-[10px] bg-white/10 text-slate-300">
            {{ tab.badge }}
          </span>
        </button>
      </div>

      <!-- TAB 1: MENU ITEMS & CATEGORIES -->
      <div v-if="activeTab === 'menu'" class="space-y-6">
        <!-- Top bar: Category filter pills & Action buttons -->
        <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <!-- Search box -->
          <div class="relative flex-1 max-w-sm group">
            <div
              class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-400">
              <LucideSearch class="w-4 h-4" />
            </div>
            <input v-model="menuSearchQuery" type="text" placeholder="Search dishes by name or description..."
              class="w-full pl-10 pr-4 py-2 text-xs rounded-xl glass-input text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500/50" />
          </div>

          <!-- Actions: Manage Categories, Add Category & Add Menu Item -->
          <div class="flex items-center gap-2 self-start sm:self-auto">
            <button v-if="isSuperAdmin || hasRestaurantPermission('MANAGE_CATEGORIES', restaurantId)"
              @click="showManageCategoriesModal = true" type="button"
              class="px-3.5 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-white text-xs font-semibold transition cursor-pointer flex items-center gap-1.5">
              <LucideFolderTree class="w-3.5 h-3.5 text-purple-300" />
              <span>Manage Categories</span>
            </button>

            <button v-if="isSuperAdmin || hasRestaurantPermission('MANAGE_CATEGORIES', restaurantId)"
              @click="openAddCategoryModal()" type="button"
              class="px-3.5 py-2 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/40 text-white text-xs font-semibold transition cursor-pointer flex items-center gap-1.5">
              <LucideFolderPlus class="w-3.5 h-3.5 text-purple-300" />
              <span>Add Category</span>
            </button>

            <button v-if="isSuperAdmin || hasRestaurantPermission('MANAGE_MENU_ITEMS', restaurantId)"
              @click="openAddItemModal()" type="button"
              class="px-3.5 py-2 rounded-xl bg-indigo-600/40 hover:bg-indigo-600/60 border border-indigo-500/50 text-white text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 shadow-md">
              <LucidePlus class="w-3.5 h-3.5" />
              <span>Add Menu Item</span>
            </button>
          </div>
        </div>

        <!-- Category filter pills -->
        <div class="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <button @click="selectedCategoryFilter = 'ALL'" type="button" :class="[
            'px-3 py-1.5 rounded-xl transition cursor-pointer font-medium whitespace-nowrap',
            selectedCategoryFilter === 'ALL'
              ? 'bg-indigo-600/40 text-white border border-indigo-500/50'
              : 'bg-white/[0.03] border border-white/10 text-slate-400 hover:text-white'
          ]">
            All Items ({{ menuItems.length }})
          </button>
          <button v-for="cat in restaurant.categories || []" :key="cat.id" @click="selectedCategoryFilter = cat.id"
            type="button" :class="[
              'px-3 py-1.5 rounded-xl transition cursor-pointer font-medium whitespace-nowrap flex items-center gap-1.5',
              selectedCategoryFilter === cat.id
                ? 'bg-indigo-600/40 text-white border border-indigo-500/50'
                : 'bg-white/[0.03] border border-white/10 text-slate-400 hover:text-white'
            ]">
            <span>{{ cat.name }}</span>
            <span v-if="!cat.restaurantId"
              class="text-[9px] px-1.5 py-0.2 rounded-md bg-purple-500/20 text-purple-300 font-normal">
              Global
            </span>
            <span class="text-[10px] text-slate-400">({{ cat._count?.menuItems ?? 0 }})</span>
          </button>
        </div>

        <!-- Menu Items Grid -->
        <div v-if="filteredMenuItems.length > 0" class="space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div v-for="item in filteredMenuItems" :key="item.id"
              class="rounded-2xl glass-card p-4 border border-white/10 hover:border-white/20 transition flex flex-col justify-between group space-y-3">
              <div class="space-y-3">
                <!-- Item Image / Placeholder + Status Badge -->
                <div class="relative h-32 rounded-xl overflow-hidden bg-white/[0.04] border border-white/5">
                  <img v-if="item.imageUrl" :src="item.imageUrl" :alt="item.name"
                    class="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                  <div v-else class="w-full h-full flex flex-col items-center justify-center text-slate-500 space-y-1">
                    <LucideUtensils class="w-6 h-6" />
                    <span class="text-[10px]">No Dish Photo</span>
                  </div>

                  <!-- Stock availability pill -->
                  <div class="absolute top-2 right-2">
                    <span :class="[
                      'px-2 py-0.5 rounded-full text-[10px] font-semibold border backdrop-blur-md',
                      item.isAvailable !== false
                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                        : 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                    ]">
                      {{ item.isAvailable !== false ? 'In Stock' : 'Out of Stock' }}
                    </span>
                  </div>

                  <!-- Category pill -->
                  <div class="absolute bottom-2 left-2">
                    <span
                      class="px-2 py-0.5 rounded-md text-[10px] bg-black/60 border border-white/10 text-slate-200 backdrop-blur-md">
                      {{ item.category?.name || 'Item' }}
                    </span>
                  </div>
                </div>

                <!-- Item info -->
                <div>
                  <div class="flex items-start justify-between gap-2">
                    <h3 class="text-sm font-bold text-white group-hover:text-indigo-200 transition">
                      {{ item.name }}
                    </h3>
                    <div class="text-right">
                      <span class="text-sm font-black text-emerald-400">
                        ${{ Number(item.price).toFixed(2) }}
                      </span>
                      <p v-if="item.variants && item.variants.length > 0" class="text-[10px] text-slate-400">
                        Base
                      </p>
                    </div>
                  </div>
                  <p class="text-xs text-slate-300 line-clamp-2 mt-1 leading-relaxed">
                    {{ item.description || 'Artisanal ingredients prepared fresh to order.' }}
                  </p>

                  <!-- Variants Display -->
                  <div v-if="item.variants && item.variants.length > 0"
                    class="mt-2.5 pt-2 border-t border-white/[0.05] space-y-1">
                    <div class="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                      <LucideLayers class="w-3 h-3 text-purple-400" />
                      <span>Sizes & Variants ({{ item.variants.length }}):</span>
                    </div>
                    <div class="flex flex-wrap gap-1.5 pt-0.5">
                      <span v-for="v in item.variants" :key="v.id || v.name"
                        class="px-2 py-0.5 rounded-md bg-purple-500/15 border border-purple-500/30 text-purple-200 text-[10px] font-semibold flex items-center gap-1">
                        <span>{{ v.name }}</span>
                        <span class="text-purple-400">${{ Number(v.price).toFixed(2) }}</span>
                      </span>
                    </div>
                  </div>

                  <!-- Addons Display -->
                  <div v-if="item.addons && item.addons.length > 0"
                    class="mt-2 pt-2 border-t border-white/[0.05] space-y-1">
                    <div class="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                      <LucidePlusCircle class="w-3 h-3 text-indigo-400" />
                      <span>Extras & Addons ({{ item.addons.length }}):</span>
                    </div>
                    <div class="flex flex-wrap gap-1.5 pt-0.5">
                      <span v-for="a in item.addons" :key="a.id || a.name"
                        class="px-2 py-0.5 rounded-md bg-indigo-500/15 border border-indigo-500/30 text-indigo-200 text-[10px] font-medium flex items-center gap-1">
                        <span>+{{ a.name }}</span>
                        <span class="text-indigo-400">+${{ Number(a.price).toFixed(2) }}</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Item Card Footer / Actions -->
              <div class="pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs">
                <span class="text-[10px] text-slate-500 font-mono">ID: {{ item.id.slice(0, 8) }}...</span>
                <div v-if="isSuperAdmin || hasRestaurantPermission('MANAGE_MENU_ITEMS', restaurantId)"
                  class="flex items-center gap-1.5">
                  <button @click="openEditMenuItemModal(item)" type="button"
                    class="px-2.5 py-1 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 hover:text-white border border-white/10 transition cursor-pointer flex items-center gap-1 text-[11px]">
                    <LucideEdit class="w-3 h-3 text-indigo-400" />
                    <span>Edit</span>
                  </button>
                  <button @click="deleteMenuItem(item)" type="button"
                    class="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 transition cursor-pointer flex items-center gap-1 text-[11px]">
                    <LucideTrash2 class="w-3 h-3 text-rose-400" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Menu Pagination Component -->
          <AppPagination :page="menuPagination.page" :total-pages="menuPagination.totalPages"
            :total="menuPagination.total" :limit="menuPagination.limit" :loading="isLoading"
            @change="onMenuPageChange" />
        </div>

        <!-- Empty Menu Items -->
        <div v-else class="rounded-3xl glass-card p-12 text-center border border-white/10 space-y-3">
          <LucideUtensils class="w-10 h-10 text-slate-500 mx-auto" />
          <h3 class="text-sm font-semibold text-white">No Menu Items Found</h3>
          <p class="text-xs text-slate-400 max-w-sm mx-auto">
            {{ menuSearchQuery ? 'No dishes match your search query.' : 'Get started by creating your first category and
            adding dishes to this restaurant.' }}
          </p>
          <button @click="openAddItemModal()" type="button"
            class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600/40 hover:bg-indigo-600/60 border border-indigo-500/50 text-white text-xs font-semibold transition cursor-pointer">
            <LucidePlus class="w-3.5 h-3.5" />
            <span>Create First Menu Item</span>
          </button>
        </div>
      </div>

      <!-- TAB 2: AUTHORIZED STAFF & ACCESS CONTROL -->
      <div v-else-if="activeTab === 'staff' && isSuperAdmin" class="space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 class="text-base font-bold text-white">Authorized Outlet Staff</h2>
            <p class="text-xs text-slate-400">Users with administrative & operational authority over this outlet</p>
          </div>

          <button @click="openAssignStaffModal" type="button"
            class="px-3.5 py-2 rounded-xl bg-purple-600/40 hover:bg-purple-600/60 border border-purple-500/50 text-white text-xs font-semibold transition cursor-pointer flex items-center gap-2 self-start sm:self-auto shadow-md">
            <LucideUserPlus class="w-3.5 h-3.5" />
            <span>Assign New Staff Member</span>
          </button>
        </div>

        <!-- Staff List Grid -->
        <div v-if="restaurant.owners && restaurant.owners.length > 0" class="space-y-3">
          <div v-for="staff in restaurant.owners" :key="staff.id"
            class="p-4 rounded-2xl glass-card border border-white/10 space-y-3">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div class="flex items-center gap-3">
                <div
                  class="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600/50 to-indigo-600/50 border border-white/10 flex items-center justify-center font-bold text-white text-sm">
                  {{ staff.user?.name ? staff.user.name.charAt(0).toUpperCase() : 'U' }}
                </div>
                <div>
                  <div class="flex items-center gap-2">
                    <NuxtLink :to="`/users/${staff.user?.id}`"
                      class="text-xs font-bold text-white hover:text-purple-300 transition">
                      {{ staff.user?.name || 'Unknown User' }}
                    </NuxtLink>
                    <span v-if="staff.isPrimary"
                      class="px-1.5 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-300 text-[10px] font-semibold">
                      Primary Outlet
                    </span>
                    <span :class="[
                      'px-1.5 py-0.5 rounded-full text-[10px] font-semibold border',
                      staff.user?.isSuspended
                        ? 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                        : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                    ]">
                      {{ staff.user?.isSuspended ? 'Suspended' : 'Active' }}
                    </span>
                  </div>
                  <div class="flex items-center gap-3 text-[11px] text-slate-400">
                    <span>{{ staff.user?.email || 'No email' }}</span>
                    <span>•</span>
                    <span>Role: {{ staff.user?.role }}</span>
                  </div>
                </div>
              </div>

              <!-- Staff Actions -->
              <div class="flex items-center gap-2 self-end sm:self-auto">
                <NuxtLink :to="`/users/${staff.user?.id}`"
                  class="px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-white text-xs font-medium transition cursor-pointer flex items-center gap-1">
                  <LucideUserCheck class="w-3.5 h-3.5 text-indigo-400" />
                  <span>Manage User</span>
                </NuxtLink>
                <button @click="revokeStaffAccess(staff)" type="button"
                  class="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-300 text-xs font-medium transition cursor-pointer flex items-center gap-1">
                  <LucideTrash2 class="w-3.5 h-3.5 text-rose-400" />
                  <span>Revoke</span>
                </button>
              </div>
            </div>

            <!-- Granular Permissions Badges -->
            <div class="pt-2 border-t border-white/[0.05] flex flex-wrap items-center gap-1.5">
              <span class="text-[11px] text-slate-400 mr-1">Permissions:</span>
              <span v-for="perm in staff.permissions" :key="perm"
                class="px-2 py-0.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[10px] font-medium inline-flex items-center gap-1">
                <LucideCheck class="w-2.5 h-2.5 text-indigo-400" />
                {{ formatPermission(perm) }}
              </span>
            </div>
          </div>
        </div>

        <!-- Empty Staff -->
        <div v-else class="rounded-3xl glass-card p-12 text-center border border-white/10 space-y-3">
          <LucideUsers class="w-10 h-10 text-slate-500 mx-auto" />
          <h3 class="text-sm font-semibold text-white">No Staff Assigned</h3>
          <p class="text-xs text-slate-400 max-w-sm mx-auto">
            Only administrators currently have access to this outlet. Assign staff members to delegate kitchen and order
            management.
          </p>
          <button @click="openAssignStaffModal" type="button"
            class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600/40 hover:bg-purple-600/60 border border-purple-500/50 text-white text-xs font-semibold transition cursor-pointer">
            <LucideUserPlus class="w-3.5 h-3.5" />
            <span>Assign First Staff Member</span>
          </button>
        </div>
      </div>

      <!-- TAB 3: RECENT ORDERS OVERVIEW -->
      <div
        v-else-if="activeTab === 'orders' && (isSuperAdmin || hasRestaurantPermission('MANAGE_ORDERS', restaurantId))"
        class="space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 class="text-base font-bold text-white">Orders Board & Fulfillment</h2>
            <p class="text-xs text-slate-400">Recent customer requests for {{ restaurant.name }}</p>
          </div>

          <NuxtLink :to="`/orders?restaurantId=${restaurant.id}`"
            class="px-4 py-2 rounded-xl bg-indigo-600/40 hover:bg-indigo-600/60 border border-indigo-500/50 text-white text-xs font-semibold transition cursor-pointer flex items-center gap-2 self-start sm:self-auto shadow-md">
            <LucideExternalLink class="w-3.5 h-3.5" />
            <span>Open Dedicated Live Kitchen Board</span>
          </NuxtLink>
        </div>

        <!-- Orders Table / Preview -->
        <div v-if="ordersList.length > 0" class="rounded-3xl glass-card p-6 border border-white/10 overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead>
              <tr class="border-b border-white/[0.08] text-slate-400">
                <th class="pb-3 font-semibold">Order ID</th>
                <th class="pb-3 font-semibold">Customer</th>
                <th class="pb-3 font-semibold">Items</th>
                <th class="pb-3 font-semibold">Total</th>
                <th class="pb-3 font-semibold">Status</th>
                <th class="pb-3 font-semibold">Created</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-white/[0.05]">
              <tr v-for="order in ordersList" :key="order.id" class="hover:bg-white/[0.03] transition">
                <td class="py-3 font-mono text-[11px] text-indigo-300">
                  #{{ order.id.slice(0, 8) }}
                </td>
                <td class="py-3">
                  <span class="text-white font-medium">{{ order.user?.name || 'Customer' }}</span>
                  <p class="text-[10px] text-slate-400">{{ order.user?.phone || '' }}</p>
                </td>
                <td class="py-3 text-slate-300">
                  {{ order.items?.length || 0 }} item(s)
                </td>
                <td class="py-3 font-black text-emerald-400">
                  ${{ Number(order.totalAmount || 0).toFixed(2) }}
                </td>
                <td class="py-3">
                  <span :class="[
                    'px-2 py-0.5 rounded-full text-[10px] font-semibold border',
                    getOrderStatusClass(order.status)
                  ]">
                    {{ order.status }}
                  </span>
                </td>
                <td class="py-3 text-slate-400 text-[11px]">
                  {{ formatDate(order.createdAt) }}
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Orders Pagination Component -->
          <AppPagination :page="ordersPagination.page" :total-pages="ordersPagination.totalPages"
            :total="ordersPagination.total" :limit="ordersPagination.limit" :loading="isLoading"
            @change="onOrdersPageChange" />
        </div>

        <!-- Empty Orders -->
        <div v-else class="rounded-3xl glass-card p-12 text-center border border-white/10 space-y-3">
          <LucideShoppingBag class="w-10 h-10 text-slate-500 mx-auto" />
          <h3 class="text-sm font-semibold text-white">No Orders Received Yet</h3>
          <p class="text-xs text-slate-400 max-w-sm mx-auto">
            Once customers start ordering from {{ restaurant.name }}, incoming live kitchen tickets will appear here.
          </p>
        </div>
      </div>

      <!-- TAB 4: OUTLET SETTINGS -->
      <div
        v-else-if="activeTab === 'settings' && (isSuperAdmin || hasRestaurantPermission('MANAGE_OUTLET', restaurantId))"
        class="rounded-3xl glass-card p-6 sm:p-8 border border-white/10 space-y-6">
        <div>
          <h2 class="text-base font-bold text-white">Outlet Configuration</h2>
          <p class="text-xs text-slate-400">Update restaurant profile, branding, and contact details</p>
        </div>

        <form @submit.prevent="saveOutletSettings" class="space-y-4 max-w-2xl">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-slate-300">Restaurant Name *</label>
              <input v-model="editForm.name" type="text" required
                class="w-full px-3.5 py-2.5 text-xs rounded-xl glass-input text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/50" />
            </div>
            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-slate-300">Contact Phone</label>
              <input v-model="editForm.phone" type="text" placeholder="+1 (555) 000-0000"
                class="w-full px-3.5 py-2.5 text-xs rounded-xl glass-input text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/50" />
            </div>
          </div>

          <div class="space-y-1.5">
            <label class="text-xs font-semibold text-slate-300">Physical Address</label>
            <input v-model="editForm.address" type="text" placeholder="123 Gourmet Ave, Suite 100, Culinary City"
              class="w-full px-3.5 py-2.5 text-xs rounded-xl glass-input text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/50" />
          </div>

          <div class="space-y-1.5">
            <label class="text-xs font-semibold text-slate-300">Description</label>
            <textarea v-model="editForm.description" rows="3"
              placeholder="Tell patrons about your cuisine, kitchen specialty, and dining experience..."
              class="w-full px-3.5 py-2.5 text-xs rounded-xl glass-input text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/50"></textarea>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-slate-300">Logo Image URL</label>
              <input v-model="editForm.logoUrl" type="url" placeholder="https://..."
                class="w-full px-3.5 py-2.5 text-xs rounded-xl glass-input text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/50" />
            </div>
            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-slate-300">Banner Cover Image URL</label>
              <input v-model="editForm.bannerUrl" type="url" placeholder="https://..."
                class="w-full px-3.5 py-2.5 text-xs rounded-xl glass-input text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/50" />
            </div>
          </div>

          <div class="pt-4 border-t border-white/[0.08] flex items-center justify-end gap-3">
            <button :disabled="isSubmitting" type="submit"
              class="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold transition shadow-lg flex items-center gap-2 cursor-pointer">
              <LucideLoader2 v-if="isSubmitting" class="w-3.5 h-3.5 animate-spin" />
              <LucideSave v-else class="w-3.5 h-3.5" />
              <span>Save Outlet Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- MODAL 1: ADD / EDIT MENU ITEM -->
    <transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0"
      leave-active-class="transition duration-150 ease-in" leave-to-class="opacity-0">
      <div v-if="showAddItemModal"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
        <div
          class="w-full max-w-xl rounded-3xl glass-card border border-white/20 p-6 sm:p-7 space-y-5 shadow-2xl relative max-h-[90vh] flex flex-col">
          <div class="flex items-center justify-between shrink-0">
            <div class="flex items-center gap-2.5">
              <div
                class="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300">
                <LucideEdit v-if="isEditingItem" class="w-4 h-4" />
                <LucidePlus v-else class="w-4 h-4" />
              </div>
              <h3 class="text-base font-bold text-white">
                {{ isEditingItem ? 'Edit Menu Item' : 'Add New Menu Item' }}
              </h3>
            </div>
            <button @click="showAddItemModal = false" class="text-slate-400 hover:text-white p-1">
              <LucideX class="w-4 h-4" />
            </button>
          </div>

          <form @submit.prevent="saveMenuItem" class="flex-1 overflow-y-auto space-y-4 pr-1">
            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-slate-300">Dish Name *</label>
              <input v-model="newItemForm.name" type="text" required placeholder="e.g. Truffle Woodfired Pizza"
                class="w-full px-3.5 py-2.5 text-xs rounded-xl glass-input text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/50" />
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div class="space-y-1.5">
                <label class="text-xs font-semibold text-slate-300">Category *</label>
                <select v-model="newItemForm.categoryId" required
                  class="w-full px-3.5 py-2.5 text-xs rounded-xl glass-input text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/50 bg-[#141226] border border-white/10">
                  <option value="" disabled class="bg-slate-900 text-slate-400">Select Category</option>
                  <option v-for="cat in restaurant?.categories || []" :key="cat.id" :value="cat.id"
                    class="bg-slate-900 text-white">
                    {{ cat.name }} {{ !cat.restaurantId ? '— [Global Category]' : '— [Custom]' }}
                  </option>
                </select>
              </div>

              <div class="space-y-1.5">
                <label class="text-xs font-semibold text-slate-300">Base Price ($) *</label>
                <input v-model.number="newItemForm.price" type="number" step="0.01" min="0.01" required
                  placeholder="14.99"
                  class="w-full px-3.5 py-2.5 text-xs rounded-xl glass-input text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/50" />
              </div>
            </div>

            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-slate-300">Dish Photo URL</label>
              <div class="flex items-center gap-2">
                <div v-if="newItemForm.imageUrl"
                  class="w-9 h-9 rounded-xl overflow-hidden border border-white/10 shrink-0 bg-slate-800">
                  <img :src="newItemForm.imageUrl" alt="Preview" class="w-full h-full object-cover" />
                </div>
                <input v-model="newItemForm.imageUrl" type="url" placeholder="https://images.unsplash.com/..."
                  class="w-full px-3.5 py-2.5 text-xs rounded-xl glass-input text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/50" />
              </div>
            </div>

            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-slate-300">Description</label>
              <textarea v-model="newItemForm.description" rows="2"
                placeholder="Key ingredients, flavor profile, allergen notices..."
                class="w-full px-3.5 py-2.5 text-xs rounded-xl glass-input text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/50"></textarea>
            </div>

            <!-- VARIANTS (SIZES / PORTIONS) REPEATER -->
            <div class="p-3.5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
              <div class="flex items-center justify-between">
                <div>
                  <h4 class="text-xs font-bold text-white flex items-center gap-1.5">
                    <LucideLayers class="w-3.5 h-3.5 text-purple-400" />
                    <span>Item Variants (Sizes / Portions)</span>
                  </h4>
                  <p class="text-[11px] text-slate-400">Optional portion sizes and their prices (e.g. Small, Medium,
                    Large)</p>
                </div>
                <button @click="addVariantRow" type="button"
                  class="px-2.5 py-1 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 text-[11px] font-semibold transition cursor-pointer flex items-center gap-1">
                  <LucidePlus class="w-3 h-3" />
                  <span>Add Variant</span>
                </button>
              </div>

              <div v-if="newItemForm.variants.length === 0" class="text-center py-2 text-[11px] text-slate-500">
                No variants added. Base price applies.
              </div>

              <div v-else class="space-y-2">
                <div v-for="(variant, idx) in newItemForm.variants" :key="idx" class="flex items-center gap-2">
                  <input v-model="variant.name" type="text" required
                    placeholder="Size / Variant (e.g. Regular, Large, 12-inch)"
                    class="flex-1 px-3 py-1.5 text-xs rounded-xl glass-input text-white focus:outline-none focus:ring-1 focus:ring-purple-500/50" />
                  <div class="relative w-28">
                    <span class="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-400 text-xs">$</span>
                    <input v-model.number="variant.price" type="number" step="0.01" min="0.01" required
                      placeholder="0.00"
                      class="w-full pl-6 pr-2.5 py-1.5 text-xs rounded-xl glass-input text-white focus:outline-none focus:ring-1 focus:ring-purple-500/50" />
                  </div>
                  <button @click="removeVariantRow(idx)" type="button"
                    class="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 cursor-pointer">
                    <LucideTrash2 class="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            <!-- ADDONS & EXTRAS REPEATER -->
            <div class="p-3.5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
              <div class="flex items-center justify-between">
                <div>
                  <h4 class="text-xs font-bold text-white flex items-center gap-1.5">
                    <LucidePlusCircle class="w-3.5 h-3.5 text-indigo-400" />
                    <span>Item Addons & Extras</span>
                  </h4>
                  <p class="text-[11px] text-slate-400">Optional add-ons (e.g. Extra Cheese, Truffle Dip, Bacon)</p>
                </div>
                <button @click="addAddonRow" type="button"
                  class="px-2.5 py-1 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 text-[11px] font-semibold transition cursor-pointer flex items-center gap-1">
                  <LucidePlus class="w-3 h-3" />
                  <span>Add Addon</span>
                </button>
              </div>

              <div v-if="newItemForm.addons.length === 0" class="text-center py-2 text-[11px] text-slate-500">
                No addons added.
              </div>

              <div v-else class="space-y-2">
                <div v-for="(addon, idx) in newItemForm.addons" :key="idx" class="flex items-center gap-2">
                  <input v-model="addon.name" type="text" required placeholder="Addon (e.g. Extra Cheese, Bacon Slice)"
                    class="flex-1 px-3 py-1.5 text-xs rounded-xl glass-input text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/50" />
                  <div class="relative w-28">
                    <span class="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-400 text-xs">+$</span>
                    <input v-model.number="addon.price" type="number" step="0.01" min="0" required placeholder="0.00"
                      class="w-full pl-7 pr-2.5 py-1.5 text-xs rounded-xl glass-input text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/50" />
                  </div>
                  <button @click="removeAddonRow(idx)" type="button"
                    class="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 cursor-pointer">
                    <LucideTrash2 class="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            <label class="p-3 rounded-xl bg-white/[0.02] border border-white/10 flex items-center gap-3 cursor-pointer">
              <input type="checkbox" v-model="newItemForm.isAvailable"
                class="rounded border-white/20 bg-white/5 text-indigo-600 focus:ring-indigo-500/50" />
              <div class="text-xs">
                <span class="font-semibold text-white">Item In Stock & Available for Ordering</span>
              </div>
            </label>

            <div class="flex items-center justify-end gap-2.5 pt-3 border-t border-white/10 shrink-0">
              <button @click="showAddItemModal = false" type="button"
                class="px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 text-xs font-semibold transition cursor-pointer">
                Cancel
              </button>
              <button :disabled="isSubmitting || !newItemForm.categoryId || !newItemForm.name || !newItemForm.price"
                type="submit"
                class="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-bold transition shadow-lg flex items-center gap-2 cursor-pointer">
                <LucideLoader2 v-if="isSubmitting" class="w-3.5 h-3.5 animate-spin" />
                <span>{{ isEditingItem ? 'Save Changes' : 'Create Dish' }}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </transition>

    <!-- MODAL: MANAGE ALL CATEGORIES -->
    <transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0"
      leave-active-class="transition duration-150 ease-in" leave-to-class="opacity-0">
      <div v-if="showManageCategoriesModal"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
        <div
          class="w-full max-w-2xl rounded-3xl glass-card border border-white/20 p-6 sm:p-7 space-y-5 shadow-2xl relative max-h-[85vh] flex flex-col">
          <div class="flex items-center justify-between shrink-0">
            <div class="flex items-center gap-2.5">
              <div
                class="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300">
                <LucideFolderTree class="w-4 h-4" />
              </div>
              <div>
                <h3 class="text-base font-bold text-white">Manage Outlet Categories</h3>
                <p class="text-xs text-slate-400">Add, edit, or delete global and outlet-specific food categories</p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <button @click="openAddCategoryModal()" type="button"
                class="px-3 py-1.5 rounded-xl bg-purple-600/40 hover:bg-purple-600/60 border border-purple-500/50 text-white text-xs font-semibold transition cursor-pointer flex items-center gap-1.5">
                <LucidePlus class="w-3.5 h-3.5" />
                <span>New Category</span>
              </button>
              <button @click="showManageCategoriesModal = false" class="text-slate-400 hover:text-white p-1">
                <LucideX class="w-4 h-4" />
              </button>
            </div>
          </div>

          <!-- Categories List inside Modal -->
          <div class="flex-1 overflow-y-auto space-y-2.5 pr-1">
            <div v-for="cat in restaurant?.categories || []" :key="cat.id"
              class="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-white/20 transition flex items-center justify-between gap-3">
              <div class="flex items-center gap-3">
                <div v-if="cat.imageUrl"
                  class="w-10 h-10 rounded-xl border border-white/10 overflow-hidden shrink-0 bg-slate-800">
                  <img :src="cat.imageUrl" :alt="cat.name" class="w-full h-full object-cover" />
                </div>
                <div v-else
                  class="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300 shrink-0">
                  <LucideFolder class="w-4 h-4" />
                </div>

                <div class="space-y-1">
                  <div class="flex items-center gap-2">
                    <span class="text-xs font-bold text-white">{{ cat.name }}</span>
                    <span :class="[
                      'px-2 py-0.2 rounded-full text-[10px] font-semibold border',
                      !cat.restaurantId
                        ? 'bg-purple-500/20 border-purple-500/40 text-purple-300'
                        : 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300'
                    ]">
                      {{ !cat.restaurantId ? 'Global Platform' : 'Outlet Custom' }}
                    </span>
                  </div>
                  <p class="text-[11px] text-slate-400">{{ cat.description || 'No description provided' }}</p>
                  <p class="text-[10px] text-slate-500">
                    {{ cat._count?.menuItems || 0 }} dishes currently in this outlet
                  </p>
                </div>
              </div>

              <!-- Actions -->
              <div class="flex items-center gap-1.5 shrink-0">
                <button v-if="!cat.restaurantId && user?.role !== 'ADMIN'" type="button"
                  title="Global platform category managed by administrator"
                  class="px-2.5 py-1 rounded-lg bg-white/[0.02] border border-white/5 text-slate-500 text-xs font-medium cursor-not-allowed flex items-center gap-1">
                  <LucideLock class="w-3 h-3 text-slate-500" />
                  <span>Locked</span>
                </button>
                <template v-else>
                  <button @click="openEditCategoryModal(cat)" type="button"
                    class="px-2.5 py-1 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-slate-300 hover:text-white text-xs font-medium transition cursor-pointer flex items-center gap-1">
                    <LucideEdit class="w-3 h-3 text-indigo-400" />
                    <span>Edit</span>
                  </button>
                  <button @click="deleteCategory(cat)" type="button"
                    class="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-300 text-xs font-medium transition cursor-pointer flex items-center gap-1">
                    <LucideTrash2 class="w-3 h-3 text-rose-400" />
                    <span>Delete</span>
                  </button>
                </template>
              </div>
            </div>
          </div>

          <div class="shrink-0 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
            <span>{{ (restaurant?.categories || []).length }} total categories accessible to this outlet</span>
            <button @click="showManageCategoriesModal = false" type="button"
              class="px-4 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-white font-semibold cursor-pointer">
              Done
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- MODAL: ADD / EDIT CATEGORY -->
    <transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0"
      leave-active-class="transition duration-150 ease-in" leave-to-class="opacity-0">
      <div v-if="showAddCategoryModal"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
        <div class="w-full max-w-md rounded-3xl glass-card border border-white/20 p-6 space-y-4 shadow-2xl relative">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2.5">
              <div
                class="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300">
                <LucideFolderPlus class="w-4 h-4" />
              </div>
              <h3 class="text-base font-bold text-white">
                {{ isEditingCategory ? 'Edit Category' : 'Create Category' }}
              </h3>
            </div>
            <button @click="showAddCategoryModal = false" class="text-slate-400 hover:text-white p-1">
              <LucideX class="w-4 h-4" />
            </button>
          </div>

          <form @submit.prevent="saveCategory" class="space-y-4">
            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-slate-300">Category Name *</label>
              <input v-model="categoryForm.name" type="text" required placeholder="e.g. Starters, Main Course, Desserts"
                class="w-full px-3.5 py-2.5 text-xs rounded-xl glass-input text-white focus:outline-none focus:ring-1 focus:ring-purple-500/50" />
            </div>

            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-slate-300">Image URL</label>
              <div class="flex items-center gap-2">
                <div v-if="categoryForm.imageUrl"
                  class="w-9 h-9 rounded-xl overflow-hidden border border-white/10 shrink-0 bg-slate-800">
                  <img :src="categoryForm.imageUrl" alt="Preview" class="w-full h-full object-cover" />
                </div>
                <input v-model="categoryForm.imageUrl" type="url"
                  placeholder="https://images.unsplash.com/... (optional)"
                  class="w-full px-3.5 py-2.5 text-xs rounded-xl glass-input text-white focus:outline-none focus:ring-1 focus:ring-purple-500/50" />
              </div>
            </div>

            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-slate-300">Description</label>
              <input v-model="categoryForm.description" type="text" placeholder="Optional description..."
                class="w-full px-3.5 py-2.5 text-xs rounded-xl glass-input text-white focus:outline-none focus:ring-1 focus:ring-purple-500/50" />
            </div>

            <!-- Admin Scope Checkbox -->
            <label v-if="user?.role === 'ADMIN'"
              class="p-3 rounded-xl bg-white/[0.02] border border-white/10 flex items-center gap-3 cursor-pointer">
              <input type="checkbox" v-model="categoryForm.isGlobal"
                class="rounded border-white/20 bg-white/5 text-purple-600 focus:ring-purple-500/50" />
              <div class="text-xs">
                <span class="font-semibold text-white">Platform-Wide Global Category</span>
                <p class="text-[11px] text-slate-400">Share this category across all restaurants on the platform.</p>
              </div>
            </label>

            <div class="flex items-center justify-end gap-2.5 pt-3 border-t border-white/10">
              <button @click="showAddCategoryModal = false" type="button"
                class="px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 text-xs font-semibold transition cursor-pointer">
                Cancel
              </button>
              <button :disabled="isSubmitting || !categoryForm.name.trim()" type="submit"
                class="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white text-xs font-bold transition shadow-lg flex items-center gap-2 cursor-pointer">
                <LucideLoader2 v-if="isSubmitting" class="w-3.5 h-3.5 animate-spin" />
                <span>{{ isEditingCategory ? 'Save Changes' : 'Create Category' }}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </transition>

    <!-- MODAL 3: ASSIGN NEW STAFF MEMBER -->
    <transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0"
      leave-active-class="transition duration-150 ease-in" leave-to-class="opacity-0">
      <div v-if="showAssignStaffModal && isSuperAdmin"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
        <div
          class="w-full max-w-lg rounded-3xl glass-card border border-white/20 p-6 sm:p-7 space-y-5 shadow-2xl relative">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2.5">
              <div
                class="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300">
                <LucideUserPlus class="w-4 h-4" />
              </div>
              <h3 class="text-base font-bold text-white">Assign Staff Member</h3>
            </div>
            <button @click="showAssignStaffModal = false" class="text-slate-400 hover:text-white p-1">
              <LucideX class="w-4 h-4" />
            </button>
          </div>

          <div class="space-y-4">
            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-slate-300">Select User Account</label>
              <select v-model="staffForm.userId"
                class="w-full px-3.5 py-2.5 text-xs rounded-xl glass-input text-white focus:outline-none focus:ring-1 focus:ring-purple-500/50 bg-[#141226] border border-white/10">
                <option value="" disabled class="bg-slate-900 text-slate-400">Choose user...</option>
                <option v-for="u in candidateUsers" :key="u.id" :value="u.id" class="bg-slate-900 text-white">
                  {{ u.name }} ({{ u.email || u.phone || u.role }})
                </option>
              </select>
            </div>

            <!-- Granular Permissions Checklist -->
            <div class="space-y-2">
              <label class="text-xs font-semibold text-slate-300">Operational Permissions</label>
              <div class="space-y-2">
                <label v-for="perm in permissionOptions" :key="perm.id" :class="[
                  'p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition',
                  staffForm.permissions.includes(perm.id)
                    ? 'bg-purple-600/15 border-purple-500/40 text-white'
                    : 'bg-white/[0.02] border-white/5 hover:border-white/15 text-slate-300'
                ]">
                  <input type="checkbox" :value="perm.id" v-model="staffForm.permissions"
                    class="mt-0.5 rounded border-white/20 bg-white/5 text-purple-600 focus:ring-purple-500/50" />
                  <div class="text-xs space-y-0.5">
                    <div class="font-bold text-white">{{ perm.label }}</div>
                    <div class="text-[11px] text-slate-400">{{ perm.description }}</div>
                  </div>
                </label>
              </div>
            </div>

            <label class="p-3 rounded-xl bg-white/[0.02] border border-white/10 flex items-center gap-3 cursor-pointer">
              <input type="checkbox" v-model="staffForm.isPrimary"
                class="rounded border-white/20 bg-white/5 text-purple-600 focus:ring-purple-500/50" />
              <div class="text-xs">
                <span class="font-semibold text-white">Set as Primary Outlet</span>
              </div>
            </label>

            <div class="flex items-center justify-end gap-2.5 pt-3 border-t border-white/10">
              <button @click="showAssignStaffModal = false" type="button"
                class="px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 text-xs font-semibold transition cursor-pointer">
                Cancel
              </button>
              <button @click="saveStaffAssignment"
                :disabled="isSubmitting || !staffForm.userId || staffForm.permissions.length === 0" type="button"
                class="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white text-xs font-bold transition shadow-lg flex items-center gap-2 cursor-pointer">
                <LucideLoader2 v-if="isSubmitting" class="w-3.5 h-3.5 animate-spin" />
                <span>Grant Staff Access</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import AppPagination from '~/components/AppPagination.vue'

const route = useRoute()
const restaurantId = computed(() => String(route.params.id))

const restaurant = ref<any>(null)
const menuItems = ref<any[]>([])
const ordersList = ref<any[]>([])
const candidateUsers = ref<any[]>([])

const isLoading = ref(true)
const isRefreshing = ref(false)
const isSubmitting = ref(false)
const fetchError = ref<string | null>(null)
const statusMessage = ref<{ type: 'success' | 'error'; text: string } | null>(null)

const activeTab = ref('menu')
const menuSearchQuery = ref('')
const selectedCategoryFilter = ref('ALL')

const menuPage = ref(1)
const menuPagination = ref({ total: 0, page: 1, limit: 9, totalPages: 1 })

const ordersPage = ref(1)
const ordersPagination = ref({ total: 0, page: 1, limit: 10, totalPages: 1 })

const { user, isSuperAdmin, hasRestaurantPermission } = useAuth()

// Modals
const showManageCategoriesModal = ref(false)
const showAddItemModal = ref(false)
const showAddCategoryModal = ref(false)
const showAssignStaffModal = ref(false)

const isEditingCategory = ref(false)
const editingCategoryId = ref<string | null>(null)

const isEditingItem = ref(false)
const editingItemId = ref<string | null>(null)

interface VariantRow {
  name: string
  price: number | null
}

interface AddonRow {
  name: string
  price: number | null
}

// Forms
const newItemForm = ref({
  name: '',
  description: '',
  price: null as number | null,
  categoryId: '',
  imageUrl: '',
  isAvailable: true,
  variants: [] as VariantRow[],
  addons: [] as AddonRow[],
})

const categoryForm = ref({
  name: '',
  imageUrl: '',
  description: '',
  isGlobal: false,
})

const staffForm = ref({
  userId: '',
  permissions: ['MANAGE_OUTLET', 'MANAGE_CATEGORIES', 'MANAGE_MENU_ITEMS', 'MANAGE_ORDERS'],
  isPrimary: false,
})

const editForm = ref({
  name: '',
  description: '',
  address: '',
  phone: '',
  logoUrl: '',
  bannerUrl: '',
})

const tabs = computed(() => {
  const list = [
    { id: 'menu', label: 'Menu & Dishes', badge: menuPagination.value.total || menuItems.value.length },
  ]
  if (isSuperAdmin.value) {
    list.push({ id: 'staff', label: 'Staff & Roles', badge: restaurant.value?.owners?.length || 0 })
  }
  if (isSuperAdmin.value || hasRestaurantPermission('MANAGE_ORDERS', restaurantId.value)) {
    list.push({ id: 'orders', label: 'Live Orders', badge: ordersPagination.value.total || restaurant.value?._count?.orders || 0 })
  }
  if (isSuperAdmin.value || hasRestaurantPermission('MANAGE_OUTLET', restaurantId.value)) {
    list.push({ id: 'settings', label: 'Outlet Settings' })
  }
  return list
})

watch(tabs, (currentTabs) => {
  if (!currentTabs.some(t => t.id === activeTab.value)) {
    activeTab.value = 'menu'
  }
})

const permissionOptions = [
  {
    id: 'MANAGE_OUTLET',
    label: 'Outlet Settings',
    description: 'Operating profile, status, contact, and address.',
  },
  {
    id: 'MANAGE_CATEGORIES',
    label: 'Categories',
    description: 'Add, reorder, and remove menu categories.',
  },
  {
    id: 'MANAGE_MENU_ITEMS',
    label: 'Menu Items',
    description: 'Dishes, prices, images, and availability.',
  },
  {
    id: 'MANAGE_ORDERS',
    label: 'Live Orders',
    description: 'Kitchen ticketing and customer fulfillment.',
  },
]

function formatPermission(perm: string) {
  const match = permissionOptions.find((p) => p.id === perm)
  return match ? match.label : perm
}

function formatDate(dateString?: string) {
  if (!dateString) return '—'
  return new Date(dateString).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getOrderStatusClass(status: string) {
  switch (status) {
    case 'PENDING':
      return 'bg-amber-500/15 border-amber-500/30 text-amber-300'
    case 'ACCEPTED':
      return 'bg-blue-500/15 border-blue-500/30 text-blue-300'
    case 'PREPARING':
      return 'bg-purple-500/15 border-purple-500/30 text-purple-300'
    case 'READY_FOR_PICKUP':
      return 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300'
    case 'OUT_FOR_DELIVERY':
      return 'bg-cyan-500/15 border-cyan-500/30 text-cyan-300'
    case 'DELIVERED':
      return 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
    case 'CANCELLED':
      return 'bg-rose-500/15 border-rose-500/30 text-rose-300'
    default:
      return 'bg-slate-500/15 border-slate-500/30 text-slate-300'
  }
}

const filteredMenuItems = computed(() => menuItems.value)

async function fetchRestaurantDetails() {
  if (!restaurantId.value) return
  isRefreshing.value = true
  fetchError.value = null

  try {
    const res = await $fetch<any>(`/api/v1/owner/restaurants/${restaurantId.value}/details`)
    restaurant.value = res.restaurant

    // Populate edit form
    editForm.value = {
      name: res.restaurant.name || '',
      description: res.restaurant.description || '',
      address: res.restaurant.address || '',
      phone: res.restaurant.phone || '',
      logoUrl: res.restaurant.logoUrl || '',
      bannerUrl: res.restaurant.bannerUrl || '',
    }

    if (res.restaurant.categories && res.restaurant.categories.length > 0 && !newItemForm.value.categoryId) {
      newItemForm.value.categoryId = res.restaurant.categories[0].id
    }

    // Load menu items
    await loadMenuItems()
    // Load orders
    await loadOrders()
  } catch (err: any) {
    fetchError.value = err?.data?.statusMessage || err?.message || 'Failed to load restaurant details'
  } finally {
    isLoading.value = false
    isRefreshing.value = false
  }
}

async function loadMenuItems() {
  try {
    const res = await $fetch<any>(`/api/v1/owner/restaurants/${restaurantId.value}/menu-items`, {
      params: {
        page: menuPage.value,
        limit: 9,
        categoryId: selectedCategoryFilter.value !== 'ALL' ? selectedCategoryFilter.value : undefined,
        search: menuSearchQuery.value.trim() || undefined,
      },
    })
    menuItems.value = res.menuItems || []
    if (res.pagination) {
      menuPagination.value = res.pagination
    }
  } catch {
    menuItems.value = []
  }
}

function onMenuPageChange(newPage: number) {
  menuPage.value = newPage
  loadMenuItems()
}

watch([selectedCategoryFilter, menuSearchQuery], () => {
  menuPage.value = 1
  loadMenuItems()
})

async function loadOrders() {
  try {
    const res = await $fetch<any>(`/api/v1/owner/restaurants/${restaurantId.value}/orders`, {
      params: {
        page: ordersPage.value,
        limit: 10,
      },
    })
    ordersList.value = res.orders || []
    if (res.pagination) {
      ordersPagination.value = res.pagination
    }
  } catch {
    ordersList.value = []
  }
}

function onOrdersPageChange(newPage: number) {
  ordersPage.value = newPage
  loadOrders()
}

async function toggleOutletStatus() {
  if (!restaurant.value) return

  isSubmitting.value = true
  try {
    const res = await $fetch<any>(`/api/v1/owner/restaurants/${restaurantId.value}/status`, {
      method: 'PATCH',
    })
    if (res?.restaurant) {
      restaurant.value.isActive = res.restaurant.isActive
      statusMessage.value = {
        type: 'success',
        text: `Outlet is now ${res.restaurant.isActive ? 'Active (Open)' : 'Inactive (Closed)'}`,
      }
    }
  } catch (err: any) {
    statusMessage.value = {
      type: 'error',
      text: err?.data?.statusMessage || err?.data?.message || err?.message || 'Failed to toggle status',
    }
  } finally {
    isSubmitting.value = false
  }
}

function openEditModal() {
  activeTab.value = 'settings'
}

async function saveOutletSettings() {
  isSubmitting.value = true
  try {
    const res = await $fetch<any>(`/api/v1/owner/restaurants/${restaurantId.value}/details`, {
      method: 'PUT',
      body: editForm.value,
    })

    if (res?.restaurant) {
      restaurant.value = { ...restaurant.value, ...res.restaurant }
      statusMessage.value = {
        type: 'success',
        text: 'Outlet details updated successfully',
      }
    }
  } catch (err: any) {
    statusMessage.value = {
      type: 'error',
      text: err?.data?.statusMessage || err?.data?.message || err?.message || 'Failed to save settings',
    }
  } finally {
    isSubmitting.value = false
  }
}

function openAddCategoryModal() {
  isEditingCategory.value = false
  editingCategoryId.value = null
  categoryForm.value = {
    name: '',
    imageUrl: '',
    description: '',
    isGlobal: false,
  }
  showAddCategoryModal.value = true
}

function openEditCategoryModal(cat: any) {
  isEditingCategory.value = true
  editingCategoryId.value = cat.id
  categoryForm.value = {
    name: cat.name,
    imageUrl: cat.imageUrl || '',
    description: cat.description || '',
    isGlobal: !cat.restaurantId,
  }
  showAddCategoryModal.value = true
}

async function saveCategory() {
  if (!categoryForm.value.name.trim()) return

  isSubmitting.value = true
  try {
    const payload = {
      name: categoryForm.value.name.trim(),
      imageUrl: categoryForm.value.imageUrl?.trim() || undefined,
      description: categoryForm.value.description?.trim() || undefined,
    }

    if (isEditingCategory.value && editingCategoryId.value) {
      const res = await $fetch<any>(
        `/api/v1/owner/restaurants/${restaurantId.value}/categories/${editingCategoryId.value}`,
        {
          method: 'PUT',
          body: payload,
        }
      )
      if (res?.category) {
        showAddCategoryModal.value = false
        statusMessage.value = {
          type: 'success',
          text: `Category "${res.category.name}" updated`,
        }
        await fetchRestaurantDetails()
      }
    } else {
      const res = await $fetch<any>(
        `/api/v1/owner/restaurants/${restaurantId.value}/categories`,
        {
          method: 'POST',
          body: {
            ...payload,
            isGlobal: categoryForm.value.isGlobal,
          },
        }
      )
      if (res?.category) {
        showAddCategoryModal.value = false
        statusMessage.value = {
          type: 'success',
          text: `Category "${res.category.name}" created`,
        }
        await fetchRestaurantDetails()
      }
    }
  } catch (err: any) {
    statusMessage.value = {
      type: 'error',
      text: err?.data?.statusMessage || err?.data?.message || err?.message || 'Failed to save category',
    }
  } finally {
    isSubmitting.value = false
  }
}

async function deleteCategory(cat: any) {
  const isGlobal = !cat.restaurantId
  const confirmMsg = isGlobal
    ? `Delete platform-wide global category "${cat.name}"? This removes it for all restaurants.`
    : `Delete category "${cat.name}" from this restaurant?`

  if (!confirm(confirmMsg)) return

  isSubmitting.value = true
  try {
    const res = await $fetch<any>(
      `/api/v1/owner/restaurants/${restaurantId.value}/categories/${cat.id}`,
      { method: 'DELETE' }
    )
    if (res?.status === 'ok') {
      statusMessage.value = {
        type: 'success',
        text: `Category "${cat.name}" deleted`,
      }
      await fetchRestaurantDetails()
    }
  } catch (err: any) {
    statusMessage.value = {
      type: 'error',
      text: err?.data?.statusMessage || err?.data?.message || err?.message || 'Failed to delete category',
    }
  } finally {
    isSubmitting.value = false
  }
}

function openAddItemModal() {
  isEditingItem.value = false
  editingItemId.value = null
  newItemForm.value = {
    name: '',
    description: '',
    price: null,
    categoryId: restaurant.value?.categories?.[0]?.id || '',
    imageUrl: '',
    isAvailable: true,
    variants: [],
    addons: [],
  }
  showAddItemModal.value = true
}

function openEditMenuItemModal(item: any) {
  isEditingItem.value = true
  editingItemId.value = item.id
  newItemForm.value = {
    name: item.name,
    description: item.description || '',
    price: Number(item.price),
    categoryId: item.categoryId || (restaurant.value?.categories?.[0]?.id || ''),
    imageUrl: item.imageUrl || '',
    isAvailable: item.isAvailable !== false,
    variants: (item.variants || []).map((v: any) => ({ name: v.name, price: Number(v.price) })),
    addons: (item.addons || []).map((a: any) => ({ name: a.name, price: Number(a.price) })),
  }
  showAddItemModal.value = true
}

function addVariantRow() {
  newItemForm.value.variants.push({ name: '', price: null })
}

function removeVariantRow(index: number) {
  newItemForm.value.variants.splice(index, 1)
}

function addAddonRow() {
  newItemForm.value.addons.push({ name: '', price: null })
}

function removeAddonRow(index: number) {
  newItemForm.value.addons.splice(index, 1)
}

async function saveMenuItem() {
  if (!newItemForm.value.name || !newItemForm.value.price || !newItemForm.value.categoryId) return

  const validVariants = newItemForm.value.variants
    .filter((v) => v.name.trim() && v.price !== null && Number(v.price) > 0)
    .map((v) => ({ name: v.name.trim(), price: Number(v.price) }))

  const validAddons = newItemForm.value.addons
    .filter((a) => a.name.trim() && a.price !== null && Number(a.price) >= 0)
    .map((a) => ({ name: a.name.trim(), price: Number(a.price) }))

  isSubmitting.value = true
  try {
    const payload = {
      name: newItemForm.value.name.trim(),
      description: newItemForm.value.description?.trim() || undefined,
      price: Number(newItemForm.value.price),
      categoryId: newItemForm.value.categoryId,
      imageUrl: newItemForm.value.imageUrl?.trim() || undefined,
      isAvailable: newItemForm.value.isAvailable,
      variants: validVariants,
      addons: validAddons,
    }

    if (isEditingItem.value && editingItemId.value) {
      const res = await $fetch<any>(
        `/api/v1/owner/restaurants/${restaurantId.value}/menu-items/${editingItemId.value}`,
        {
          method: 'PUT',
          body: payload,
        }
      )
      if (res?.menuItem) {
        showAddItemModal.value = false
        statusMessage.value = {
          type: 'success',
          text: `Menu item "${res.menuItem.name}" updated successfully`,
        }
        await loadMenuItems()
      }
    } else {
      const res = await $fetch<any>(
        `/api/v1/owner/restaurants/${restaurantId.value}/menu-items`,
        {
          method: 'POST',
          body: payload,
        }
      )
      if (res?.menuItem) {
        showAddItemModal.value = false
        statusMessage.value = {
          type: 'success',
          text: `Menu item "${res.menuItem.name}" added successfully`,
        }
        await loadMenuItems()
        if (restaurant.value._count) {
          restaurant.value._count.menuItems = (restaurant.value._count.menuItems || 0) + 1
        }
      }
    }
  } catch (err: any) {
    statusMessage.value = {
      type: 'error',
      text: err?.data?.statusMessage || err?.data?.message || err?.message || 'Failed to save menu item',
    }
  } finally {
    isSubmitting.value = false
  }
}

async function deleteMenuItem(item: any) {
  if (!confirm(`Delete "${item.name}" from the menu?`)) return

  try {
    const res = await $fetch<any>(`/api/v1/owner/restaurants/${restaurantId.value}/menu-items/${item.id}`, {
      method: 'DELETE',
    })
    if (res?.status === 'ok') {
      menuItems.value = menuItems.value.filter((m) => m.id !== item.id)
      statusMessage.value = {
        type: 'success',
        text: `"${item.name}" deleted from menu`,
      }
      if (restaurant.value._count?.menuItems) {
        restaurant.value._count.menuItems--
      }
    }
  } catch (err: any) {
    statusMessage.value = {
      type: 'error',
      text: err?.data?.statusMessage || err?.data?.message || err?.message || 'Failed to delete menu item',
    }
  }
}

async function openAssignStaffModal() {
  try {
    const res = await $fetch<any>('/api/v1/admin/users')
    candidateUsers.value = res.users || []
  } catch {
    candidateUsers.value = []
  }
  staffForm.value = {
    userId: candidateUsers.value[0]?.id || '',
    permissions: ['MANAGE_OUTLET', 'MANAGE_CATEGORIES', 'MANAGE_MENU_ITEMS', 'MANAGE_ORDERS'],
    isPrimary: false,
  }
  showAssignStaffModal.value = true
}

async function saveStaffAssignment() {
  if (!staffForm.value.userId || staffForm.value.permissions.length === 0) return

  isSubmitting.value = true
  try {
    const res = await $fetch<any>(`/api/v1/admin/users/${staffForm.value.userId}/access`, {
      method: 'POST',
      body: {
        restaurantId: restaurantId.value,
        permissions: staffForm.value.permissions,
        isPrimary: staffForm.value.isPrimary,
      },
    })

    if (res?.assignment) {
      showAssignStaffModal.value = false
      statusMessage.value = {
        type: 'success',
        text: 'Staff access granted successfully',
      }
      await fetchRestaurantDetails()
    }
  } catch (err: any) {
    statusMessage.value = {
      type: 'error',
      text: err?.data?.statusMessage || err?.data?.message || err?.message || 'Failed to grant staff access',
    }
  } finally {
    isSubmitting.value = false
  }
}

async function revokeStaffAccess(staff: any) {
  if (!confirm(`Revoke outlet staff access for "${staff.user?.name}"?`)) return

  isSubmitting.value = true
  try {
    const res = await $fetch<any>(`/api/v1/admin/users/${staff.userId}/access?restaurantId=${restaurantId.value}`, {
      method: 'DELETE',
    })

    if (res?.status === 'ok') {
      statusMessage.value = {
        type: 'success',
        text: `Revoked access for ${staff.user?.name}`,
      }
      await fetchRestaurantDetails()
    }
  } catch (err: any) {
    statusMessage.value = {
      type: 'error',
      text: err?.data?.statusMessage || err?.data?.message || err?.message || 'Failed to revoke staff access',
    }
  } finally {
    isSubmitting.value = false
  }
}

onMounted(() => {
  fetchRestaurantDetails()
})
</script>
