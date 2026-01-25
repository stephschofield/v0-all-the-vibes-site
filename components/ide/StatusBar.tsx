"use client"

import React from "react"

import { GitBranch, Check } from "lucide-react"

export default function StatusBar() {
  return (
    <div 
      className="flex items-center justify-between px-3 relative z-10"
      style={{
        height: 'var(--statusbar-height)',
        background: 'var(--status-bg)',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
      }}
    >
      <div className="flex items-center gap-4">
        <span 
          className="flex items-center gap-1.5"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '11px',
            fontWeight: 500,
            color: 'var(--status-text)',
            opacity: 0.9,
          }}
        >
          <GitBranch size={14} />
          <span className="hidden sm:inline">main • 42 commits ahead</span>
          <span className="sm:hidden">main</span>
        </span>
      </div>
      
      <div className="flex items-center gap-3 sm:gap-4">
        <StatusItem>Ln 42, Col 1</StatusItem>
        <StatusItem className="hidden sm:flex">UTF-8</StatusItem>
        <StatusItem className="hidden sm:flex">Markdown</StatusItem>
        <StatusItem className="text-[var(--accent-green)]">
          <Check size={14} />
          <span className="hidden sm:inline">Prettier</span>
        </StatusItem>
      </div>
    </div>
  )
}

function StatusItem({ children, className = '' }: { children: React.ReactNode, className?: string }) {
  return (
    <span 
      className={`flex items-center gap-1.5 ${className}`}
      style={{
        fontFamily: 'var(--font-display)',
        fontSize: '11px',
        fontWeight: 500,
        color: 'var(--status-text)',
        opacity: 0.9,
      }}
    >
      {children}
    </span>
  )
}
