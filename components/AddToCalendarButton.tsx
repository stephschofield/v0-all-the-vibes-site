'use client';

import { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown, Download, ExternalLink } from 'lucide-react';
import { CalendarEvent } from '@/types/event';
import { useCalendarDownload } from '@/hooks/useCalendarDownload';

interface AddToCalendarButtonProps {
  event: CalendarEvent;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export function AddToCalendarButton({ 
  event, 
  variant = 'default',
  size = 'md' 
}: AddToCalendarButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const { downloadEvent, getGoogleCalendarUrl, getOutlookWebUrl } = useCalendarDownload();
  
  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // Close on escape key
  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setIsOpen(false);
    }
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);
  
  const handleDownloadICS = () => {
    downloadEvent(event);
    setIsOpen(false);
  };
  
  const handleGoogleCalendar = () => {
    window.open(getGoogleCalendarUrl(event), '_blank', 'noopener,noreferrer');
    setIsOpen(false);
  };
  
  const handleOutlookWeb = () => {
    window.open(getOutlookWebUrl(event), '_blank', 'noopener,noreferrer');
    setIsOpen(false);
  };
  
  // Style configurations matching IDE theme
  const sizeStyles = {
    sm: 'px-2.5 py-1 text-xs gap-1.5',
    md: 'px-3 py-1.5 text-sm gap-2',
    lg: 'px-4 py-2 text-base gap-2',
  };
  
  const variantStyles = {
    default: 'bg-[var(--accent-cyan)] text-black hover:brightness-110',
    outline: 'border border-[var(--accent-cyan)] text-[var(--accent-cyan)] hover:bg-[var(--accent-cyan)]/10',
    ghost: 'text-[var(--text-muted)] hover:bg-white/5 hover:text-[var(--text-primary)]',
  };
  
  const iconSize = size === 'sm' ? 12 : size === 'lg' ? 18 : 14;
  
  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        className={`
          inline-flex items-center rounded-md font-medium
          transition-all duration-150
          ${sizeStyles[size]}
          ${variantStyles[variant]}
        `}
        style={{ fontFamily: 'var(--font-display)' }}
      >
        <Calendar size={iconSize} />
        <span>Add to Calendar</span>
        <ChevronDown 
          size={12} 
          className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      
      {/* Dropdown Menu */}
      {isOpen && (
        <div 
          role="menu"
          className="
            absolute right-0 top-full mt-2 w-56 z-50
            border rounded-lg
            shadow-xl shadow-black/30
            overflow-hidden
          "
          style={{
            background: 'var(--ide-sidebar-bg)',
            borderColor: 'var(--ide-border)',
          }}
        >
          {/* Download .ics Option */}
          <button
            role="menuitem"
            onClick={handleDownloadICS}
            className="
              w-full flex items-center gap-3 px-3 py-2.5
              text-left hover:bg-white/5
              transition-colors border-b
            "
            style={{ 
              color: 'var(--text-secondary)',
              borderColor: 'var(--ide-border)',
              fontFamily: 'var(--font-display)',
            }}
          >
            <Download size={16} style={{ color: 'var(--accent-cyan)' }} className="flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                Download .ics file
              </div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Works with any calendar app
              </div>
            </div>
          </button>
          
          {/* Google Calendar Option */}
          <button
            role="menuitem"
            onClick={handleGoogleCalendar}
            className="
              w-full flex items-center gap-3 px-3 py-2.5
              text-left hover:bg-white/5
              transition-colors
            "
            style={{ 
              color: 'var(--text-secondary)',
              fontFamily: 'var(--font-display)',
            }}
          >
            <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                Google Calendar
              </div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Opens in new tab
              </div>
            </div>
            <ExternalLink size={12} style={{ color: 'var(--text-muted)' }} />
          </button>
          
          {/* Outlook Option */}
          <button
            role="menuitem"
            onClick={handleOutlookWeb}
            className="
              w-full flex items-center gap-3 px-3 py-2.5
              text-left hover:bg-white/5
              transition-colors
            "
            style={{ 
              color: 'var(--text-secondary)',
              fontFamily: 'var(--font-display)',
            }}
          >
            <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
              <path fill="#0078D4" d="M24 7.387v10.478c0 .23-.08.424-.238.576-.158.154-.352.23-.58.23h-8.547v-6.959l1.6 1.229c.102.086.221.127.357.127.136 0 .255-.041.357-.127l6.812-5.238c.079-.063.152-.076.222-.04.069.038.103.104.103.196v-.004l-.086.532zM15.065 7.387L24 14.053V7.675c0-.228-.077-.422-.233-.58-.154-.158-.35-.237-.578-.237h-8.124zM0 6.334v11.332C0 18.403.597 19 1.334 19h8.332c.737 0 1.334-.597 1.334-1.334V6.334C11 5.597 10.403 5 9.666 5H1.334C.597 5 0 5.597 0 6.334z"/>
            </svg>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                Outlook
              </div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Opens in new tab
              </div>
            </div>
            <ExternalLink size={12} style={{ color: 'var(--text-muted)' }} />
          </button>
          
          {/* Helper Text */}
          <div 
            className="px-3 py-2 border-t"
            style={{ 
              background: 'rgba(255, 255, 255, 0.02)',
              borderColor: 'var(--ide-border)',
            }}
          >
            <p 
              className="text-xs"
              style={{ 
                color: 'var(--text-muted)',
                fontFamily: 'var(--font-display)',
              }}
            >
              💡 For Apple Calendar, download the .ics file
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
