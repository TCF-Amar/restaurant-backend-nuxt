<template>
  <div
    class="min-h-screen w-full bg-[#080212] text-slate-100 flex flex-col relative overflow-x-hidden selection:bg-purple-500/30 selection:text-white">
    <!-- Atmospheric Ambient Background -->
    <div class="fixed inset-0 pointer-events-none z-0">
      <img src="/images/auth-bg.jpg" alt="Atmospheric glass background"
        class="w-full h-full object-cover object-center opacity-30 select-none" />
      <!-- Dynamic Light Gradients -->
      <div class="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-purple-600/25 blur-[120px]"></div>
      <div class="absolute top-1/3 -right-40 w-96 h-96 rounded-full bg-indigo-600/20 blur-[130px]"></div>
      <div class="absolute -bottom-40 left-1/3 w-96 h-96 rounded-full bg-pink-600/15 blur-[140px]"></div>
      <div class="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80"></div>
    </div>

    <!-- Top Navigation Bar -->
    <header class="relative z-20 w-full border-b border-white/[0.08] backdrop-blur-xl bg-black/30">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <!-- Brand Logo -->
        <div class="flex items-center gap-3">
          <div
            class="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-500 p-[1px] shadow-lg shadow-purple-500/20">
            <div class="w-full h-full bg-[#0c051a] rounded-[15px] flex items-center justify-center">
              <LucideUtensils class="w-5 h-5 text-purple-300" />
            </div>
          </div>
          <div>
            <div class="flex items-center gap-2">
              <span class="text-base font-black tracking-tight text-white">FoodHub</span>
              <span
                class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 border border-purple-500/30 text-purple-300 tracking-wide uppercase">
                Mobile
              </span>
            </div>
            <p class="text-[11px] text-slate-400">Patron & Dining Experience</p>
          </div>
        </div>

        <!-- User Controls / Auth Bar -->
        <div class="flex items-center gap-3">
          <!-- Back to Console for Admin/Owner -->
          <NuxtLink v-if="user && user.role !== 'CUSTOMER'" to="/"
            class="px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-white text-xs font-semibold backdrop-blur-md transition cursor-pointer flex items-center gap-2">
            <LucideArrowLeft class="w-3.5 h-3.5" />
            <span>Management Console</span>
          </NuxtLink>

          <!-- Current Account Pill (if logged in) -->
          <div v-if="user"
            class="hidden sm:flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 backdrop-blur-md">
            <div
              class="w-7 h-7 rounded-lg bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-xs font-bold text-white shadow-sm">
              {{ (user.name || user.email || 'U').charAt(0).toUpperCase() }}
            </div>
            <div class="text-left text-xs">
              <div class="font-medium text-white max-w-[120px] truncate">{{ user.name || 'Account' }}</div>
              <div class="text-[10px] text-purple-300 font-medium capitalize">{{ user.role.toLowerCase() }}</div>
            </div>
          </div>

          <!-- Sign Out Button -->
          <button v-if="user" type="button" @click="logout"
            class="px-3.5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 hover:text-white text-xs font-semibold transition cursor-pointer flex items-center gap-1.5"
            title="Log out of account">
            <LucideLogOut class="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>

          <!-- Login Link if not logged in -->
          <NuxtLink v-else to="/login"
            class="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition cursor-pointer flex items-center gap-1.5">
            <LucideLogIn class="w-3.5 h-3.5" />
            <span>Portal Login</span>
          </NuxtLink>
        </div>
      </div>
    </header>

    <!-- Main Content Area -->
    <main class="relative z-10 flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-5xl mx-auto w-full space-y-12">

        <!-- Notice Alert for Customers -->
        <div v-if="user?.role === 'CUSTOMER'"
          class="p-4 sm:p-5 rounded-3xl bg-indigo-950/40 border border-indigo-500/30 backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xl relative overflow-hidden group">
          <div class="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none">
          </div>
          <div class="flex items-start sm:items-center gap-3.5">
            <div
              class="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center shrink-0 text-indigo-300">
              <LucideSmartphone class="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 class="text-sm font-bold text-white flex items-center gap-2">
                <span>Customer Ordering Notice</span>
                <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/30 text-indigo-200">
                  Mobile Only
                </span>
              </h2>
              <p class="text-xs text-slate-300 mt-0.5">
                Logged in as <span class="font-semibold text-white">{{ user.email }}</span>. Web browser access is
                restricted to administrative and restaurant staff. All diner ordering is available on mobile.
              </p>
            </div>
          </div>
          <button @click="logout" type="button"
            class="px-3.5 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-white text-xs font-medium self-start sm:self-auto shrink-0 transition">
            Switch Account
          </button>
        </div>

        <!-- Hero Section -->
        <div class="text-center space-y-4 max-w-3xl mx-auto">
          <div
            class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-purple-500/15 via-indigo-500/15 to-pink-500/15 border border-purple-500/30 text-purple-200 text-xs font-semibold backdrop-blur-md shadow-lg shadow-purple-500/10">
            <LucideSparkles class="w-3.5 h-3.5 text-pink-400" />
            <span>The Premier Dining & Delivery Experience</span>
          </div>

          <h1 class="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
            Order On The Go with <br class="hidden sm:inline" />
            <span class="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-300">
              FoodHub Mobile
            </span>
          </h1>

          <p class="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl mx-auto">
            Explore curated restaurant menus, tailor gourmet orders with custom toppings, and follow your courier with
            live GPS tracking right to your doorstep.
          </p>
        </div>

        <!-- Download Buttons & QR Code Showcase Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <!-- Left: Store Download Action Cards (7 cols) -->
          <div class="lg:col-span-7 flex flex-col justify-between space-y-5">
            <!-- Apple Store Button Card -->
            <a href="https://www.apple.com/app-store/" target="_blank" rel="noopener noreferrer"
              class="group relative block p-6 sm:p-7 rounded-3xl glass-card border border-white/15 hover:border-purple-400/50 bg-white/[0.04] hover:bg-white/[0.07] transition-all duration-300 cursor-pointer shadow-2xl hover:shadow-[0_0_35px_rgba(168,85,247,0.3)] hover:-translate-y-0.5">
              <div
                class="absolute inset-0 rounded-3xl bg-gradient-to-r from-purple-600/10 via-transparent to-pink-600/10 opacity-0 group-hover:opacity-100 transition duration-300 pointer-events-none">
              </div>
              <div class="relative z-10 flex items-center justify-between gap-4">
                <div class="flex items-center gap-4 sm:gap-5">
                  <!-- Apple Logo Icon -->
                  <div
                    class="w-14 h-14 rounded-2xl bg-gradient-to-tr from-white/10 to-white/5 border border-white/20 flex items-center justify-center shrink-0 text-white group-hover:scale-105 transition shadow-lg">
                    <svg class="w-8 h-8 fill-current" viewBox="0 0 170 170">
                      <path
                        d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.08-7.83-8.12-12.44-15.12-6.53-9.87-11.75-21.32-15.66-34.34-3.91-13.02-5.87-25.29-5.87-36.81 0-14.42 3.69-26.69 11.07-36.81 7.38-10.12 16.85-15.29 28.41-15.52 4.12 0 8.94 1.16 14.45 3.48 5.51 2.32 9.17 3.53 10.99 3.63 2.13-.1 5.92-1.34 11.37-3.71 5.45-2.37 10.15-3.48 14.1-3.32 11.45.69 20.67 4.78 27.66 12.28 6.99 7.5 11.27 16.75 12.83 27.76-10.12 6.08-15.12 14.54-15 25.38.12 9.07 3.67 16.89 10.66 23.46 6.99 6.57 15.22 10.37 24.69 11.41-2.12 6.64-4.89 13.67-8.31 21.09zM119.22 33.15c0-7.38 2.67-14.28 8.01-20.7 5.34-6.42 12.03-10.74 20.08-12.95.83 7.83-1.63 15.11-7.38 21.84-5.75 6.73-12.65 10.99-20.71 12.78v-.97z" />
                    </svg>
                  </div>
                  <div>
                    <span class="text-xs uppercase font-semibold tracking-wider text-slate-400 block">Download on
                      the</span>
                    <span class="text-xl sm:text-2xl font-black text-white tracking-tight">Apple App Store</span>
                    <div class="flex items-center gap-2 mt-1 text-[11px] text-slate-300">
                      <span class="text-amber-400 font-bold flex items-center gap-1">
                        ★ 4.9
                      </span>
                      <span>•</span>
                      <span>Requires iOS 15.0 or later</span>
                      <span>•</span>
                      <span class="text-emerald-400 font-medium">Free</span>
                    </div>
                  </div>
                </div>

                <div
                  class="w-10 h-10 rounded-xl bg-white/[0.05] group-hover:bg-purple-600/30 border border-white/10 group-hover:border-purple-400/40 flex items-center justify-center shrink-0 transition text-slate-300 group-hover:text-white">
                  <LucideArrowRight class="w-4 h-4 group-hover:translate-x-0.5 transition" />
                </div>
              </div>
            </a>

            <!-- Google Play Store Button Card -->
            <a href="https://play.google.com/store/apps" target="_blank" rel="noopener noreferrer"
              class="group relative block p-6 sm:p-7 rounded-3xl glass-card border border-white/15 hover:border-indigo-400/50 bg-white/[0.04] hover:bg-white/[0.07] transition-all duration-300 cursor-pointer shadow-2xl hover:shadow-[0_0_35px_rgba(99,102,241,0.3)] hover:-translate-y-0.5">
              <div
                class="absolute inset-0 rounded-3xl bg-gradient-to-r from-indigo-600/10 via-transparent to-emerald-600/10 opacity-0 group-hover:opacity-100 transition duration-300 pointer-events-none">
              </div>
              <div class="relative z-10 flex items-center justify-between gap-4">
                <div class="flex items-center gap-4 sm:gap-5">
                  <!-- Google Play Logo Icon -->
                  <div
                    class="w-14 h-14 rounded-2xl bg-gradient-to-tr from-white/10 to-white/5 border border-white/20 flex items-center justify-center shrink-0 text-white group-hover:scale-105 transition shadow-lg">
                    <svg class="w-8 h-8" viewBox="0 0 512 512">
                      <path fill="#4285F4"
                        d="M48.7 15.1L279.6 246 39.5 486.1c-8-7.5-12.7-18.4-12.7-30.1V56c0-15.6 8.3-29.3 21.9-40.9z" />
                      <path fill="#EA4335"
                        d="M371.7 153.9L279.6 246 48.7 15.1c11.3-9.6 26.5-15.1 43.1-15.1 11.2 0 22.3 3.3 32.1 9.5l247.8 144.4z" />
                      <path fill="#FBBC04"
                        d="M495.6 226.4l-123.9-72.5L279.6 246l92.1 92.1 123.9-72.5c10.3-6 16.4-16.9 16.4-29.6s-6.1-23.6-16.4-29.6z" />
                      <path fill="#34A853"
                        d="M279.6 246L371.7 338.1 123.9 482.5c-9.8 6.2-20.9 9.5-32.1 9.5-16.6 0-31.8-5.5-43.1-15.1L279.6 246z" />
                    </svg>
                  </div>
                  <div>
                    <span class="text-xs uppercase font-semibold tracking-wider text-slate-400 block">Get it on</span>
                    <span class="text-xl sm:text-2xl font-black text-white tracking-tight">Google Play Store</span>
                    <div class="flex items-center gap-2 mt-1 text-[11px] text-slate-300">
                      <span class="text-amber-400 font-bold flex items-center gap-1">
                        ★ 4.8
                      </span>
                      <span>•</span>
                      <span>Compatible with Android 8.0+</span>
                      <span>•</span>
                      <span class="text-emerald-400 font-medium">Free</span>
                    </div>
                  </div>
                </div>

                <div
                  class="w-10 h-10 rounded-xl bg-white/[0.05] group-hover:bg-indigo-600/30 border border-white/10 group-hover:border-indigo-400/40 flex items-center justify-center shrink-0 transition text-slate-300 group-hover:text-white">
                  <LucideArrowRight class="w-4 h-4 group-hover:translate-x-0.5 transition" />
                </div>
              </div>
            </a>
          </div>

          <!-- Right: Interactive QR Code Instant Scan Card (5 cols) -->
          <div
            class="lg:col-span-5 rounded-3xl glass-card border border-white/15 p-7 flex flex-col items-center justify-between text-center relative overflow-hidden shadow-2xl bg-gradient-to-b from-white/[0.06] to-white/[0.02]">
            <div class="space-y-1">
              <span class="text-xs font-bold text-purple-300 uppercase tracking-wider">Instant Mobile Install</span>
              <h3 class="text-lg font-extrabold text-white">Scan with Smartphone</h3>
            </div>

            <!-- Stylized QR Code Graphic -->
            <div
              class="my-5 relative p-4 rounded-2xl bg-white text-slate-900 shadow-2xl group flex flex-col items-center justify-center">
              <!-- Corner Scanner brackets -->
              <div class="absolute -top-2 -left-2 w-5 h-5 border-t-2 border-l-2 border-purple-400 rounded-tl"></div>
              <div class="absolute -top-2 -right-2 w-5 h-5 border-t-2 border-r-2 border-purple-400 rounded-tr"></div>
              <div class="absolute -bottom-2 -left-2 w-5 h-5 border-b-2 border-l-2 border-purple-400 rounded-bl"></div>
              <div class="absolute -bottom-2 -right-2 w-5 h-5 border-b-2 border-r-2 border-purple-400 rounded-br"></div>

              <!-- Animated Scan Bar -->
              <div
                class="absolute inset-x-2 h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent blur-[1px] animate-[pulse_2s_ease-in-out_infinite] pointer-events-none">
              </div>

              <LucideQrCode class="w-36 h-36 text-slate-950" />
              <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div
                  class="w-10 h-10 rounded-xl bg-purple-600 border-2 border-white flex items-center justify-center shadow-lg">
                  <LucideUtensils class="w-5 h-5 text-white" />
                </div>
              </div>
            </div>

            <div class="space-y-1">
              <p class="text-xs text-slate-300">
                Point your camera to detect automatically for <strong class="text-white">iOS & Android</strong>
              </p>
              <p class="text-[10px] text-slate-400 font-mono">
                foodhub.app/download/v1
              </p>
            </div>
          </div>
        </div>

        <!-- Features Matrix Section -->
        <div class="pt-6 border-t border-white/[0.08]">
          <div class="text-center mb-8">
            <h3 class="text-sm font-bold uppercase tracking-wider text-purple-300">Why Use The Mobile App?</h3>
            <p class="text-xl font-extrabold text-white mt-1">Engineered for Food Lovers</p>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div class="p-5 rounded-2xl glass-card border border-white/10 space-y-2.5">
              <div
                class="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300">
                <LucideMapPin class="w-4 h-4" />
              </div>
              <h4 class="text-xs font-bold text-white">Live Courier Tracking</h4>
              <p class="text-xs text-slate-400 leading-relaxed">
                Watch your delivery driver move toward your house on an interactive, high-precision GPS map.
              </p>
            </div>

            <div class="p-5 rounded-2xl glass-card border border-white/10 space-y-2.5">
              <div
                class="w-9 h-9 rounded-xl bg-pink-500/20 border border-pink-500/30 flex items-center justify-center text-pink-300">
                <LucideClock class="w-4 h-4" />
              </div>
              <h4 class="text-xs font-bold text-white">Real-Time Kitchen Feed</h4>
              <p class="text-xs text-slate-400 leading-relaxed">
                Receive instant notifications when your order is accepted, frying, boxed, or out for delivery.
              </p>
            </div>

            <div class="p-5 rounded-2xl glass-card border border-white/10 space-y-2.5">
              <div
                class="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300">
                <LucideCreditCard class="w-4 h-4" />
              </div>
              <h4 class="text-xs font-bold text-white">1-Tap Secure Checkout</h4>
              <p class="text-xs text-slate-400 leading-relaxed">
                Pay securely using Apple Pay, Google Pay, or saved cards with biometric verification.
              </p>
            </div>

            <div class="p-5 rounded-2xl glass-card border border-white/10 space-y-2.5">
              <div
                class="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-300">
                <LucideShieldCheck class="w-4 h-4" />
              </div>
              <h4 class="text-xs font-bold text-white">Exclusive Mobile Deals</h4>
              <p class="text-xs text-slate-400 leading-relaxed">
                Unlock app-exclusive restaurant coupons, free delivery credits, and loyalty rewards.
              </p>
            </div>
          </div>
        </div>

        <!-- Bottom Assistance Callout -->
        <div class="rounded-2xl p-4 bg-white/[0.02] border border-white/5 text-center text-xs text-slate-400">
          <span>Are you a restaurant partner or operations manager? </span>
          <button @click="logout" type="button"
            class="text-purple-300 hover:text-purple-200 underline font-semibold ml-1 cursor-pointer">
            Sign out of this customer account
          </button>
          <span> to sign in with your staff credentials.</span>
        </div>
      </div>
    </main>

    <!-- Footer -->
    <footer class="relative z-10 py-6 border-t border-white/[0.06] text-center text-xs text-slate-500">
      <div class="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <span>&copy; {{ new Date().getFullYear() }} FoodHub Technologies Inc. All rights reserved.</span>
        <div class="flex items-center gap-4 text-slate-400">
          <a href="#" class="hover:text-white transition">Privacy Policy</a>
          <span>•</span>
          <a href="#" class="hover:text-white transition">Terms of Service</a>
          <span>•</span>
          <a href="#" class="hover:text-white transition">Customer Support</a>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: false,
})

const { user, logout } = useAuth()
</script>
