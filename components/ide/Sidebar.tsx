"use client"

import { useState, useCallback, KeyboardEvent } from "react"
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
      { name: 'topic-requests.py', type: 'python' },
      { name: 'sponsor-info.md', type: 'markdown' },
      { name: 'sponsors.yaml', type: 'yaml' },
      { name: 'tickets.config.js', type: 'javascript' },
    ]
  }
]

const iconMap: Record<string, { icon: typeof FileText, color: string, label: string }> = {
  markdown: { icon: FileText, color: '#4A9EFF', label: 'Markdown file' },
  python: { icon: FileCode, color: '#4ADE80', label: 'Python file' },
  javascript: { icon: FileCode, color: '#FACC15', label: 'JavaScript file' },
  yaml: { icon: Settings, color: '#A78BFA', label: 'YAML file' },
}

function FileIcon({ type }: { type: string }) {
  const config = iconMap[type] || { icon: FileText, color: '#888', label: 'File' }
  const Icon = config.icon
  return <Icon size={16} color={config.color} aria-hidden="true" />
}

function getFileTypeLabel(type: string): string {
  return iconMap[type]?.label || 'File'
}

interface FileTreeNodeProps {
  item: FileItem
  depth: number
  isFirstChild?: boolean
  isLastChild?: boolean
}

function FileTreeNode({ item, depth, isFirstChild, isLastChild }: FileTreeNodeProps) {
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

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLButtonElement>) => {
    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault()
        handleClick()
        break
      case 'ArrowRight':
        if (isFolder && !expanded) {
          e.preventDefault()
          setExpanded(true)
        }
        break
      case 'ArrowLeft':
        if (isFolder && expanded) {
          e.preventDefault()
          setExpanded(false)
        }
        break
      case 'ArrowDown':
        e.preventDefault()
        // Move focus to next visible tree item
        const nextItem = e.currentTarget.closest('[role="treeitem"]')?.nextElementSibling?.querySelector('button') ||
          e.currentTarget.closest('[role="treeitem"]')?.querySelector('[role="group"] [role="treeitem"] button')
        if (nextItem instanceof HTMLElement) {
          nextItem.focus()
        }
        break
      case 'ArrowUp':
        e.preventDefault()
        // Move focus to previous visible tree item
        const prevItem = e.currentTarget.closest('[role="treeitem"]')?.previousElementSibling?.querySelector('button')
        if (prevItem instanceof HTMLElement) {
          prevItem.focus()
        }
        break
    }
  }, [isFolder, expanded, handleClick])

  // Generate aria-label based on item type and state
  const ariaLabel = isFolder
    ? `${item.name} folder, ${expanded ? 'expanded' : 'collapsed'}, ${item.children?.length || 0} items`
    : `${item.name}, ${getFileTypeLabel(item.type)}${isActive ? ', currently open' : ''}`

  return (
    <div 
      role="treeitem"
      aria-expanded={isFolder ? expanded : undefined}
      aria-selected={isActive}
      className="animate-[slideInLeft_0.3s_ease-out_forwards]"
      style={{ animationDelay: `${depth * 0.03}s` }}
    >
      <button 
        className={`flex items-center gap-1.5 w-full text-left border-none transition-all duration-100 relative focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--accent-blue)] ${
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
        onKeyDown={handleKeyDown}
        aria-label={ariaLabel}
        tabIndex={0}
      >
        {isActive && (
          <span 
            className="absolute left-0 top-0 bottom-0 w-0.5"
            style={{ background: 'var(--accent-blue)' }}
            aria-hidden="true"
          />
        )}
        {isFolder && (
          <span className="text-[var(--text-muted)] flex items-center" aria-hidden="true">
            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </span>
        )}
        {!isFolder && <span className="w-2" aria-hidden="true" />}
        <span className="flex items-center" aria-hidden="true">
          {isFolder ? (
            expanded ? <FolderOpen size={16} color="#FACC15" /> : <Folder size={16} color="#FACC15" />
          ) : (
            <FileIcon type={item.type} />
          )}
        </span>
        <span className="whitespace-nowrap overflow-hidden text-ellipsis">{item.name}</span>
      </button>
      
      {isFolder && expanded && item.children && (
        <div role="group" aria-label={`Contents of ${item.name}`}>
          {item.children.map((child, index) => (
            <FileTreeNode 
              key={child.name} 
              item={child} 
              depth={depth + 1}
              isFirstChild={index === 0}
              isLastChild={index === item.children!.length - 1}
            />
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
      <div 
        role="tree" 
        aria-label="File explorer"
        className="flex-1 overflow-y-auto py-2 ide-scrollable"
      >
        {fileTree.map((item, index) => (
          <FileTreeNode 
            key={item.name} 
            item={item} 
            depth={0}
            isFirstChild={index === 0}
            isLastChild={index === fileTree.length - 1}
          />
        ))}
      </div>
      
      </aside>
  )
}
