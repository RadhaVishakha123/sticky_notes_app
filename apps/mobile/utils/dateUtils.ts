/** YYYY-MM-DD from an ISO string, in local timezone (avoids UTC midnight shift) */
export function toLocalDateStr(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** YYYY-MM-DD from a Date object, in local timezone */
export function toLocalDateStrFromDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** HH:MM AM/PM from ISO string */
export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

/** "Mar 30, 2026  •  09:00 AM – 10:00 AM" or multi-day format */
export function formatDateRange(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  const sameDay = s.toDateString() === e.toDateString();
  const dateFmt = (d: Date) =>
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const timeFmt = (d: Date) =>
    d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  if (sameDay) return `${dateFmt(s)}  •  ${timeFmt(s)} – ${timeFmt(e)}`;
  return `${dateFmt(s)} ${timeFmt(s)} – ${dateFmt(e)} ${timeFmt(e)}`;
}
