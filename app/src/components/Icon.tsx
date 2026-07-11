/** Minimal stroke icon set (24×24 viewBox, currentColor). */

const PATHS: Record<string, React.ReactNode> = {
  home: (
    <path d="M3 10.5 12 3l9 7.5M5 9.5V21h5v-6h4v6h5V9.5" />
  ),
  gift: (
    <>
      <rect x="3" y="8" width="18" height="4" rx="1" />
      <path d="M5 12v8a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-8M12 8v13M12 8s-4.5.2-5.5-2C5.7 4.2 7.6 2.6 9.3 3.5 11 4.4 12 8 12 8Zm0 0s4.5.2 5.5-2c.8-1.8-1.1-3.4-2.8-2.5C13 4.4 12 8 12 8Z" />
    </>
  ),
  grid: (
    <>
      <rect x="3" y="3" width="7.5" height="7.5" rx="2" />
      <rect x="13.5" y="3" width="7.5" height="7.5" rx="2" />
      <rect x="3" y="13.5" width="7.5" height="7.5" rx="2" />
      <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 21c.8-3.8 3.9-6 7.5-6s6.7 2.2 7.5 6" />
    </>
  ),
  bell: (
    <path d="M18 9a6 6 0 1 0-12 0c0 6-2.5 7-2.5 7h17S18 15 18 9ZM10 20a2.2 2.2 0 0 0 4 0" />
  ),
  car: (
    <>
      <path d="M4 12l1.7-4.6A2 2 0 0 1 7.6 6h8.8a2 2 0 0 1 1.9 1.4L20 12M4 12h16v5a1 1 0 0 1-1 1h-1.5a1 1 0 0 1-1-1v-.8h-9v.8a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-5Z" />
      <path d="M6.8 14.8h.01M17.2 14.8h.01" />
    </>
  ),
  chevronDown: <path d="m6 9 6 6 6-6" />,
  chevronRight: <path d="m9 6 6 6-6 6" />,
  back: <path d="M15 5l-7 7 7 7" />,
  road: (
    <>
      <path d="M4 21 9 3h6l5 18" />
      <path d="M12 6v2.5M12 11v2.5M12 16v2.5" />
    </>
  ),
  coin: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5v9M9.5 9.8c0-1 1.1-1.7 2.5-1.7s2.5.7 2.5 1.7-1 1.5-2.5 1.9-2.5.9-2.5 1.9 1.1 1.7 2.5 1.7 2.5-.7 2.5-1.7" />
    </>
  ),
  wallet: (
    <>
      <path d="M3 7.5A2.5 2.5 0 0 1 5.5 5h13A2.5 2.5 0 0 1 21 7.5v9a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 16.5v-9Z" />
      <path d="M15.5 12h3M3 9.5h18" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3 5 5.8v5.4c0 4.4 3 8 7 9.8 4-1.8 7-5.4 7-9.8V5.8L12 3Z" />
      <path d="m9 11.5 2.2 2.2L15.5 9.5" />
    </>
  ),
  tow: (
    <>
      <path d="M3 17V8l4-1 3 5h9a2 2 0 0 1 2 2v3" />
      <circle cx="7" cy="18" r="1.8" />
      <circle cx="17" cy="18" r="1.8" />
      <path d="M9 18h6M13 3l4 4M17 3v4h-4" />
    </>
  ),
  mapPin: (
    <>
      <path d="M12 21s7-5.3 7-11a7 7 0 1 0-14 0c0 5.7 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.6" />
    </>
  ),
  qr: (
    <>
      <rect x="4" y="4" width="6.5" height="6.5" rx="1" />
      <rect x="13.5" y="4" width="6.5" height="6.5" rx="1" />
      <rect x="4" y="13.5" width="6.5" height="6.5" rx="1" />
      <path d="M13.5 13.5h3v3h-3zM20 13.5v.01M20 20h-3.5v-3.5" />
    </>
  ),
  parking: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="3" />
      <path d="M9.5 17V7.5H13a2.8 2.8 0 0 1 0 5.6H9.5" />
    </>
  ),
  zap: <path d="M13 2 4.5 13.5H11L9.5 22 19 10h-6.5L13 2Z" />,
  wrench: (
    <path d="M14.7 6.3a4.5 4.5 0 0 0-6 5.7L3 17.7A2 2 0 1 0 5.8 20.5l5.7-5.7a4.5 4.5 0 0 0 5.7-6l-3.2 3.2-2.7-.7-.7-2.7 3.2-3.2Z" />
  ),
  star: (
    <path d="m12 3 2.7 5.6 6.1.8-4.5 4.3 1.1 6-5.4-2.9-5.4 2.9 1.1-6L3.2 9.4l6.1-.8L12 3Z" />
  ),
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  x: <path d="M6 6l12 12M18 6 6 18" />,
  alertCircle: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v5M12 16.2v.01" />
    </>
  ),
  hourglass: (
    <path d="M7 3h10M7 21h10M8 3c0 6 4 5.5 4 9s-4 3-4 9m8-18c0 6-4 5.5-4 9s4 3 4 9" />
  ),
  share: (
    <>
      <circle cx="6" cy="12" r="2.5" />
      <circle cx="17.5" cy="5.5" r="2.5" />
      <circle cx="17.5" cy="18.5" r="2.5" />
      <path d="m8.3 10.8 7-3.9M8.3 13.2l7 3.9" />
    </>
  ),
  phone: (
    <path d="M5.5 4h3l1.5 4-2 1.5a12 12 0 0 0 6.5 6.5L16 14l4 1.5v3a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 3.5 6.2 2 2 0 0 1 5.5 4Z" />
  ),
  coffee: (
    <>
      <path d="M5 9h11v6a5 5 0 0 1-5 5H10a5 5 0 0 1-5-5V9Z" />
      <path d="M16 10.5h1.5a2.5 2.5 0 0 1 0 5H16M8 3.5v2M11 3.5v2M14 3.5v2" />
    </>
  ),
  food: (
    <path d="M6 3v8M9 3v8M7.5 3v18M7.5 11H5a1 1 0 0 1-1-1M7.5 11H9a1 1 0 0 0 1-1M16.5 3c-2 1.5-3 4-3 7 0 2 1 3 3 3v8M16.5 3c2 1.5 3 4 3 7 0 2-1 3-3 3" />
  ),
  travel: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.5 3.8 5.6 3.8 9S14.5 18.5 12 21c-2.5-2.5-3.8-5.6-3.8-9S9.5 5.5 12 3Z" />
    </>
  ),
  ticket: (
    <>
      <path d="M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2a2 2 0 1 0 0 4v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a2 2 0 1 0 0-4V8Z" />
      <path d="M13.5 7v2M13.5 11v2M13.5 15v2" />
    </>
  ),
  sos: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5v5M12 15.8v.01" />
    </>
  ),
  parts: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3.5v2.6M12 17.9v2.6M3.5 12h2.6M17.9 12h2.6M6 6l1.8 1.8M16.2 16.2 18 18M18 6l-1.8 1.8M7.8 16.2 6 18" />
    </>
  ),
  wash: (
    <>
      <path d="M4 13l1.5-3.5A2 2 0 0 1 7.3 8.3h9.4a2 2 0 0 1 1.8 1.2L20 13M4 13h16v3.5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V13Z" />
      <path d="M7 5c.6-.8.6-1.4 0-2M12 5c.6-.8.6-1.4 0-2M17 5c.6-.8.6-1.4 0-2M6.8 15.2h.01M17.2 15.2h.01" />
    </>
  ),
  history: (
    <>
      <path d="M4 12a8 8 0 1 1 2.3 5.6M4 12l-1.5-2M4 12l2.2-1.2" />
      <path d="M12 8v4.3l3 1.7" />
    </>
  ),
  x2: (
    <path d="M5 8.5 10 15.5M10 8.5 5 15.5M13 15.5c0-3.5 5-4 5-6.5a2 2 0 0 0-2-2 2.2 2.2 0 0 0-2.2 1.6M13 15.5h5.4" />
  ),
  swap: <path d="M7 4 3.5 7.5 7 11M3.5 7.5H17M17 13l3.5 3.5L17 20M20.5 16.5H7" />,
  logout: <path d="M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3M15 8l4 4-4 4M19 12H9" />,
  lock: (
    <>
      <rect x="5" y="10.5" width="14" height="9.5" rx="2" />
      <path d="M8 10.5V7.8a4 4 0 0 1 8 0v2.7M12 14.5v2" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a13 13 0 0 1 0 18 13 13 0 0 1 0-18Z" />
    </>
  ),
  help: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9.2A2.6 2.6 0 0 1 12 7.5c1.4 0 2.5.9 2.5 2.2 0 1.8-2.5 2-2.5 3.8M12 16.8v.01" />
    </>
  ),
  doc: (
    <>
      <path d="M6 3.5h8L19 8.5v12a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-16a1 1 0 0 1 1-1Z" />
      <path d="M14 3.5v5h5M9 13h6M9 16.5h6" />
    </>
  ),
  idcard: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="8.5" cy="11" r="2" />
      <path d="M5.5 16c.5-1.5 1.6-2.3 3-2.3s2.5.8 3 2.3M14.5 9.5H19M14.5 13H19" />
    </>
  ),
};

export type IconName = keyof typeof PATHS;

export function Icon({ name, filled = false }: { name: string; filled?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={filled ? 0.5 : 1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {PATHS[name] ?? PATHS.alertCircle}
    </svg>
  );
}
