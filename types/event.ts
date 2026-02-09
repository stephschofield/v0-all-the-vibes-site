export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  location?: string;
  url?: string;
  startDate: Date;
  endDate: Date;
  isAllDay?: boolean;
  organizer?: {
    name: string;
    email: string;
  };
  reminder?: number; // minutes before event
}
