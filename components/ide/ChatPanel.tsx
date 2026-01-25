"use client"

import { useState } from "react"
import { 
  Plus, Settings, MoreHorizontal, Maximize2, X, 
  RefreshCw, Search, Filter, PanelRight,
  Paperclip, Monitor, Code, ChevronDown, Send,
  Sparkles, MessageSquare, ZoomIn, Users, Bell
} from "lucide-react"

// GitHub Copilot icon - dual sparkle design
function CopilotIcon({ size = 14, className = "" }: { size?: number, className?: string }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      className={className}
    >
      {/* Left sparkle */}
      <path 
        d="M8 2L9.5 6.5L14 8L9.5 9.5L8 14L6.5 9.5L2 8L6.5 6.5L8 2Z" 
        fill="currentColor"
      />
      {/* Right sparkle (smaller) */}
      <path 
        d="M18 12L19 15L22 16L19 17L18 20L17 17L14 16L17 15L18 12Z" 
        fill="currentColor"
      />
    </svg>
  )
}

interface ChatPanelProps {
  dynamicWidth?: number
}

export default function ChatPanel({ dynamicWidth }: ChatPanelProps) {
  const [inputValue, setInputValue] = useState("")

  return (
    <div 
      className="flex flex-col h-full w-full"
      style={{
        background: 'var(--ide-sidebar)',
      }}
    >
      {/* Header */}
      <div 
        className="flex items-center justify-between px-3 py-2"
        style={{ borderBottom: '1px solid var(--ide-border)' }}
      >
        <div className="flex items-center gap-2">
          <span 
            className="text-xs font-semibold uppercase tracking-wide"
            style={{ 
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-display)',
            }}
          >
            Chat
          </span>
          <button 
            className="p-1 rounded hover:bg-white/5 transition-colors"
            style={{ color: 'var(--text-muted)' }}
          >
            <MoreHorizontal size={14} />
          </button>
        </div>
        <div className="flex items-center gap-1">
          <button 
            className="p-1.5 rounded hover:bg-white/5 transition-colors"
            style={{ color: 'var(--text-muted)' }}
          >
            <Plus size={14} />
          </button>
          <button 
            className="p-1.5 rounded hover:bg-white/5 transition-colors"
            style={{ color: 'var(--text-muted)' }}
          >
            <Settings size={14} />
          </button>
          <button 
            className="p-1.5 rounded hover:bg-white/5 transition-colors"
            style={{ color: 'var(--text-muted)' }}
          >
            <MoreHorizontal size={14} />
          </button>
          <div 
            className="w-px h-4 mx-1"
            style={{ background: 'var(--ide-border)' }}
          />
          <button 
            className="p-1.5 rounded hover:bg-white/5 transition-colors"
            style={{ color: 'var(--text-muted)' }}
          >
            <Maximize2 size={14} />
          </button>
          <button 
            className="p-1.5 rounded hover:bg-white/5 transition-colors"
            style={{ color: 'var(--text-muted)' }}
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Sessions Header */}
      <div 
        className="flex items-center justify-between px-3 py-2"
        style={{ borderBottom: '1px solid var(--ide-border)' }}
      >
        <span 
          className="text-[11px] font-semibold uppercase tracking-wider"
          style={{ 
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-display)',
          }}
        >
          Sessions
        </span>
        <div className="flex items-center gap-0.5">
          <button 
            className="p-1 rounded hover:bg-white/5 transition-colors"
            style={{ color: 'var(--text-muted)' }}
          >
            <RefreshCw size={12} />
          </button>
          <button 
            className="p-1 rounded hover:bg-white/5 transition-colors"
            style={{ color: 'var(--text-muted)' }}
          >
            <Search size={12} />
          </button>
          <button 
            className="p-1 rounded hover:bg-white/5 transition-colors"
            style={{ color: 'var(--text-muted)' }}
          >
            <Filter size={12} />
          </button>
          <button 
            className="p-1 rounded hover:bg-white/5 transition-colors"
            style={{ color: 'var(--text-muted)' }}
          >
            <PanelRight size={12} />
          </button>
        </div>
      </div>

      {/* Archived Section */}
      <div className="px-3 py-2">
        <span 
          className="text-[11px] uppercase tracking-wider"
          style={{ 
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-display)',
          }}
        >
          Archived (2)
        </span>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto px-3 py-4 ide-scrollable">
        {/* Empty state or chat messages would go here */}
        <div className="flex flex-col items-center justify-center h-full opacity-40">
          <MessageSquare size={32} style={{ color: 'var(--text-muted)' }} />
          <p 
            className="text-xs mt-2 text-center"
            style={{ 
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-display)',
            }}
          >
            Start a conversation
          </p>
        </div>
      </div>

      {/* Input Section */}
      <div 
        className="p-3"
        style={{ borderTop: '1px solid var(--ide-border)' }}
      >
        {/* Add Context Button */}
        <button 
          className="flex items-center gap-1.5 px-2 py-1 rounded mb-2 text-xs transition-colors hover:bg-white/5"
          style={{ 
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-display)',
          }}
        >
          <Paperclip size={12} />
          Add Context...
        </button>

        {/* Input Field */}
        <div 
          className="rounded-lg p-2 mb-2"
          style={{ 
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid var(--ide-border)',
          }}
        >
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Describe what to build next"
            className="w-full bg-transparent border-none outline-none text-sm"
            style={{ 
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-display)',
            }}
          />
        </div>

        {/* Bottom Toolbar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <button 
              className="flex items-center gap-1 px-1.5 py-1 rounded text-xs hover:bg-white/5 transition-colors"
              style={{ color: 'var(--text-muted)' }}
            >
              <Monitor size={12} />
              <ChevronDown size={10} />
            </button>
            <button 
              className="flex items-center gap-1 px-1.5 py-1 rounded text-xs hover:bg-white/5 transition-colors"
              style={{ color: 'var(--text-muted)' }}
            >
              <Code size={12} />
              <ChevronDown size={10} />
            </button>
            <button 
              className="flex items-center gap-1 px-2 py-1 rounded text-xs hover:bg-white/5 transition-colors"
              style={{ 
                color: 'var(--text-secondary)',
                fontFamily: 'var(--font-display)',
                fontSize: '10px',
              }}
            >
              <Sparkles size={10} style={{ color: 'var(--accent-purple)' }} />
              Claude Sonnet 4.5
              <ChevronDown size={10} />
            </button>
            <button 
              className="p-1 rounded hover:bg-white/5 transition-colors"
              style={{ color: 'var(--text-muted)' }}
            >
              <MoreHorizontal size={12} />
            </button>
          </div>
          <button 
            className="p-1.5 rounded transition-colors"
            style={{ 
              background: inputValue ? 'var(--accent-purple)' : 'rgba(255, 255, 255, 0.05)',
              color: inputValue ? 'white' : 'var(--text-muted)',
            }}
          >
            <Send size={14} />
          </button>
        </div>
      </div>

      {/* Footer */}
      <div 
        className="flex items-center justify-end gap-2 px-3 py-2"
        style={{ 
          borderTop: '1px solid var(--ide-border)',
          background: 'rgba(0, 0, 0, 0.2)',
        }}
      >
        <button 
          className="flex items-center gap-1.5 text-[10px] hover:opacity-80 transition-opacity"
          style={{ 
            color: 'var(--accent-pink)',
            fontFamily: 'var(--font-display)',
          }}
        >
          <CopilotIcon size={12} />
          Copilot Proxy
        </button>
        <button 
          className="p-1 rounded hover:bg-white/5 transition-colors"
          style={{ color: 'var(--text-muted)' }}
        >
          <ZoomIn size={12} />
        </button>
        {/* GitHub Copilot Logo */}
        <img 
          src="/images/ghcp-logo.png" 
          alt="GitHub Copilot" 
          className="h-3 w-auto opacity-70 hover:opacity-100 transition-opacity cursor-pointer"
          style={{ filter: 'invert(1)' }}
        />
        <button 
          className="p-1 rounded hover:bg-white/5 transition-colors"
          style={{ color: 'var(--text-muted)' }}
        >
          <Users size={12} />
        </button>
        <button 
          className="p-1 rounded hover:bg-white/5 transition-colors"
          style={{ color: 'var(--text-muted)' }}
        >
          <Bell size={12} />
        </button>
      </div>
    </div>
  )
}
