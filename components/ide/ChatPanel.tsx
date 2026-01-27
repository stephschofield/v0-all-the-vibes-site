"use client"

import { useState } from "react"
import Image from "next/image"
import { 
  Plus, Settings, MoreHorizontal, Maximize2, X, 
  RefreshCw, Search, Filter, PanelRight,
  Paperclip, Monitor, Code, ChevronDown, Send,
  Sparkles, MessageSquare, Bell
} from "lucide-react"

interface ChatPanelProps {
  dynamicWidth?: number
}

export default function ChatPanel({ dynamicWidth: _dynamicWidth }: ChatPanelProps) {
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
            aria-label="More options"
          >
            <MoreHorizontal size={14} />
          </button>
        </div>
        <div className="flex items-center gap-1">
          <button 
            className="p-1.5 rounded hover:bg-white/5 transition-colors"
            style={{ color: 'var(--text-muted)' }}
            aria-label="New chat"
          >
            <Plus size={14} />
          </button>
          <button 
            className="p-1.5 rounded hover:bg-white/5 transition-colors"
            style={{ color: 'var(--text-muted)' }}
            aria-label="Settings"
          >
            <Settings size={14} />
          </button>
          <button 
            className="p-1.5 rounded hover:bg-white/5 transition-colors"
            style={{ color: 'var(--text-muted)' }}
            aria-label="More options"
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
            aria-label="Maximize panel"
          >
            <Maximize2 size={14} />
          </button>
          <button 
            className="p-1.5 rounded hover:bg-white/5 transition-colors"
            style={{ color: 'var(--text-muted)' }}
            aria-label="Close panel"
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
            aria-label="Refresh sessions"
          >
            <RefreshCw size={12} />
          </button>
          <button 
            className="p-1 rounded hover:bg-white/5 transition-colors"
            style={{ color: 'var(--text-muted)' }}
            aria-label="Search sessions"
          >
            <Search size={12} />
          </button>
          <button 
            className="p-1 rounded hover:bg-white/5 transition-colors"
            style={{ color: 'var(--text-muted)' }}
            aria-label="Filter sessions"
          >
            <Filter size={12} />
          </button>
          <button 
            className="p-1 rounded hover:bg-white/5 transition-colors"
            style={{ color: 'var(--text-muted)' }}
            aria-label="Toggle panel"
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
            id="chat-message-input"
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Describe what to build next"
            aria-label="Type a message to Copilot"
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
              aria-label="More options"
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
            aria-label="Send message"
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
        
        {/* GitHub Copilot Logo */}
        <Image 
          src="/images/ghcp-logo.png" 
          alt="GitHub Copilot" 
          width={48}
          height={12}
          className="h-3 w-auto opacity-70 hover:opacity-100 transition-opacity cursor-pointer"
          style={{ filter: 'invert(1)' }}
        />
        <button 
          className="p-1 rounded hover:bg-white/5 transition-colors"
          style={{ color: 'var(--text-muted)' }}
          aria-label="Notifications"
        >
          <Bell size={12} />
        </button>
      </div>
    </div>
  )
}
