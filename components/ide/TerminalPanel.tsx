"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { X, ChevronDown, Plus, Trash2, SplitSquareVertical, GripHorizontal } from "lucide-react"

// ASCII art banner - styled like GitHub Copilot CLI
const VIBES_BANNER = `
[38;5;208m   █████╗ ██╗     ██╗         ████████╗██╗  ██╗███████╗[0m
[38;5;209m  ██╔══██╗██║     ██║         ╚══██╔══╝██║  ██║██╔════╝[0m
[38;5;210m  ███████║██║     ██║            ██║   ███████║█████╗  [0m
[38;5;211m  ██╔══██║██║     ██║            ██║   ██╔══██║██╔══╝  [0m
[38;5;212m  ██║  ██║███████╗███████╗       ██║   ██║  ██║███████╗[0m
[38;5;213m  ╚═╝  ╚═╝╚══════╝╚══════╝       ╚═╝   ╚═╝  ╚═╝╚══════╝[0m

[38;5;135m  ██╗   ██╗██╗██████╗ ███████╗███████╗[0m
[38;5;141m  ██║   ██║██║██╔══██╗██╔════╝██╔════╝[0m
[38;5;147m  ██║   ██║██║██████╔╝█████╗  ███████╗[0m
[38;5;153m  ╚██╗ ██╔╝██║██╔══██╗██╔══╝  ╚════██║[0m
[38;5;159m   ╚████╔╝ ██║██████╔╝███████╗███████║[0m
[38;5;165m    ╚═══╝  ╚═╝╚═════╝ ╚══════╝╚══════╝[0m

[38;5;45m   ██████╗ ██████╗ ███╗   ███╗███╗   ███╗██╗   ██╗███╗   ██╗██╗████████╗██╗   ██╗[0m
[38;5;39m  ██╔════╝██╔═══██╗████╗ ████║████╗ ████║██║   ██║████╗  ██║██║╚══██╔══╝╚██╗ ██╔╝[0m
[38;5;33m  ██║     ██║   ██║██╔████╔██║██╔████╔██║██║   ██║██╔██╗ ██║██║   ██║    ╚████╔╝ [0m
[38;5;27m  ██║     ██║   ██║██║╚██╔╝██║██║╚██╔╝██║██║   ██║██║╚██╗██║██║   ██║     ╚██╔╝  [0m
[38;5;21m  ╚██████╗╚██████╔╝██║ ╚═╝ ██║██║ ╚═╝ ██║╚██████╔╝██║ ╚████║██║   ██║      ██║   [0m
[38;5;57m   ╚═════╝ ╚═════╝ ╚═╝     ╚═╝╚═╝     ╚═╝ ╚═════╝ ╚═╝  ╚═══╝╚═╝   ╚═╝      ╚═╝   [0m
`

const WELCOME_MESSAGE = `
[38;5;245m  Welcome to the global community for AI-assisted development[0m
[38;5;245m  GitHub Copilot • Claude Code • Cursor • v0 • Lovable • Replit[0m

[38;5;40m  ✓[0m [38;5;255mVibe mode activated[0m
[38;5;40m  ✓[0m [38;5;255mCommunity connection established[0m
[38;5;40m  ✓[0m [38;5;255mReady to build amazing things[0m

[38;5;245m  Type[0m [38;5;39mhelp[0m [38;5;245mfor available commands or visit[0m [38;5;39mallthevibes.dev[0m

`

