"use client"

import { useState, useCallback } from "react"
import { useIDE } from "./IDEContext"
import TitleBar from "./TitleBar"
import Sidebar from "./Sidebar"
import TabBar from "./TabBar"
import EditorPane from "./EditorPane"
import StatusBar from "./StatusBar"
import TerminalStrip from "./TerminalStrip"
import ChatPanel from "./ChatPanel"
import ResizeHandle from "./ResizeHandle"

export default function IDEWindow() {
  const { windowState, animationState } = useIDE()
  const [sidebarWidth, setSidebarWidth] = useState(220)
  const [chatWidth, setChatWidth] = useState(320)

  const handleSidebarResize = useCallback((delta: number) => {
    setSidebarWidth(prev => Math.max(150, Math.min(400, prev + delta)))
  }, [])

  const handleChatResize = useCallback((delta: number) => {
    setChatWidth(prev => Math.max(250, Math.min(500, prev + delta)))
  }, [])

  // Don't render if window is closed or minimized (and not animating)
  if ((windowState === 'closed' || windowState === 'minimized') && animationState === 'none') {
    return null
  }

  const isFullscreen = windowState === 'fullscreen'

  // Determine animation class
  const getAnimationClass = () => {
    if (animationState === 'closing') return 'window-closing'
    if (animationState === 'minimizing') return 'window-minimizing'
    if (animationState === 'restoring') return 'window-restoring'
    return ''
  }

  return (
    <div 
      className={`flex flex-col overflow-hidden relative transition-all duration-300 ease-out ${
        isFullscreen ? 'fixed inset-0 z-40' : ''
      } ${getAnimationClass()}`}
      style={{
        width: isFullscreen ? '100vw' : 'var(--ide-width)',
        height: isFullscreen ? '100vh' : 'var(--ide-height)',
        maxWidth: isFullscreen ? '100vw' : '1600px',
        maxHeight: isFullscreen ? '100vh' : '1000px',
        background: 'var(--ide-bg)',
        borderRadius: isFullscreen ? '0' : 'var(--ide-border-radius)',
        border: isFullscreen ? 'none' : '1px solid var(--glass-border)',
        boxShadow: isFullscreen 
          ? 'none'
          : `
            0 25px 50px -12px rgba(0, 0, 0, 0.4),
            0 12px 24px -8px rgba(0, 0, 0, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.05)
          `,
        backdropFilter: isFullscreen ? 'none' : 'blur(20px) saturate(180%)',
        animation: animationState === 'none' && !isFullscreen ? 'fadeInScale 0.6s ease-out forwards' : undefined,
      }}
    >
      {/* Subtle glow effect - hidden in fullscreen */}
      {!isFullscreen && (
        <div 
          className="absolute pointer-events-none z-0"
          style={{
            inset: '-1px',
            borderRadius: 'calc(var(--ide-border-radius) + 1px)',
            background: `linear-gradient(
              135deg,
              rgba(255, 255, 255, 0.1) 0%,
              transparent 50%,
              rgba(255, 255, 255, 0.05) 100%
            )`,
          }}
        />
      )}
      
      <TitleBar />
      <div className="flex flex-1 overflow-hidden relative z-10">
        {/* Sidebar with dynamic width */}
        <div 
          className="hidden md:flex flex-shrink-0"
          style={{ width: `${sidebarWidth}px` }}
        >
          <Sidebar dynamicWidth={sidebarWidth} />
        </div>
        
        {/* Resize handle for sidebar */}
        <ResizeHandle onResize={handleSidebarResize} direction="right" />
        
        {/* Editor pane */}
        <div className="flex flex-col flex-1 overflow-hidden min-w-0">
          <TabBar />
          <EditorPane />
        </div>
        
        {/* Resize handle for chat */}
        <ResizeHandle onResize={handleChatResize} direction="left" />
        
        {/* Chat panel with dynamic width */}
        <div 
          className="hidden lg:flex flex-shrink-0"
          style={{ width: `${chatWidth}px` }}
        >
          <ChatPanel dynamicWidth={chatWidth} />
        </div>
      </div>
      <StatusBar />
      <TerminalStrip />
    </div>
  )
}
