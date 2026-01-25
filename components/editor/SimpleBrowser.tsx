"use client"

import React from "react"

import { ArrowLeft, ArrowRight, RotateCcw, ExternalLink } from "lucide-react"

interface SimpleBrowserProps {
  children: React.ReactNode
  showBrowserTab?: boolean
}

export default function SimpleBrowser({ children, showBrowserTab = true }: SimpleBrowserProps) {
  return (
    <div 
      className="flex flex-col h-full rounded-lg overflow-hidden"
      style={{
        background: 'var(--ide-sidebar)',
        border: '1px solid var(--ide-border)',
      }}
    >
      {/* Browser Tab - Only show if showBrowserTab is true */}
      {showBrowserTab && (
        <div 
          className="flex items-center gap-2 px-3 h-9"
          style={{
            background: 'var(--ide-tab-inactive)',
            borderBottom: '1px solid var(--ide-border)',
          }}
        >
          <div 
            className="flex items-center gap-2 px-3 py-1.5 rounded-t-md"
            style={{
              background: 'var(--ide-bg)',
              borderTop: '2px solid var(--accent-blue)',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--text-muted)' }}>
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
              <line x1="8" y1="21" x2="16" y2="21"/>
              <line x1="12" y1="17" x2="12" y2="21"/>
            </svg>
            <span 
              className="text-xs"
              style={{ 
                fontFamily: 'var(--font-display)',
                color: 'var(--text-primary)',
              }}
            >
              Simple Browser
            </span>
            <button 
              className="p-0.5 rounded hover:bg-white/10 transition-colors"
              style={{ color: 'var(--text-muted)' }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* URL Bar */}
      <div 
        className="flex items-center gap-2 px-3 py-2"
        style={{
          background: 'var(--ide-sidebar)',
          borderBottom: '1px solid var(--ide-border)',
        }}
      >
        {/* Navigation Buttons */}
        <div className="flex items-center gap-1">
          <button 
            className="p-1.5 rounded hover:bg-white/10 transition-colors"
            style={{ color: 'var(--text-muted)' }}
          >
            <ArrowLeft size={14} />
          </button>
          <button 
            className="p-1.5 rounded hover:bg-white/10 transition-colors"
            style={{ color: 'var(--text-muted)' }}
          >
            <ArrowRight size={14} />
          </button>
          <button 
            className="p-1.5 rounded hover:bg-white/10 transition-colors"
            style={{ color: 'var(--text-muted)' }}
          >
            <RotateCcw size={14} />
          </button>
        </div>

        {/* URL Input */}
        <div 
          className="flex-1 flex items-center px-3 py-1.5 rounded-md"
          style={{
            background: 'rgba(0, 0, 0, 0.3)',
            border: '1px solid var(--ide-border)',
          }}
        >
          <span 
            className="text-xs"
            style={{ 
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-secondary)',
            }}
          >
            http://localhost:3000
          </span>
        </div>

        {/* External Link Button */}
        <button 
          className="p-1.5 rounded hover:bg-white/10 transition-colors"
          style={{ color: 'var(--text-muted)' }}
        >
          <ExternalLink size={14} />
        </button>
      </div>

      {/* Browser Content */}
      <div 
        className="flex-1 overflow-auto"
        style={{
          background: 'linear-gradient(180deg, rgba(20, 22, 30, 0.95) 0%, rgba(15, 17, 23, 0.98) 100%)',
        }}
      >
        {children}
      </div>
    </div>
  )
}
