import { useState, useEffect, useCallback } from 'react'
import { Header } from './components/Header'
import { ResponsiveLayout } from './components/ResponsiveLayout'
import { KeyboardShortcutsPanel } from './components/KeyboardShortcutsPanel'
import { KeyboardShortcutEditor } from './components/KeyboardShortcutEditor'
import { OnboardingTour } from './components/OnboardingTour'
import { useResponsiveLayout } from './hooks/useResponsiveLayout'
import { useGlobalShortcuts } from './utils/keyboardShortcuts'
import { useProjectStore } from './store/projectStore'

function App() {
  // Expose store on window for testing
  const store = useProjectStore.getState()
  if (typeof window !== 'undefined') {
    ;(window as any).__store = {
      getState: useProjectStore.getState,
      setState: useProjectStore.setState,
    }
  }
  const { panelVisibility } = useResponsiveLayout()
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [showShortcutsEditor, setShowShortcutsEditor] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)

  // Global keyboard shortcuts (tools, zoom, undo/redo)
  useGlobalShortcuts()

  // "?" opens the shortcuts panel
  useEffect(() => {
    function handleHelp(e: KeyboardEvent) {
      if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault()
        setShowShortcuts(true)
      }
    }
    window.addEventListener('keydown', handleHelp, { capture: true })
    return () => window.removeEventListener('keydown', handleHelp, { capture: true })
  }, [])

  // Custom events from Header buttons
  useEffect(() => {
    function handleOnboarding() { setShowOnboarding(true) }
    window.addEventListener('cross-stitch-onboarding', handleOnboarding)
    return () => window.removeEventListener('cross-stitch-onboarding', handleOnboarding)
  }, [])

  // Custom event: reload shortcuts from editor
  useEffect(() => {
    function handleShortcutsReload() {
      window.location.reload()
    }
    window.addEventListener('css-shortcuts-reload', handleShortcutsReload)
    return () => window.removeEventListener('css-shortcuts-reload', handleShortcutsReload)
  }, [])

  return (
    <div className="h-screen flex flex-col bg-gray-100 overflow-hidden">
      {panelVisibility.header && <Header />}
      <ResponsiveLayout />
      {showShortcuts && (
        <KeyboardShortcutsPanel
          onClose={() => setShowShortcuts(false)}
          onEdit={() => { setShowShortcuts(false); setShowShortcutsEditor(true) }}
        />
      )}
      {showShortcutsEditor && (
        <KeyboardShortcutEditor onClose={() => setShowShortcutsEditor(false)} />
      )}
      {showOnboarding && (
        <OnboardingTour onClose={() => setShowOnboarding(false)} />
      )}
    </div>
  )
}

export default App
