const I = ({ d, size = 18, ...p }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}>{d}</svg>
)
export const Plus = (p) => <I {...p} d={<path d="M12 5v14M5 12h14" />} />
export const Minus = (p) => <I {...p} d={<path d="M5 12h14" />} />
export const Close = (p) => <I {...p} d={<path d="M6 6l12 12M18 6L6 18" />} />
export const Edit = (p) => <I {...p} d={<path d="M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4" />} />
export const Trash = (p) => <I {...p} d={<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" />} />
export const Up = (p) => <I {...p} d={<path d="M12 19V5M6 11l6-6 6 6" />} />
export const Down = (p) => <I {...p} d={<path d="M12 5v14M6 13l6 6 6-6" />} />
export const Eye = (p) => <I {...p} d={<><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></>} />
export const EyeOff = (p) => <I {...p} d={<path d="M3 3l18 18M10.6 5.1A10 10 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4.1M6.6 6.6A17 17 0 0 0 2 12s3.5 7 10 7a9.7 9.7 0 0 0 5.4-1.6M9.9 9.9a3 3 0 0 0 4.2 4.2" />} />
export const Camera = (p) => <I {...p} d={<><path d="M4 8h3l2-3h6l2 3h3v11H4z" /><circle cx="12" cy="13" r="3.5" /></>} />
export const Upload = (p) => <I {...p} d={<path d="M12 16V4M7 9l5-5 5 5M4 16v4h16v-4" />} />
export const External = (p) => <I {...p} d={<path d="M14 4h6v6M20 4l-9 9M18 14v6H4V6h6" />} />
export const Chevron = (p) => <I {...p} d={<path d="M6 9l6 6 6-6" />} />
export const Check = (p) => <I {...p} d={<path d="M5 12.5l4.5 4.5L19 7" />} />
export const Logout = (p) => <I {...p} d={<path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10" />} />
export const QrIcon = (p) => <I {...p} d={<path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2h-2zM18 14h2M14 18h2v2M18 18h2v2" />} />
export const ImageIcon = (p) => <I {...p} d={<><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="9" cy="10" r="2" /><path d="M21 16l-5-5-9 9" /></>} />
export const Search = (p) => <I {...p} d={<><circle cx="11" cy="11" r="6.5" /><path d="M16 16l4 4" /></>} />
export const Bell = (p) => <I {...p} d={<path d="M6 16V11a6 6 0 1 1 12 0v5l2 2H4zM10 20a2 2 0 0 0 4 0" />} />
export const Store = (p) => <I {...p} d={<path d="M4 9l1.5-5h13L20 9M4 9v11h16V9M4 9h16M9 20v-6h6v6" />} />
export const Palette = (p) => <I {...p} d={<><path d="M12 3a9 9 0 1 0 0 18c1.5 0 2-1 2-2s-1-1.5-1-2.5 1-1.5 2-1.5h2a4 4 0 0 0 4-4c0-4.4-4-8-9-8z" /><circle cx="7.5" cy="11" r="1" /><circle cx="10.5" cy="7" r="1" /><circle cx="15" cy="7.5" r="1" /></>} />
export const Mail = (p) => <I {...p} d={<><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></>} />
export const Swap = (p) => <I {...p} d={<path d="M7 4L3 8l4 4M3 8h14M17 20l4-4-4-4M21 16H7" />} />
export const WhatsApp = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.2 14.2c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.1-4.5-3.9-4.7-4.1-.1-.2-1.1-1.5-1.1-2.9s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.3 0 .5l-.3.5-.4.4c-.1.1-.3.3-.1.6.2.3.7 1.2 1.6 1.9 1.1 1 2 1.3 2.3 1.4.3.1.5.1.6-.1l.9-1c.2-.3.4-.2.6-.1l1.9.9c.3.1.5.2.5.3.1.2.1.7-.1 1.3z" />
  </svg>
)
