"use client"

import Image from "next/image"
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
      className="fixed top-6 left-6 z-50 flex flex-col items-center gap-2.5 p-3.5 rounded-xl transition-all duration-300 hover:bg-white/10 hover:scale-105 active:scale-95 group cursor-pointer leading-7"
      style={{
        animation: animateFrom ? 'iconAppear 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards' : undefined,
      }}
    >
      {/* App Icon */}
      <div 
        className="w-[74px] h-[74px] rounded-2xl flex items-center justify-center overflow-hidden transition-transform group-hover:shadow-lg"
        style={{
          background: 'linear-gradient(135deg, rgba(30, 30, 40, 0.9) 0%, rgba(20, 20, 30, 0.95) 100%)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        }}
      >
        <Image 
          src="/images/atv-logo.svg" 
          alt="All The Vibes" 
          width={68}
          height={68}
          className="w-[68px] h-[68px] object-contain"
        />
      </div>
      
      {/* App Label */}
      <span 
        className="text-sm font-medium text-center px-1.5 py-0.5 rounded"
        style={{
          fontFamily: 'Arial, Helvetica, sans-serif',
          color: 'var(--text-primary)',
          textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)',
          maxWidth: '92px',
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
