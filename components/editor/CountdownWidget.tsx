"use client"

import { useState, useEffect } from "react"

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
}

export default function CountdownWidget() {
  const [time, setTime] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 })

  useEffect(() => {
    const target = new Date('2026-02-10T10:00:00-08:00') // Feb 10, 2026 at 10am Pacific
    
    const updateTime = () => {
      const now = new Date()
      const diff = target.getTime() - now.getTime()
      
      if (diff > 0) {
        setTime({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((diff / (1000 * 60)) % 60),
          seconds: Math.floor((diff / 1000) % 60),
        })
      }
    }
    
    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div 
      className="my-4 p-6 md:p-8 rounded-xl"
      style={{
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid var(--ide-border)',
      }}
    >
      <h2 
        className="text-xl md:text-2xl font-bold text-center mb-6"
        style={{ 
          fontFamily: 'var(--font-display)',
          color: 'var(--text-primary)',
        }}
      >
        All The Vibes @ Tech Connect
      </h2>
      <p 
        className="text-sm text-center mb-6"
        style={{ 
          fontFamily: 'var(--font-mono)',
          color: 'var(--text-muted)',
        }}
      >
        February 10, 2026 at 10:00 AM PT
      </p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 text-center">
        <CountdownUnit value={time.days} label="days" color="var(--accent-cyan)" />
        <CountdownUnit value={time.hours} label="hours" color="var(--accent-pink)" />
        <CountdownUnit value={time.minutes} label="minutes" color="var(--accent-yellow)" />
        <CountdownUnit value={time.seconds} label="seconds" color="var(--accent-green)" />
      </div>
    </div>
  )
}

function CountdownUnit({ value, label, color }: { value: number, label: string, color: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span 
        className="text-3xl sm:text-4xl md:text-5xl font-bold leading-none tracking-tight"
        style={{ 
          fontFamily: 'var(--font-display)',
          color,
          letterSpacing: '-0.02em',
        }}
      >
        {value}
      </span>
      <span 
        className="text-xs font-medium lowercase"
        style={{
          fontFamily: 'var(--font-display)',
          color: 'var(--text-muted)',
        }}
      >
        {label}
      </span>
    </div>
  )
}
