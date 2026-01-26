"use client"

import React from "react"

import { useCallback, useEffect, useState } from "react"

interface ResizeHandleProps {
  onResize: (delta: number) => void
  direction: 'left' | 'right'
  currentWidth: number
  minWidth: number
  maxWidth: number
  label?: string
}

const SMALL_STEP = 10
const LARGE_STEP = 50

export default function ResizeHandle({ 
  onResize, 
  direction, 
  currentWidth,
  minWidth,
  maxWidth,
  label = "Resize panel"
}: ResizeHandleProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
    setStartX(e.clientX)
  }, [])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const step = e.shiftKey ? LARGE_STEP : SMALL_STEP
    
    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault()
        onResize(direction === 'right' ? -step : step)
        break
      case 'ArrowRight':
        e.preventDefault()
        onResize(direction === 'right' ? step : -step)
        break
      case 'Home':
        e.preventDefault()
        onResize(minWidth - currentWidth)
        break
      case 'End':
        e.preventDefault()
        onResize(maxWidth - currentWidth)
        break
    }
  }, [onResize, direction, currentWidth, minWidth, maxWidth])

  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      const delta = e.clientX - startX
      setStartX(e.clientX)
      onResize(direction === 'right' ? delta : -delta)
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, startX, onResize, direction])

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label={label}
      aria-valuenow={currentWidth}
      aria-valuemin={minWidth}
      aria-valuemax={maxWidth}
      tabIndex={0}
      className={`relative flex-shrink-0 group cursor-col-resize focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-blue)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--ide-bg)] ${isDragging ? 'z-50' : 'z-20'}`}
      style={{ width: '4px' }}
      onMouseDown={handleMouseDown}
      onKeyDown={handleKeyDown}
    >
      {/* Invisible wider hit area */}
      <div 
        className="absolute top-0 bottom-0 -left-1 -right-1"
        style={{ width: '10px' }}
      />
      {/* Visible handle */}
      <div 
        className={`absolute top-0 bottom-0 left-1/2 -translate-x-1/2 transition-all duration-150 ${
          isDragging 
            ? 'w-[3px] bg-[var(--accent-blue)]' 
            : 'w-[1px] bg-[var(--ide-border)] group-hover:w-[3px] group-hover:bg-[var(--accent-blue)]/60'
        }`}
      />
      {/* Drag indicator dots */}
      <div 
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col gap-1 transition-opacity duration-150 ${
          isDragging ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        }`}
      >
        <div className="w-1 h-1 rounded-full bg-[var(--accent-blue)]" />
        <div className="w-1 h-1 rounded-full bg-[var(--accent-blue)]" />
        <div className="w-1 h-1 rounded-full bg-[var(--accent-blue)]" />
      </div>
    </div>
  )
}
