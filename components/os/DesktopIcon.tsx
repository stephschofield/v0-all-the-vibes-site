"use client"

import { useIDE } from "@/components/ide/IDEContext"

interface DesktopIconProps {
  animateFrom?: { x: number; y: number } | null
}

export default function DesktopIcon({ animateFrom }: DesktopIconProps) {
  const { restoreWindow, windowState } = useIDE()
  
  const isVisible = windowState === 'closed' || windowState === 'minimized'
  
  if (!isVisible) return null

  return (
    <button
      onClick={restoreWindow}
      className="fixed top-6 left-6 z-50 flex flex-col items-center gap-2 p-3 rounded-xl transition-all duration-300 hover:bg-white/10 hover:scale-105 active:scale-95 group cursor-pointer"
      style={{
        animation: animateFrom ? 'iconAppear 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards' : undefined,
      }}
    >
      {/* App Icon */}
      <div 
        className="w-16 h-16 rounded-2xl flex items-center justify-center overflow-hidden transition-transform group-hover:shadow-lg"
        style={{
          background: 'linear-gradient(135deg, rgba(30, 30, 40, 0.9) 0%, rgba(20, 20, 30, 0.95) 100%)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        }}
      >
        <img 
          src="/images/atv-logo.svg" 
          alt="All The Vibes" 
          className="w-12 h-12 object-contain"
        />
      </div>
      
      {/* App Label */}
      <span 
        className="text-xs font-medium text-center px-1 py-0.5 rounded"
        style={{
          fontFamily: 'var(--font-display)',
          color: 'var(--text-primary)',
          textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)',
          maxWidth: '80px',
        }}
      >
        All The Vibes
      </span>
      
      {/* Minimized indicator dot */}
      {windowState === 'minimized' && (
        <div 
          className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full"
          style={{ background: 'var(--accent-blue)' }}
        />
      )}
    </button>
  )
}
