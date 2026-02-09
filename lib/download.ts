/**
 * Triggers a file download in the browser
 */
export function downloadFile(
  content: string,
  filename: string,
  mimeType: string = 'text/calendar;charset=utf-8'
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

/**
 * Downloads an ICS file with sanitized filename
 */
export function downloadICS(icsContent: string, eventTitle: string): void {
  const filename = eventTitle
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50);
  
  downloadFile(icsContent, `${filename}.ics`);
}
