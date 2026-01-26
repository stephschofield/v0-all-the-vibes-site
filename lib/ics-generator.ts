import { CalendarEvent } from '@/types/event';

/**
 * Formats a Date object to ICS datetime format
 * Returns: YYYYMMDDTHHMMSSZ (UTC) or YYYYMMDD (all-day)
 */
function formatDateToICS(date: Date, allDay: boolean = false): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  
  if (allDay) {
    return `${year}${month}${day}`;
  }
  
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const seconds = String(date.getUTCSeconds()).padStart(2, '0');
  
  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

/**
 * Escapes special characters per ICS spec
 * Must escape: backslash, semicolon, comma, newlines
 */
function escapeICSText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

/**
 * Folds long lines per ICS spec (max 75 characters)
 */
function foldLine(line: string): string {
  const maxLength = 75;
  if (line.length <= maxLength) return line;
  
  const lines: string[] = [];
  let remaining = line;
  
  while (remaining.length > maxLength) {
    lines.push(remaining.substring(0, maxLength));
    remaining = ' ' + remaining.substring(maxLength);
  }
  lines.push(remaining);
  
  return lines.join('\r\n');
}

/**
 * Generates a unique event ID
 */
function generateUID(eventId: string, domain: string = 'allthevibes.dev'): string {
  const timestamp = Date.now();
  return `${eventId}-${timestamp}@${domain}`;
}

/**
 * Generates ICS file content for a single calendar event
 */
export function generateICS(event: CalendarEvent): string {
  const now = new Date();
  const uid = generateUID(event.id);
  
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//All The Vibes Community//Events//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:All The Vibes Events',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${formatDateToICS(now)}`,
  ];
  
  // Handle all-day vs timed events
  if (event.isAllDay) {
    lines.push(`DTSTART;VALUE=DATE:${formatDateToICS(event.startDate, true)}`);
    lines.push(`DTEND;VALUE=DATE:${formatDateToICS(event.endDate, true)}`);
  } else {
    lines.push(`DTSTART:${formatDateToICS(event.startDate)}`);
    lines.push(`DTEND:${formatDateToICS(event.endDate)}`);
  }
  
  // Required: Summary (title)
  lines.push(foldLine(`SUMMARY:${escapeICSText(event.title)}`));
  
  // Optional fields
  if (event.description) {
    lines.push(foldLine(`DESCRIPTION:${escapeICSText(event.description)}`));
  }
  
  if (event.location) {
    lines.push(foldLine(`LOCATION:${escapeICSText(event.location)}`));
  }
  
  if (event.url) {
    lines.push(`URL:${event.url}`);
  }
  
  if (event.organizer) {
    lines.push(
      `ORGANIZER;CN=${escapeICSText(event.organizer.name)}:mailto:${event.organizer.email}`
    );
  }
  
  // Add reminder if specified
  if (event.reminder && event.reminder > 0) {
    lines.push('BEGIN:VALARM');
    lines.push('ACTION:DISPLAY');
    lines.push(`DESCRIPTION:Reminder: ${escapeICSText(event.title)}`);
    lines.push(`TRIGGER:-PT${event.reminder}M`);
    lines.push('END:VALARM');
  }
  
  lines.push('STATUS:CONFIRMED');
  lines.push('SEQUENCE:0');
  lines.push('END:VEVENT');
  lines.push('END:VCALENDAR');
  
  // ICS spec requires CRLF line endings
  return lines.join('\r\n');
}
