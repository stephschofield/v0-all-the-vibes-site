"use client"

import { X, FileText, FileCode } from "lucide-react"
import { useIDE } from "./IDEContext"
import { useRef, useCallback, KeyboardEvent } from "react"

const iconMap: Record<string, { icon: typeof FileText, color: string }> = {
  markdown: { icon: FileText, color: '#4A9EFF' },
  python: { icon: FileCode, color: '#4ADE80' },
  javascript: { icon: FileCode, color: '#F7DF1E' },
  typescript: { icon: FileCode, color: '#3178C6' },
}

function TabIcon({ type }: { type: string }) {
  const config = iconMap[type] || { icon: FileText, color: '#888' }
  const Icon = config.icon
  return <Icon size={14} color={config.color} />
}

interface TabProps {
  name: string
  icon: string
  onClick: () => void
  onClose: () => void
  active: boolean
  onKeyDown: (e: KeyboardEvent<HTMLButtonElement>) => void
  tabRef: (el: HTMLButtonElement | null) => void
}

function Tab({ name, icon, onClick, onClose, active, onKeyDown, tabRef }: TabProps) {
  // Generate panel ID from filename (for aria-controls)
  const panelId = `panel-${name.replace(/\./g, '-')}`
  
  return (
    <button 
      ref={tabRef}
      role="tab"
      aria-selected={active}
      aria-controls={panelId}
      tabIndex={active ? 0 : -1}
      className={`group flex items-center gap-2 h-9 px-4 relative transition-all duration-100 hover:-translate-y-[1px] ${
        active 
          ? 'bg-[var(--ide-bg)] text-[var(--text-primary)]' 
          : 'bg-[var(--ide-tab-inactive)] text-[var(--text-muted)] hover:bg-white/[0.03] hover:text-[var(--text-secondary)]'
      }`}
      style={{
        border: 'none',
        borderRight: '1px solid var(--ide-border)',
        fontFamily: 'var(--font-display)',
        fontSize: '12px',
        fontWeight: 500,
      }}
      onClick={onClick}
      onKeyDown={onKeyDown}
    >
      {active && (
        <span 
          className="absolute bottom-[-1px] left-0 right-0 h-[1px]"
          style={{ background: 'var(--ide-bg)' }}
        />
      )}
      <span className="flex items-center">
        <TabIcon type={icon} />
      </span>
      <span className="whitespace-nowrap">{name}</span>
      <span 
        role="button"
        aria-label={`Close ${name} tab`}
        tabIndex={-1}
        className="flex items-center p-0.5 rounded opacity-0 group-hover:opacity-50 hover:!opacity-100 hover:bg-white/10 transition-all"
        onClick={(e) => {
          e.stopPropagation()
          onClose()
        }}
      >
        <X size={14} />
      </span>
    </button>
  )
}

export default function TabBar() {
  const { activeFile, setActiveFile, openFiles, closeFile } = useIDE()
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])
  
  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLButtonElement>, currentIndex: number) => {
    const tabCount = openFiles.length
    let newIndex: number | null = null
    
    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault()
        // Move to next tab, wrap around to first
        newIndex = (currentIndex + 1) % tabCount
        break
      case 'ArrowLeft':
        e.preventDefault()
        // Move to previous tab, wrap around to last
        newIndex = (currentIndex - 1 + tabCount) % tabCount
        break
      case 'Home':
        e.preventDefault()
        newIndex = 0
        break
      case 'End':
        e.preventDefault()
        newIndex = tabCount - 1
        break
    }
    
    if (newIndex !== null && openFiles[newIndex]) {
      const newTab = openFiles[newIndex]
      setActiveFile(newTab.name)
      tabRefs.current[newIndex]?.focus()
    }
  }, [setActiveFile, openFiles])
  
  return (
    <div 
      className="flex items-end overflow-x-auto ide-scrollable"
      style={{
        height: 'var(--tabbar-height)',
        background: 'var(--ide-tab-inactive)',
        borderBottom: '1px solid var(--ide-border)',
      }}
    >
      <div 
        role="tablist"
        aria-label="Open files"
        className="flex items-end min-w-min"
      >
        {openFiles.map((tab, index) => (
          <Tab 
            key={tab.name} 
            name={tab.name}
            icon={tab.icon}
            active={tab.name === activeFile}
            onClick={() => setActiveFile(tab.name)}
            onClose={() => closeFile(tab.name)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            tabRef={(el) => { tabRefs.current[index] = el }}
          />
        ))}
      </div>
    </div>
  )
}
