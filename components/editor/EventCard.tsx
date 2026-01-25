"use client"

import { useState, useEffect } from "react"
import { Calendar, Clock, MapPin, Users, Repeat } from "lucide-react"

interface EventCardProps {
  title: string
  date: string
  time: string
  timezone: string
  location?: string
  description?: string
  accentColor: string
  isRecurring?: boolean
  recurringPattern?: string
  targetDate?: Date
  showCountdown?: boolean
}

export default function EventCard({
  title,
  date,
  time,
  timezone,
  location,
  description,
  accentColor,
  isRecurring = false,
  recurringPattern,
  targetDate,
  showCountdown = false,
}: EventCardProps) {
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })

  useEffect(() => {
    if (!showCountdown || !targetDate) return

    const updateCountdown = () => {
      const now = new Date()
      const diff = targetDate.getTime() - now.getTime()

      if (diff > 0) {
        setCountdown({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((diff / (1000 * 60)) % 60),
          seconds: Math.floor((diff / 1000) % 60),
        })
      }
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)
    return () => clearInterval(interval)
  }, [showCountdown, targetDate])

  // Calculate next occurrence for recurring events
  const getNextOccurrence = () => {
    if (!isRecurring) return date
    return date // For now, just return the date string
  }

  return (
    <div 
      className="p-5 rounded-xl transition-all duration-200 hover:scale-[1.01]"
      style={{
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid var(--ide-border)',
        borderLeft: `3px solid ${accentColor}`,
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            {isRecurring && (
              <span 
                className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
                style={{
                  background: `${accentColor}20`,
                  color: accentColor,
                  fontFamily: 'var(--font-display)',
                }}
              >
                <Repeat size={10} />
                Recurring
              </span>
            )}
            {showCountdown && (
              <span 
                className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
                style={{
                  background: `${accentColor}20`,
                  color: accentColor,
                  fontFamily: 'var(--font-display)',
                }}
              >
                Featured
              </span>
            )}
          </div>
          <h3 
            className="text-lg font-bold mb-1"
            style={{ 
              fontFamily: 'var(--font-display)',
              color: 'var(--text-primary)',
            }}
          >
            {title}
          </h3>
          {description && (
            <p 
              className="text-sm"
              style={{ 
                color: 'var(--text-muted)',
                fontFamily: 'var(--font-display)',
              }}
            >
              {description}
            </p>
          )}
        </div>
      </div>

      {/* Event Details */}
      <div className="flex flex-wrap gap-4 mb-4">
        <div className="flex items-center gap-2">
          <Calendar size={14} style={{ color: accentColor }} />
          <span 
            className="text-sm"
            style={{ 
              color: 'var(--text-secondary)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            {isRecurring ? recurringPattern : getNextOccurrence()}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Clock size={14} style={{ color: accentColor }} />
          <span 
            className="text-sm"
            style={{ 
              color: 'var(--text-secondary)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            {time} {timezone}
          </span>
        </div>
        {location && (
          <div className="flex items-center gap-2">
            <MapPin size={14} style={{ color: accentColor }} />
            <span 
              className="text-sm"
              style={{ 
                color: 'var(--text-secondary)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              {location}
            </span>
          </div>
        )}
      </div>

      {/* Countdown (only for featured events) */}
      {showCountdown && targetDate && (
        <div 
          className="grid grid-cols-4 gap-3 pt-4"
          style={{ borderTop: '1px solid var(--ide-border)' }}
        >
          <CountdownUnit value={countdown.days} label="days" color={accentColor} />
          <CountdownUnit value={countdown.hours} label="hours" color={accentColor} />
          <CountdownUnit value={countdown.minutes} label="mins" color={accentColor} />
          <CountdownUnit value={countdown.seconds} label="secs" color={accentColor} />
        </div>
      )}
    </div>
  )
}

function CountdownUnit({ value, label, color }: { value: number, label: string, color: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span 
        className="text-2xl font-bold leading-none"
        style={{ 
          fontFamily: 'var(--font-display)',
          color,
        }}
      >
        {value}
      </span>
      <span 
        className="text-xs"
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
