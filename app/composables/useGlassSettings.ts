export const useGlassSettings = () => {
  const blurRadius = useState<number>('glass_blur_radius', () => 2)

  const applyBlur = (val: number) => {
    if (import.meta.client) {
      document.documentElement.style.setProperty('--glass-blur', `${val}px`)
      document.documentElement.style.setProperty('--glass-card-blur', `${Math.max(val * 1.5, val)}px`)
    }
  }

  const setBlur = (val: number) => {
    const clamped = Math.max(0, Math.min(40, Number(val) || 0))
    blurRadius.value = clamped
    applyBlur(clamped)
    if (import.meta.client) {
      try {
        localStorage.setItem('glass_blur_radius', String(clamped))
      } catch (e) {
        // ignore
      }
    }
  }

  // Load from localStorage on client
  onMounted(() => {
    if (import.meta.client) {
      try {
        const saved = localStorage.getItem('glass_blur_radius')
        if (saved !== null) {
          const parsed = parseFloat(saved)
          if (!isNaN(parsed) && parsed >= 0 && parsed <= 40) {
            blurRadius.value = parsed
          }
        }
      } catch (e) {
        // ignore
      }
      applyBlur(blurRadius.value)
    }
  })

  // Watch for dynamic updates
  watch(blurRadius, (newVal) => {
    applyBlur(newVal)
  })

  return {
    blurRadius,
    setBlur,
  }
}
