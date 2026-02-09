"use client"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { 
  Plus, Settings, MoreHorizontal, Maximize2, X, 
  RefreshCw, Search, Filter, PanelRight,
  Paperclip, Monitor, Code, ChevronDown, Send,
  Sparkles, MessageSquare, Bell, Check
} from "lucide-react"

const AGENTS = [
  { name: 'Agent', shortcut: 'Ctrl+Shift+I', isHeader: true },
  { name: 'Ask' },
  { name: 'Plan' },
  { name: 'divider', isDivider: true },
  { name: 'ARIA' },
  { name: 'AEGON' },
  { name: 'GHOST' },
  { name: 'beast mode' },
  { name: 'Mayor West' },
  { name: 'Beth' },
  { name: 'AgentSmith' },
  { name: 'Configure Custom Agents...', isConfig: true },
]

const MODELS = [
  { name: 'Auto', note: '10% discount', isAuto: true },
  { name: 'GPT-4.1', multiplier: '0x', color: '#10a37f' },
  { name: 'GPT-4o', multiplier: '0x', color: '#10a37f' },
  { name: 'GPT-5 mini', multiplier: '0x', color: '#10a37f' },
  { name: 'Claude Haiku 4.5', multiplier: '0.33x', color: '#cc785c' },
  { name: 'Claude Opus 4.5', multiplier: '3x', color: '#cc785c' },
  { name: 'Claude Sonnet 4', multiplier: '1x', color: '#cc785c' },
  { name: 'Claude Sonnet 4.5', multiplier: '1x', color: '#cc785c', isDefault: true },
  { name: 'Gemini 2.5 Pro', multiplier: '1x', color: '#4285f4' },
  { name: 'Gemini 3 Flash (Preview)', multiplier: '0.33x', color: '#4285f4' },
  { name: 'Gemini 3 Pro (Preview)', multiplier: '1x', color: '#4285f4' },
  { name: 'Goldeneye (Internal Only)', multiplier: '1x', color: '#888' },
  { name: 'GPT-5', multiplier: '1x', color: '#10a37f' },
  { name: 'GPT-5-Codex (Preview)', multiplier: '1x', color: '#10a37f' },
  { name: 'GPT-5.1', multiplier: '1x', color: '#10a37f' },
  { name: 'GPT-5.1-Codex', multiplier: '1x', color: '#10a37f' },
  { name: 'GPT-5.1-Codex-Max', multiplier: '1x', color: '#10a37f' },
  { name: 'GPT-5.1-Codex-Mini (Preview)', multiplier: '0.33x', color: '#10a37f' },
  { name: 'GPT-5.2', multiplier: '1x', color: '#10a37f' },
  { name: 'GPT-5.2-Codex', multiplier: '1x', color: '#10a37f' },
  { name: 'Manage Models...', isManage: true },
]

interface ChatPanelProps {
  dynamicWidth?: number
}

