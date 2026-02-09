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
  onKeyDown: (e: KeyboardEvent<HTMLDivElement>) => void
  tabRef: (el: HTMLDivElement | null) => void
}

function Tab({ name, icon, onClick, onClose, active, onKeyDown, tabRef }: TabProps) {
  // Generate panel ID from filename (for aria-controls)
  const panelId = `panel-${name.replace(/\./g, '-')}`
  
  return (
    <div 
      ref={tabRef}
      role="tab"
      aria-selected={active}
      aria-controls={panelId}
      tabIndex={active ? 0 : -1}
      className={`group flex items-center gap-2 h-9 px-4 relative transition-all duration-100 hover:-translate-y-[1px] cursor-pointer ${
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
      onKeyDown={(e) => {
        // Handle Enter/Space for activation (standard button behavior)
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick()
        } else {
          onKeyDown(e)
        }
      }}
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
      <button 
        type="button"
        aria-label={`Close ${name} tab`}
        className={`flex items-center p-0.5 ml-1 rounded transition-all hover:bg-white/20 ${
          active ? 'opacity-60 hover:opacity-100' : 'opacity-30 hover:opacity-80'
        }`}
        onClick={(e) => {
          e.stopPropagation()
          onClose()
        }}
      >
        <X size={14} />
      </button>
    </div>
  )
}

export default function TabBar() {
  const { activeFile, setActiveFile, openFiles, closeFile } = useIDE()
  const tabRefs = useRef<(HTMLDivElement | null)[]>([])
  
  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLDivElement>, currentIndex: number) => {
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
      className="flex items-end overflow-hidden"
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
