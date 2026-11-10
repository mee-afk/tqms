const paths: Record<string, string> = {
  home: 'M3 11 12 3l9 8 M5 10v11h5v-7h4v7h5V10',
  queue: 'M4 6h15M4 12h15M4 18h10',
  plus: 'M12 4v16M4 12h16',
  vehicle: 'M2 6h13v10H2z M15 9h4l3 4v3h-7 M5 18a2 2 0 1 0 .1 0 M17 18a2 2 0 1 0 .1 0',
  user: 'M12 12a4 4 0 1 0-.1 0 M4 21a8 8 0 0 1 16 0',
  report: 'M5 3h14v18H5z M8 16v-4m4 4V7m4 9v-6',
  qr: 'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M15 14h3v4h3v3h-6z',
  menu: 'M3 4h18v16H3z M9 4v16',
  down: 'm6 9 6 6 6-6',
  eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z M14 12a2 2 0 1 1-4 0 2 2 0 1 1 4 0',
  edit: 'm4 16 12-12 4 4L8 20l-5 1z',
  del: 'M4 6h16M9 6V3h6v3M6 6l1 15h10l1-15',
  receipt: 'M5 3h14v18l-3-2-4 2-4-2-3 2z M8 8h8m-8 4h8',
  key: 'M14 10a5 5 0 1 0-4 4l-6 6-2-2 7-7',
  logout: 'M10 3H4v18h6M11 12h10m-5-5 5 5-5 5'
};
export function Icon({
  name
}: {
  name: string;
}) {
  return <svg
    width="19"
    height="19"
    viewBox="0 0 24 24"
    aria-hidden="true"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d={paths[name] || paths.report} />
  </svg>;
}
