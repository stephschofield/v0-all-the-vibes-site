"use client"

import { X, FileText, FileCode } from "lucide-react"
import { useIDE } from "./IDEContext"
import { useRef, useCallback, KeyboardEvent } from "react"

const tabs = [
  { name: 'welcome.md', icon: 'markdown' },
  { name: 'upcoming-events.py', icon: 'python' },
  { name: 'schedule.py', icon: 'python' },
]

const iconMap: Record<string, { icon: typeof FileText, color: string }> = {
  markdown: { icon: FileText, color: '#4A9EFF' },
  python: { icon: FileCode, color: '#4ADE80' },
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
  active: boolean
  onKeyDown: (e: KeyboardEvent<HTMLButtonElement>) => void
  tabRef: (el: HTMLButtonElement | null) => void
}

function Tab({ name, icon, onClick, active, onKeyDown, tabRef }: TabProps) {
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
          // Close functionality would go here
        }}
      >
        <X size={14} />
      </span>
    </button>
  )
}

export default function TabBar() {
  const { activeFile, setActiveFile } = useIDE()
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])
  
  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLButtonElement>, currentIndex: number) => {
    const tabCount = tabs.length
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
    
    if (newIndex !== null) {
      const newTab = tabs[newIndex]
      setActiveFile(newTab.name)
      tabRefs.current[newIndex]?.focus()
    }
  }, [setActiveFile])
  
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
        {tabs.map((tab, index) => (
          <Tab 
            key={tab.name} 
            {...tab} 
            active={tab.name === activeFile}
            onClick={() => setActiveFile(tab.name)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            tabRef={(el) => { tabRefs.current[index] = el }}
          />
        ))}
      </div>
    </div>
  )
}