export default function ChatPanel({ dynamicWidth: _dynamicWidth }: ChatPanelProps) {
  const [inputValue, setInputValue] = useState("")
  const [showAgentDropdown, setShowAgentDropdown] = useState(false)
  const [showModelDropdown, setShowModelDropdown] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState("Beth")
  const [selectedModel, setSelectedModel] = useState("Claude Sonnet 4.5")
  
  const agentDropdownRef = useRef<HTMLDivElement>(null)
  const modelDropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (agentDropdownRef.current && !agentDropdownRef.current.contains(event.target as Node)) {
        setShowAgentDropdown(false)
      }
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(event.target as Node)) {
        setShowModelDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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
            
            {/* Agent Selector */}
            <div className="relative" ref={agentDropdownRef}>
              <button 
                className="flex items-center gap-1 px-1.5 py-1 rounded text-xs hover:bg-white/5 transition-colors"
                style={{ 
                  color: 'var(--text-secondary)',
                  fontFamily: 'var(--font-display)',
                  fontSize: '11px',
                }}
                onClick={() => {
                  setShowAgentDropdown(!showAgentDropdown)
                  setShowModelDropdown(false)
                }}
              >
                <Code size={12} />
                {selectedAgent}
                <ChevronDown size={10} />
              </button>
              
              {showAgentDropdown && (
                <div 
                  className="absolute bottom-full left-0 mb-1 py-1 rounded-lg shadow-xl z-50 min-w-[200px]"
                  style={{ 
                    background: 'var(--ide-sidebar)',
                    border: '1px solid var(--ide-border)',
                  }}
                >
                  {AGENTS.map((agent, idx) => (
                    <div key={idx}>
                      {agent.isHeader ? (
                        <div 
                          className="flex items-center justify-between px-3 py-2"
                          style={{ 
                            color: 'var(--text-primary)',
                            fontFamily: 'var(--font-display)',
                            fontSize: '13px',
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <Code size={14} />
                            <span>{agent.name}</span>
                          </div>
                          <span 
                            className="text-[10px]"
                            style={{ color: 'var(--text-muted)' }}
                          >
                            {agent.shortcut}
                          </span>
                        </div>
                      ) : agent.isDivider ? (
                        <div className="my-1" style={{ borderTop: '1px solid var(--ide-border)' }} />
                      ) : agent.isConfig ? (
                        <>
                          <div className="my-1" style={{ borderTop: '1px solid var(--ide-border)' }} />
                          <button
                            className="w-full text-left px-3 py-2 text-xs hover:bg-white/5 transition-colors"
                            style={{ 
                              color: 'var(--accent-cyan)',
                              fontFamily: 'var(--font-display)',
                              fontSize: '13px',
                            }}
                          >
                            {agent.name}
                          </button>
                        </>
                      ) : (
                        <button
                          className="w-full text-left px-3 py-2 text-xs hover:bg-white/5 transition-colors flex items-center gap-2"
                          style={{ 
                            color: 'var(--text-secondary)',
                            fontFamily: 'var(--font-display)',
                            fontSize: '13px',
                            paddingLeft: agent.name === 'Ask' || agent.name === 'Plan' ? '12px' : '24px',
                          }}
                          onClick={() => {
                            if (agent.name !== 'Ask' && agent.name !== 'Plan') {
                              setSelectedAgent(agent.name)
                            }
                            setShowAgentDropdown(false)
                          }}
                        >
                          {selectedAgent === agent.name && (
                            <Check size={12} style={{ marginLeft: '-16px', color: 'var(--text-primary)' }} />
                          )}
                          {agent.name === 'Ask' && <span style={{ marginRight: '4px' }}>?</span>}
                          {agent.name === 'Plan' && <span style={{ marginRight: '4px' }}>≡</span>}
                          {agent.name}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Model Selector */}
            <div className="relative" ref={modelDropdownRef}>
              <button 
                className="flex items-center gap-1 px-2 py-1 rounded text-xs hover:bg-white/5 transition-colors"
                style={{ 
                  color: 'var(--text-secondary)',
                  fontFamily: 'var(--font-display)',
                  fontSize: '10px',
                }}
                onClick={() => {
                  setShowModelDropdown(!showModelDropdown)
                  setShowAgentDropdown(false)
                }}
              >
                <Sparkles size={10} style={{ color: 'var(--accent-purple)' }} />
                {selectedModel}
                <ChevronDown size={10} />
              </button>
              
              {showModelDropdown && (
                <div 
                  className="fixed py-1 rounded-lg shadow-xl z-[100] min-w-[220px] max-h-[350px] overflow-y-auto ide-scrollable"
                  style={{ 
                    background: 'var(--ide-sidebar)',
                    border: '1px solid var(--ide-border)',
                    bottom: '60px',
                    right: '20px',
                  }}
                >
                  {MODELS.map((model, idx) => (
                    <div key={idx}>
                      {model.isManage ? (
                        <>
                          <div className="my-1" style={{ borderTop: '1px solid var(--ide-border)' }} />
                          <button
                            className="w-full text-left px-2 py-1 hover:bg-white/5 transition-colors"
                            style={{ 
                              color: 'var(--accent-cyan)',
                              fontFamily: 'var(--font-display)',
                              fontSize: '11px',
                            }}
                          >
                            {model.name}
                          </button>
                        </>
                      ) : (
                        <button
                          className="w-full text-left px-2 py-1 hover:bg-white/5 transition-colors flex items-center justify-between"
                          style={{ 
                            fontFamily: 'var(--font-display)',
                            fontSize: '11px',
                          }}
                          onClick={() => {
                            setSelectedModel(model.name)
                            setShowModelDropdown(false)
                          }}
                        >
                          <div className="flex items-center gap-1.5">
                            {selectedModel === model.name && (
                              <Check size={10} style={{ color: 'var(--text-primary)' }} />
                            )}
                            <span style={{ 
                              color: model.color || 'var(--text-secondary)',
                              marginLeft: selectedModel === model.name ? 0 : '14px',
                            }}>
                              {model.name}
                            </span>
                          </div>
                          <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>
                            {model.note || model.multiplier}
                          </span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
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
