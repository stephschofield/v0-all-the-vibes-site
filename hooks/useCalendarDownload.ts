'use client';

import { useCallback } from 'react';
import { CalendarEvent } from '@/types/event';
import { generateICS } from '@/lib/ics-generator';
import { downloadICS } from '@/lib/download';

export function useCalendarDownload() {
  /**
   * Downloads event as .ics file
   */
  const downloadEvent = useCallback((event: CalendarEvent) => {
    const icsContent = generateICS(event);
    downloadICS(icsContent, event.title);
  }, []);
  
  /**
   * Generates Google Calendar URL
   */
  const getGoogleCalendarUrl = useCallback((event: CalendarEvent): string => {
    const formatGoogleDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    };
    
    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: event.title,
      dates: `${formatGoogleDate(event.startDate)}/${formatGoogleDate(event.endDate)}`,
      details: event.description || '',
      location: event.location || '',
    });
    
    if (event.url) {
      params.append('sprop', `website:${event.url}`);
    }
    
    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  }, []);
  
  /**
   * Generates Outlook Web URL
   */
  const getOutlookWebUrl = useCallback((event: CalendarEvent): string => {
    const params = new URLSearchParams({
      path: '/calendar/action/compose',
      rru: 'addevent',
      subject: event.title,
      startdt: event.startDate.toISOString(),
      enddt: event.endDate.toISOString(),
      body: event.description || '',
      location: event.location || '',
    });
    
    return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
  }, []);
  
  return {
    downloadEvent,
    getGoogleCalendarUrl,
    getOutlookWebUrl,
  };
}
