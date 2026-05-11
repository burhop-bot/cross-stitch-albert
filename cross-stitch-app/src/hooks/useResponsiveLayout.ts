import { useState, useEffect, useCallback } from 'react'
import { useProjectStore } from '../store/projectStore'

export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl'
export type LayoutMode = 'desktop' | 'tablet' | 'phone'
export type PanelVisibility = {
  sidebar: boolean
  rightPanel: boolean
  header: boolean
  bottomBar: boolean
}
export type TouchOrientation = 'portrait' | 'landscape'

export interface ResponsiveState {
  breakpoint: Breakpoint
  layoutMode: LayoutMode
  width: number
  height: number
  orientation: TouchOrientation
  isTouchDevice: boolean
  panelVisibility: PanelVisibility
}

const BREAKPOINTS = {
  xs: 0,      // 0-374px — phone portrait
  sm: 375,    // 375-767px — phone landscape / small phone
  md: 768,    // 768-1023px — tablet portrait
  lg: 1024,   // 1024-1279px — tablet landscape / small desktop
  xl: 1280,   // 1280px+ — desktop
}

function getBreakpoint(width: number): Breakpoint {
  if (width >= BREAKPOINTS.xl) return 'xl'
  if (width >= BREAKPOINTS.lg) return 'lg'
  if (width >= BREAKPOINTS.md) return 'md'
  if (width >= BREAKPOINTS.sm) return 'sm'
  return 'xs'
}

function getLayoutMode(breakpoint: Breakpoint): LayoutMode {
  switch (breakpoint) {
    case 'xs':
    case 'sm':
      return 'phone'
    case 'md':
      return 'tablet'
    case 'lg':
    case 'xl':
      return 'desktop'
  }
}

/**
 * Detects the current viewport breakpoint and returns responsive state.
 * Also handles panel auto-visibility (collapses panels on phone).
 */
export function useResponsiveLayout(): ResponsiveState {
  const [width, setWidth] = useState(window.innerWidth)
  const [height, setHeight] = useState(window.innerHeight)
  const [isTouchDevice, setIsTouchDevice] = useState(false)

  const activeRightPanel = useProjectStore((s) => s.activeRightPanel)
  const setActiveRightPanel = useProjectStore((s) => s.setActiveRightPanel)

  const detectTouch = useCallback(() => {
    setIsTouchDevice(
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      (navigator as any).msMaxTouchPoints > 0
    )
  }, [])

  useEffect(() => {
    detectTouch()
    const handleResize = () => {
      setWidth(window.innerWidth)
      setHeight(window.innerHeight)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [detectTouch])

  const breakpoint = getBreakpoint(width)
  const layoutMode = getLayoutMode(breakpoint)

  const isPortrait = height > width
  const orientation: TouchOrientation = isPortrait ? 'portrait' : 'landscape'

  // Auto-collapse right panel on phone layouts
  useEffect(() => {
    if (layoutMode === 'phone' && activeRightPanel) {
      // Don't auto-close — let the user see what they opened,
      // but note the bottom bar will handle panel toggling
    }
  }, [layoutMode, activeRightPanel])

  // Compute panel visibility
  const panelVisibility: PanelVisibility = {
    sidebar: layoutMode !== 'phone',
    rightPanel: layoutMode === 'desktop' ? Boolean(activeRightPanel) : false,
    header: true,
    bottomBar: layoutMode !== 'desktop',
  }

  return {
    breakpoint,
    layoutMode,
    width,
    height,
    orientation,
    isTouchDevice,
    panelVisibility,
  }
}

/**
 * Hook to toggle right panel visibility (used by bottom bar and responsive toolbar).
 */
export function useResponsiveRightPanel() {
  const rightPanel = useProjectStore((s) => s.activeRightPanel)
  
  const setActiveRightPanel = useProjectStore((s) => s.setActiveRightPanel)

  const toggleRightPanel = useCallback(() => {
    if (rightPanel) {
      
      setActiveRightPanel(null)
    } else {
      
      setActiveRightPanel(rightPanel || 'settings')
    }
  }, [rightPanel, setActiveRightPanel])

  return { rightPanel: Boolean(rightPanel), toggleRightPanel }
}
