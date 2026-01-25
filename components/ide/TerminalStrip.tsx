"use client"

import React from "react"

import { useState, useEffect } from "react"
import { Terminal, Wifi, Battery, Flame } from "lucide-react"

export default function TerminalStrip() {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div 
      className="flex items-center justify-between px-4 relative z-10"
      style={{
        height: 'var(--terminal-strip-height)',
        background: 'rgba(20, 20, 25, 0.98)',
        borderTop: '1px solid var(--ide-border)',
        borderRadius: '0 0 var(--ide-border-radius) var(--ide-border-radius)',
      }}
    >
      <div className="flex items-center gap-5">
        <TerminalItem>
          <Terminal size={14} />
          <span className="hidden sm:inline">Terminal</span>
        </TerminalItem>
        <TerminalItem className="text-[var(--accent-green)]">
          <Wifi size={14} />
          <span className="hidden sm:inline">Connected</span>
        </TerminalItem>
      </div>
      
      <div className="flex items-center gap-5">
        <TerminalItem>
          <Battery size={14} />
          <span>87%</span>
        </TerminalItem>
        <TerminalItem className="tabular-nums">
          {time.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit',
            hour12: false 
          })}
        </TerminalItem>
        <div 
          className="flex items-center gap-1.5"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.05em',
            background: 'var(--vibe-gradient)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            animation: 'vibeGlow 2s ease-in-out infinite',
          }}
        >
          <Flame 
            size={14} 
            className="text-[var(--accent-orange)]"
            style={{ 
              animation: 'flamePulse 1s ease-in-out infinite',
              WebkitTextFillColor: 'initial',
            }} 
          />
          <span className="hidden sm:inline">VIBE MODE ACTIVATED</span>
          <span className="sm:hidden">VIBE</span>
        </div>
      </div>
    </div>
  )
}

function TerminalItem({ children, className = '' }: { children: React.ReactNode, className?: string }) {
  return (
    <span 
      className={`flex items-center gap-1.5 ${className}`}
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '11px',
        color: className.includes('text-') ? undefined : 'var(--text-muted)',
      }}
    >
      {children}
    </span>
  )
}