// Parse ANSI escape codes to styled spans
function parseAnsiToHtml(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = []
  let key = 0
  
  // Split by ANSI escape sequences
  const regex = /\[38;5;(\d+)m([^\[]*)\[0m|([^\[]+)/g
  let match
  
  while ((match = regex.exec(text)) !== null) {
    if (match[1] && match[2]) {
      // Colored text
      const colorCode = parseInt(match[1])
      const color = ansi256ToHex(colorCode)
      parts.push(
        <span key={key++} style={{ color }}>
          {match[2]}
        </span>
      )
    } else if (match[3]) {
      // Plain text
      parts.push(<span key={key++}>{match[3]}</span>)
    }
  }
  
  return parts
}

// Convert ANSI 256 color code to hex
function ansi256ToHex(code: number): string {
  // Standard colors 0-15 (approximate)
  const standardColors = [
    '#000000', '#aa0000', '#00aa00', '#aaaa00', '#0000aa', '#aa00aa', '#00aaaa', '#aaaaaa',
    '#555555', '#ff5555', '#55ff55', '#ffff55', '#5555ff', '#ff55ff', '#55ffff', '#ffffff'
  ]
  
  if (code < 16) {
    return standardColors[code]
  }
  
  // 216 color cube (16-231)
  if (code < 232) {
    const c = code - 16
    const r = Math.floor(c / 36)
    const g = Math.floor((c % 36) / 6)
    const b = c % 6
    return `rgb(${r ? r * 40 + 55 : 0}, ${g ? g * 40 + 55 : 0}, ${b ? b * 40 + 55 : 0})`
  }
  
  // Grayscale (232-255)
  const gray = (code - 232) * 10 + 8
  return `rgb(${gray}, ${gray}, ${gray})`
}

interface TerminalPanelProps {
  isOpen: boolean
  onClose: () => void
  height: number
  onResize: (delta: number) => void
  onExpand: () => void
}

export default function TerminalPanel({ isOpen, onClose, height, onResize, onExpand }: TerminalPanelProps) {
  const [commandRun, setCommandRun] = useState(false)
  const [displayedLines, setDisplayedLines] = useState<string[]>([])
  const [cursorVisible, setCursorVisible] = useState(true)
  const [isTyping, setIsTyping] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const terminalRef = useRef<HTMLDivElement>(null)
  const resizeRef = useRef<{ startY: number; startHeight: number } | null>(null)
  
  const command = "npx @vibes/cli init"
  
  // Cursor blink effect
  useEffect(() => {
    if (!commandRun) {
      const interval = setInterval(() => setCursorVisible(v => !v), 530)
      return () => clearInterval(interval)
    }
  }, [commandRun])
  
  // Resize handlers
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
    resizeRef.current = { startY: e.clientY, startHeight: height }
  }, [height])
  
  useEffect(() => {
    if (!isResizing) return
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!resizeRef.current) return
      const delta = resizeRef.current.startY - e.clientY
      onResize(delta)
    }
    
    const handleMouseUp = () => {
      setIsResizing(false)
      resizeRef.current = null
    }
    
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing, onResize])
  
  // Typewriter effect for banner
  const runCommand = useCallback(() => {
    if (commandRun || isTyping) return
    
    // Expand terminal to show full animation
    onExpand()
    
    setIsTyping(true)
    setCommandRun(true)
    
    const allLines = (VIBES_BANNER + WELCOME_MESSAGE).split('\n')
    let lineIndex = 0
    
    const typeNextLine = () => {
      if (lineIndex < allLines.length) {
        setDisplayedLines(prev => [...prev, allLines[lineIndex]])
        lineIndex++
        
        // Scroll to bottom
        if (terminalRef.current) {
          terminalRef.current.scrollTop = terminalRef.current.scrollHeight
        }
        
        // Variable speed for dramatic effect
        const delay = lineIndex < 15 ? 40 : 60
        setTimeout(typeNextLine, delay)
      } else {
        setIsTyping(false)
      }
    }
    
    // Small delay before starting
    setTimeout(typeNextLine, 300)
  }, [commandRun, isTyping, onExpand])
  
  // Handle keyboard
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !commandRun) {
      runCommand()
    }
  }, [commandRun, runCommand])
  
  // Reset when closed
  useEffect(() => {
    if (!isOpen) {
      setCommandRun(false)
      setDisplayedLines([])
      setIsTyping(false)
    }
  }, [isOpen])
  
  if (!isOpen) return null
  
  return (
    <div 
      className="flex flex-col overflow-hidden relative"
      style={{
        height: `${height}px`,
        background: 'rgba(15, 15, 18, 0.98)',
        borderTop: '1px solid var(--ide-border)',
      }}
    >
      {/* Resize handle */}
      <div
        className="absolute top-0 left-0 right-0 h-1 cursor-ns-resize z-20 flex items-center justify-center group"
        onMouseDown={handleResizeStart}
        style={{ marginTop: '-2px' }}
      >
        <div 
          className="w-10 h-1 rounded-full transition-colors group-hover:bg-[var(--accent-blue)]"
          style={{ background: isResizing ? 'var(--accent-blue)' : 'var(--ide-border)' }}
        />
      </div>
      
      {/* Terminal header */}
      <div 
        className="flex items-center justify-between px-3 flex-shrink-0"
        style={{
          height: '35px',
          background: 'rgba(30, 30, 35, 0.95)',
          borderBottom: '1px solid var(--ide-border)',
        }}
      >
        <div className="flex items-center gap-1">
          <button
            className="flex items-center gap-1.5 px-2 py-1 rounded text-xs hover:bg-white/10 transition-colors"
            style={{ 
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-primary)',
              background: 'rgba(255, 255, 255, 0.05)',
            }}
          >
            <span>bash</span>
            <ChevronDown size={12} />
          </button>
          <button
            className="p-1 rounded hover:bg-white/10 transition-colors"
            style={{ color: 'var(--text-muted)' }}
            aria-label="New terminal"
          >
            <Plus size={14} />
          </button>
          <button
            className="p-1 rounded hover:bg-white/10 transition-colors"
            style={{ color: 'var(--text-muted)' }}
            aria-label="Split terminal"
          >
            <SplitSquareVertical size={14} />
          </button>
          <button
            className="p-1 rounded hover:bg-white/10 transition-colors"
            style={{ color: 'var(--text-muted)' }}
            aria-label="Clear terminal"
          >
            <Trash2 size={14} />
          </button>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-white/10 transition-colors"
          style={{ color: 'var(--text-muted)' }}
          aria-label="Close terminal panel"
        >
          <X size={14} />
        </button>
      </div>
      
      {/* Terminal content */}
      <div 
        ref={terminalRef}
        className="flex-1 overflow-y-auto p-3 cursor-text"
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '13px',
          lineHeight: '1.5',
        }}
        onClick={runCommand}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="application"
        aria-label="Terminal. Press Enter to run command."
      >
        {/* Command prompt */}
        <div className="flex items-center gap-2">
          <span style={{ color: '#50fa7b' }}>vibes</span>
          <span style={{ color: '#bd93f9' }}>~</span>
          <span style={{ color: '#f8f8f2' }}>$</span>
          <span style={{ color: '#f8f8f2' }} className="ml-2">
            {command}
            {!commandRun && (
              <span 
                style={{ 
                  background: cursorVisible ? '#f8f8f2' : 'transparent',
                  marginLeft: '1px',
                }}
              >
                &nbsp;
              </span>
            )}
          </span>
        </div>
        
        {/* Output */}
        {commandRun && (
          <div className="mt-2 whitespace-pre" style={{ fontSize: '11px', lineHeight: '1.2' }}>
            {displayedLines.map((line, i) => (
              <div key={i}>{parseAnsiToHtml(line)}</div>
            ))}
            {isTyping && (
              <span 
                style={{ 
                  display: 'inline-block',
                  width: '8px',
                  height: '14px',
                  background: '#f8f8f2',
                  animation: 'blink 1s step-end infinite',
                }}
              />
            )}
          </div>
        )}
        
        {/* Click hint */}
        {!commandRun && (
          <div 
            className="mt-4 text-xs animate-pulse"
            style={{ color: 'var(--text-muted)' }}
          >
            Press Enter or click to run command...
          </div>
        )}
      </div>
    </div>
  )
}
