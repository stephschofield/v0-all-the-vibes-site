"use client"

import { Minus, Square, X, Zap } from "lucide-react"
import { useIDE } from "./IDEContext"

const menus = ["File", "Edit", "View", "Terminal"]

export default function TitleBar() {
  const { closeWindow, minimizeWindow, maximizeWindow, windowState } = useIDE()

  return (
    <div 
      className="flex items-center gap-4 px-4 relative z-10"
      style={{
        height: 'var(--titlebar-height)',
        background: 'var(--ide-titlebar)',
        borderBottom: '1px solid var(--ide-border)',
      }}
    >
      {/* Traffic Lights (macOS style) */}
      <div className="flex gap-2 group">
        <button 
          onClick={closeWindow}
          className="w-3.5 h-3.5 rounded-full flex items-center justify-center transition-all hover:brightness-110 active:scale-90"
          style={{ backgroundColor: '#FF5F57' }}
          title="Close"
        >
          <X size={10} className="opacity-0 group-hover:opacity-60 transition-opacity text-black/80" />
        </button>
        <button 
          onClick={minimizeWindow}
          className="w-3.5 h-3.5 rounded-full flex items-center justify-center transition-all hover:brightness-110 active:scale-90"
          style={{ backgroundColor: '#FFBD2E' }}
          title={windowState === 'fullscreen' ? 'Exit fullscreen' : 'Minimize'}
        >
          <Minus size={10} className="opacity-0 group-hover:opacity-60 transition-opacity text-black/80" />
        </button>
        <button 
          onClick={maximizeWindow}
          className="w-3.5 h-3.5 rounded-full flex items-center justify-center transition-all hover:brightness-110 active:scale-90"
          style={{ backgroundColor: '#28C840' }}
          title="Fullscreen"
        >
          <Square size={8} className="opacity-0 group-hover:opacity-60 transition-opacity text-black/80" />
        </button>
      </div>
      
      {/* App Title */}
      <div className="flex items-center gap-2">
        <Zap size={16} className="text-[var(--accent-yellow)]" />
        <span 
          className="text-[13px] font-semibold tracking-tight"
          style={{ 
            fontFamily: 'var(--font-display)',
            color: 'var(--text-primary)',
          }}
        >
          All The Vibes Community
        </span>
      </div>
      
      {/* Menu Items */}
      <nav className="flex gap-1">
        {menus.map(menu => (
          <button 
            key={menu} 
            className="px-3 py-1.5 rounded-md transition-all duration-150 hover:bg-white/[0.08] active:scale-[0.98]"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '13px',
              fontWeight: 500,
              color: 'var(--text-secondary)',
              background: 'transparent',
              border: 'none',
            }}
          >
            <span className="hover:text-[var(--text-primary)]">{menu}</span>
          </button>
        ))}
      </nav>
      
      {/* Spacer */}
      <div className="flex-1" />
      
      {/* Right-side shortcuts */}
      <div className="flex gap-3">
        {['⌘K', '⌘P'].map(shortcut => (
          <span 
            key={shortcut}
            className="px-2 py-1 rounded"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              color: 'var(--text-muted)',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            {shortcut}
          </span>
        ))}
      </div>
    </div>
  )
}
