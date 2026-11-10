export const dateText = (s: string) => new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Kathmandu',
  day: '2-digit',
  month: 'short',
  year: 'numeric'
}).format(new Date(s));
export const dayKey = (s: string) => new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'Asia/Kathmandu'
}).format(new Date(s));
export const money = (n: number) => 'Rs. ' + n.toLocaleString('en-IN');
