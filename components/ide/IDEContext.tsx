"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

export type WindowState = 'closed' | 'minimized' | 'default' | 'fullscreen'
export type AnimationState = 'none' | 'closing' | 'minimizing' | 'restoring'

export interface OpenFile {
  name: string
  icon: 'markdown' | 'python' | 'javascript' | 'typescript'
}

const DEFAULT_FILES: OpenFile[] = [
  { name: 'welcome.md', icon: 'markdown' },
  { name: 'upcoming-events.py', icon: 'python' },
  { name: 'topic-requests.py', icon: 'python' },
  { name: 'schedule.py', icon: 'python' },
]

interface IDEContextType {
  activeFile: string
  setActiveFile: (file: string) => void
  openFiles: OpenFile[]
  closeFile: (fileName: string) => void
  openFile: (file: OpenFile) => void
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
  const [openFiles, setOpenFiles] = useState<OpenFile[]>(DEFAULT_FILES)
  const [windowState, setWindowState] = useState<WindowState>('default')
  const [animationState, setAnimationState] = useState<AnimationState>('none')

  const closeFile = (fileName: string) => {
    setOpenFiles(prev => {
      const newFiles = prev.filter(f => f.name !== fileName)
      // If we closed the active file, switch to an adjacent tab
      if (activeFile === fileName && newFiles.length > 0) {
        const closedIndex = prev.findIndex(f => f.name === fileName)
        const newActiveIndex = Math.min(closedIndex, newFiles.length - 1)
        setActiveFile(newFiles[newActiveIndex].name)
      }
      return newFiles
    })
  }

  const openFile = (file: OpenFile) => {
    setOpenFiles(prev => {
      if (prev.some(f => f.name === file.name)) {
        return prev // File already open
      }
      return [...prev, file]
    })
    setActiveFile(file.name)
  }

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
      openFiles,
      closeFile,
      openFile,
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
