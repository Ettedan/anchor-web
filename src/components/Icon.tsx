export type IconName =
  | 'today'
  | 'book'
  | 'chart'
  | 'gear'
  | 'close'
  | 'check'
  | 'chevron'
  | 'phone'
  | 'trash'
  | 'run'
  | 'meditate'
  | 'moon'
  | 'coffee'
  | 'mood'
  | 'dizzy'
  | 'weather'
  | 'download'
  | 'upload'
  | 'plus'
  | 'alert'
  | 'gauge';

export function Icon({ name, size = 22, color = '#E9EFFB', strokeWidth = 1.7 }: {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}) {
  const body = () => {
    switch (name) {
      case 'today': return <><circle cx="12" cy="9.2" r="3.9" /><path d="M4.5 16.6h15M8 20.2h8" /></>;
      case 'book': return <><path d="M5 4.5h9a3 3 0 013 3v12.5" /><path d="M5 4.5a2 2 0 00-2 2v13h11a2 2 0 002-2V6.5a2 2 0 00-2-2z" /><path d="M8.5 9.5h4.5M8.5 13h4.5" /></>;
      case 'chart': return <><path d="M5 19V5M5 19h14" /><path d="M9 19v-6M13 19V9M17 19v-3" /></>;
      case 'gear': return <><circle cx="12" cy="12" r="3.2" /><path d="M12 2.8v2.4M12 18.8v2.4M4.9 4.9l1.7 1.7M17.4 17.4l1.7 1.7M2.8 12h2.4M18.8 12h2.4M4.9 19.1l1.7-1.7M17.4 6.6l1.7-1.7" /></>;
      case 'close': return <><path d="M6.4 6.4l11.2 11.2M17.6 6.4L6.4 17.6" /></>;
      case 'check': return <path d="M4.8 12.6l4.7 4.6L19.4 7" />;
      case 'chevron': return <path d="M9.2 5.6L15.6 12l-6.4 6.4" />;
      case 'phone': return <path d="M6.2 3.8h3l1.5 3.7-1.9 1.4a11 11 0 004.3 4.3l1.4-1.9 3.7 1.5v3a2 2 0 01-2.2 2A15.4 15.4 0 014.2 6a2 2 0 012-2.2z" />;
      case 'trash': return <><path d="M4.8 7h14.4M9.4 7V5.2A1.4 1.4 0 0110.8 3.8h2.4a1.4 1.4 0 011.4 1.4V7M6.6 7l.9 12a1.6 1.6 0 001.6 1.5h5.8a1.6 1.6 0 001.6-1.5l.9-12" /></>;
      case 'run': return <><circle cx="14.5" cy="4.5" r="1.8" /><path d="M12.5 8.5L9 13l-2.5-.8M9 13l-1 7M9 13l4-1 2.5 3.5M14.5 6.5L13 8.5l4 4.5 3.5-.5" /></>;
      case 'meditate': return <><circle cx="12" cy="6.5" r="2.4" /><path d="M5 11a7 7 0 0014 0" /><path d="M8 13.5c0 2.2 1.8 3.5 4 3.5s4-1.3 4-3.5M12 17v4.5M9.5 21.5h5" /></>;
      case 'moon': return <path d="M20.4 14.2A8.5 8.5 0 019.8 3.6a8.5 8.5 0 1010.6 10.6z" />;
      case 'coffee': return <><path d="M4 9h12v5.5A3.5 3.5 0 0112.5 18H7.5A3.5 3.5 0 014 14.5z" /><path d="M16 10h1.6a2.2 2.2 0 010 4.4H16M7.5 6.5c0-1 .5-1 .5-2s.5-1 .5-2M11.5 6.5c0-1 .5-1 .5-2s.5-1 .5-2" /></>;
      case 'mood': return <><circle cx="12" cy="12" r="8.6" /><path d="M8.8 13.2a3.6 3.6 0 006.4 0M9.2 9.6h.01M14.8 9.6h.01" /></>;
      case 'dizzy': return <><circle cx="12" cy="12" r="8.6" /><path d="M12 4.5c1.5 2.6 1.5 12.4 0 15M4.5 12c2.6-1.5 12.4-1.5 15 0" /><circle cx="12" cy="12" r="2" /></>;
      case 'weather': return <><path d="M7 17.5a4 4 0 01-.6-7.95 5.5 5.5 0 0110.7-1.1A3.8 3.8 0 0118 17.5z" /></>;
      case 'download': return <><path d="M12 3.5v11M7.5 10.5L12 15l4.5-4.5" /><path d="M4.5 19.5h15" /></>;
      case 'upload': return <><path d="M12 15V4M7.5 8.5L12 4l4.5 4.5" /><path d="M4.5 19.5h15" /></>;
      case 'plus': return <><path d="M12 5.5v13M5.5 12h13" /></>;
      case 'alert': return <><path d="M12 3.6l9 15.8H3z" /><path d="M12 10v3.5M12 16.8h.01" /></>;
      case 'gauge': return <><path d="M5 19a8 8 0 1114 0z" /><path d="M12 19l4.5-6.5" /><circle cx="12" cy="19" r="1.4" /></>;
      default: return null;
    }
  };

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      {body()}
    </svg>
  );
}
