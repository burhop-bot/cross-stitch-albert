/**
 * Theme provider — manages light/dark mode.
 * Uses CSS custom properties and a data-theme attribute on the root.
 */
import { createContext, useContext, useState, useEffect, useCallback } from 'react'

export type ThemeMode = 'light' | 'dark' | 'system'

export interface ThemeState {
  mode: ThemeMode
  isDark: boolean
  toggleTheme: () => void
  setMode: (mode: ThemeMode) => void
}

const ThemeContext = createContext<ThemeState>({
  mode: 'system',
  isDark: false,
  toggleTheme: () => {},
  setMode: () => {},
})

export function useTheme(): ThemeState {
  return useContext(ThemeContext)
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('css-theme') as ThemeMode | null
    return saved === 'light' || saved === 'dark' ? saved : 'system'
  })

  const [isDark, setIsDark] = useState(false)

  const applyTheme = useCallback(() => {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const dark = mode === 'dark' || (mode === 'system' && prefersDark)
    setIsDark(dark)
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
    localStorage.setItem('css-theme', mode)
  }, [mode])

  // Apply on mount and when mode changes
  useEffect(() => {
    applyTheme()
  }, [applyTheme])

  // Listen for system theme changes when in system mode
  useEffect(() => {
    if (mode !== 'system') return
    const mql = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => applyTheme()
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [mode, applyTheme])

  const setMode = useCallback((newMode: ThemeMode) => {
    setModeState(newMode)
  }, [])

  const toggleTheme = useCallback(() => {
    setModeState((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }, [setMode])

  return (
    <ThemeContext.Provider value={{ mode, isDark, toggleTheme, setMode }}>
      {children}
    </ThemeContext.Provider>
  )
}
