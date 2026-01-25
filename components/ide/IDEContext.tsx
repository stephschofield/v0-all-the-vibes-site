"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

export type WindowState = 'closed' | 'minimized' | 'default' | 'fullscreen'
export type AnimationState = 'none' | 'closing' | 'minimizing' | 'restoring'

interface IDEContextType {
  activeFile: string
  setActiveFile: (file: string) => void
  windowState: WindowState
  setWindowState: (state: WindowState) => void
  animationState: AnimationState
  closeWindow: () => void
  minimizeWindow: () => void
  maximizeWindow: () => void
  restoreWindow: () => void
}

const IDEContext = createContext<IDEContextType | null>(null)

export function useIDE() {
  const context = useContext(IDEContext)
  if (!context) {
    throw new Error("useIDE must be used within an IDEProvider")
  }
  return context
}

export function IDEProvider({ children }: { children: ReactNode }) {
  const [activeFile, setActiveFile] = useState("welcome.md")
  const [windowState, setWindowState] = useState<WindowState>('default')
  const [animationState, setAnimationState] = useState<AnimationState>('none')

  const closeWindow = () => {
    setAnimationState('closing')
    setTimeout(() => {
      setWindowState('closed')
      setAnimationState('none')
    }, 400)
  }

  const minimizeWindow = () => {
    if (windowState === 'fullscreen') {
      setWindowState('default')
    } else {
      setAnimationState('minimizing')
      setTimeout(() => {
        setWindowState('minimized')
        setAnimationState('none')
      }, 400)
    }
  }

  const maximizeWindow = () => setWindowState('fullscreen')

  const restoreWindow = () => {
    setWindowState('default')
    setAnimationState('restoring')
    setTimeout(() => {
      setAnimationState('none')
    }, 400)
  }

  return (
    <IDEContext.Provider value={{ 
      activeFile, 
      setActiveFile,
      windowState,
      setWindowState,
      animationState,
      closeWindow,
      minimizeWindow,
      maximizeWindow,
      restoreWindow,
    }}>
      {children}
    </IDEContext.Provider>
  )
}
