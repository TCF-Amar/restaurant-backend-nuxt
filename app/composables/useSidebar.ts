export const useSidebar = () => {
  // Collapsed state (when collapsed, only icons are shown)
  const isCollapsed = useState<boolean>('sidebar_is_collapsed', () => false)

  // Resizable width in pixels (only applies when open/expanded)
  const sidebarWidth = useState<number>('sidebar_width', () => 280)

  // Dragging active state (to avoid text selection and provide visual cue)
  const isDragging = useState<boolean>('sidebar_is_dragging', () => false)

  // Mobile drawer open state
  const isMobileOpen = useState<boolean>('sidebar_mobile_open', () => false)

  const minWidth = 220
  const maxWidth = 480
  const defaultWidth = 280
  const collapsedWidth = 76 // Width in px when collapsed (icon only)

  // Initialize from localStorage on client side
  onMounted(() => {
    if (import.meta.client) {
      try {
        const savedCollapsed = localStorage.getItem('sidebar_is_collapsed')
        if (savedCollapsed !== null) {
          isCollapsed.value = savedCollapsed === 'true'
        }

        const savedWidth = localStorage.getItem('sidebar_width')
        if (savedWidth) {
          const parsed = parseInt(savedWidth, 10)
          if (!isNaN(parsed) && parsed >= minWidth && parsed <= maxWidth) {
            sidebarWidth.value = parsed
          }
        }
      } catch (e) {
        console.warn('Could not read sidebar preferences from localStorage:', e)
      }
    }
  })

  function toggleCollapse() {
    isCollapsed.value = !isCollapsed.value
    if (import.meta.client) {
      try {
        localStorage.setItem('sidebar_is_collapsed', String(isCollapsed.value))
      } catch (e) {
        // ignore
      }
    }
  }

  function setCollapsed(value: boolean) {
    isCollapsed.value = value
    if (import.meta.client) {
      try {
        localStorage.setItem('sidebar_is_collapsed', String(value))
      } catch (e) {
        // ignore
      }
    }
  }

  function toggleMobile() {
    isMobileOpen.value = !isMobileOpen.value
  }

  function closeMobile() {
    isMobileOpen.value = false
  }

  function resetWidth() {
    sidebarWidth.value = defaultWidth
    if (import.meta.client) {
      try {
        localStorage.setItem('sidebar_width', String(defaultWidth))
      } catch (e) {
        // ignore
      }
    }
  }

  function startDrag(event: MouseEvent) {
    // Only allow resizing when expanded
    if (isCollapsed.value) return

    event.preventDefault()
    isDragging.value = true

    const startX = event.clientX
    const startWidth = sidebarWidth.value

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX
      let newWidth = startWidth + deltaX

      if (newWidth < minWidth) newWidth = minWidth
      if (newWidth > maxWidth) newWidth = maxWidth

      sidebarWidth.value = newWidth
    }

    const onMouseUp = () => {
      isDragging.value = false
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''

      if (import.meta.client) {
        try {
          localStorage.setItem('sidebar_width', String(sidebarWidth.value))
        } catch (e) {
          // ignore
        }
      }
    }

    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }

  return {
    isCollapsed,
    sidebarWidth,
    isDragging,
    isMobileOpen,
    minWidth,
    maxWidth,
    defaultWidth,
    collapsedWidth,
    toggleCollapse,
    setCollapsed,
    toggleMobile,
    closeMobile,
    resetWidth,
    startDrag,
  }
}
