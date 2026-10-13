<template>
  <div class="h-screen w-full relative overflow-hidden bg-[#090314] flex items-center justify-center">
    <!-- Fluid 3D Glassmorphic Background Image -->
    <img
      src="/images/auth-bg.jpg"
      alt="Atmospheric glass background"
      class="absolute inset-0 w-full h-full object-cover object-center select-none pointer-events-none"
    />
    <!-- Subtle ambient overlay -->
    <div class="absolute inset-0 bg-black/25 pointer-events-none"></div>

    <!-- Page Content -->
    <div class="relative z-10 w-full h-full flex items-center justify-center">
      <slot />
    </div>
  </div>
</template>

