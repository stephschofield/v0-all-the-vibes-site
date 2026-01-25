"use client"

import { useState } from "react"
import { 
  ChevronRight, ChevronDown, Folder, FolderOpen,
  FileText, FileCode, Settings 
} from "lucide-react"
import { useIDE } from "./IDEContext"

interface FileItem {
  name: string
  type: 'folder' | 'markdown' | 'python' | 'javascript' | 'yaml'
  expanded?: boolean
  children?: FileItem[]
}

const fileTree: FileItem[] = [
  {
    name: 'ALL-THE-VIBES',
    type: 'folder',
    expanded: true,
    children: [
      { name: 'welcome.md', type: 'markdown' },
      { name: 'upcoming-events.py', type: 'python' },
      { name: 'schedule.py', type: 'python' },
      { name: 'vibe-a-thon.py', type: 'python' },
      { name: 'speaker-signup.md', type: 'markdown' },
      { name: 'sponsor-info.md', type: 'markdown' },
      { name: 'sponsors.yaml', type: 'yaml' },
      { name: 'tickets.config.js', type: 'javascript' },
    ]
  }
]

const iconMap: Record<string, { icon: typeof FileText, color: string }> = {
  markdown: { icon: FileText, color: '#4A9EFF' },
  python: { icon: FileCode, color: '#4ADE80' },
  javascript: { icon: FileCode, color: '#FACC15' },
  yaml: { icon: Settings, color: '#A78BFA' },
}

function FileIcon({ type }: { type: string }) {
  const config = iconMap[type] || { icon: FileText, color: '#888' }
  const Icon = config.icon
  return <Icon size={16} color={config.color} />
}

function FileTreeNode({ item, depth }: { item: FileItem, depth: number }) {
  const [expanded, setExpanded] = useState(item.expanded ?? false)
  const { activeFile, setActiveFile } = useIDE()
  const isFolder = item.type === 'folder'
  const isActive = !isFolder && item.name === activeFile

  const handleClick = () => {
    if (isFolder) {
      setExpanded(!expanded)
    } else {
      setActiveFile(item.name)
    }
  }

  return (
    <div 
      className="animate-[slideInLeft_0.3s_ease-out_forwards]"
      style={{ animationDelay: `${depth * 0.03}s` }}
    >
      <button 
        className={`flex items-center gap-1.5 w-full text-left border-none transition-all duration-100 relative ${
          isActive 
            ? 'bg-[rgba(74,158,255,0.15)] text-[var(--text-bright)]' 
            : 'bg-transparent text-[var(--text-secondary)] hover:bg-white/[0.05] hover:text-[var(--text-primary)]'
        }`}
        style={{ 
          paddingLeft: `${4 + depth * 12}px`,
          paddingRight: '4px',
          paddingTop: '4px',
          paddingBottom: '4px',
          fontFamily: 'var(--font-display)',
          fontSize: '12px',
          fontWeight: 400,
        }}
        onClick={handleClick}
      >
        {isActive && (
          <span 
            className="absolute left-0 top-0 bottom-0 w-0.5"
            style={{ background: 'var(--accent-blue)' }}
          />
        )}
        {isFolder && (
          <span className="text-[var(--text-muted)] flex items-center">
            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </span>
        )}
        {!isFolder && <span className="w-2" />}
        <span className="flex items-center">
          {isFolder ? (
            expanded ? <FolderOpen size={16} color="#FACC15" /> : <Folder size={16} color="#FACC15" />
          ) : (
            <FileIcon type={item.type} />
          )}
        </span>
        <span className="whitespace-nowrap overflow-hidden text-ellipsis">{item.name}</span>
      </button>
      
      {isFolder && expanded && item.children && (
        <div>
          {item.children.map(child => (
            <FileTreeNode key={child.name} item={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  )
}

interface SidebarProps {
  dynamicWidth?: number
}

export default function Sidebar({ dynamicWidth }: SidebarProps) {
  return (
    <aside 
      className="flex flex-col relative w-full h-full"
      style={{
        background: 'var(--ide-sidebar)',
      }}
    >
      {/* Sidebar Header */}
      <div 
        className="h-9 px-4 flex items-center"
        style={{ borderBottom: '1px solid var(--ide-border)' }}
      >
        <span 
          className="text-[11px] font-semibold tracking-[0.08em] uppercase"
          style={{
            fontFamily: 'var(--font-display)',
            color: 'var(--text-muted)',
          }}
        >
          Explorer
        </span>
      </div>
      
      {/* File Tree */}
      <div className="flex-1 overflow-y-auto py-2 ide-scrollable">
        {fileTree.map(item => (
          <FileTreeNode key={item.name} item={item} depth={0} />
        ))}
      </div>
      
      </aside>
  )
}
