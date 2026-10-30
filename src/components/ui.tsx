import type { CSSProperties, ReactNode } from 'react';

export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  disabled,
  type = 'button',
}: {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'soft' | 'ghost' | 'danger';
  icon?: ReactNode;
  disabled?: boolean;
  type?: 'button' | 'submit';
}) {
  return (
    <button className={`btn ${variant}`} onClick={onPress} disabled={disabled} type={type}>
      {icon}
      {label}
    </button>
  );
}

export function Chip({
  label,
  on,
  onPress,
}: {
  label: string;
  on?: boolean;
  onPress?: () => void;
}) {
  return (
    <button type="button" className={`chip ${on ? 'on' : ''}`} onClick={onPress}>
      {label}
    </button>
  );
}

export function SectionLabel({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div className="label" style={{ marginBottom: 8, ...style }}>
      {children}
    </div>
  );
}

export function Field({
  value,
  onChange,
  placeholder,
  multiline,
  type = 'text',
  autoFocus,
  minHeight,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  type?: string;
  autoFocus?: boolean;
  minHeight?: number;
}) {
  if (multiline) {
    return (
      <textarea
        className="field"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        style={{ minHeight: minHeight ?? 96 }}
      />
    );
  }
  return (
    <input
      className="field"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      type={type}
      autoFocus={autoFocus}
    />
  );
}

/** 0-10 scale with large tap targets, 6 per row. */
export function LevelScale({
  value,
  onChange,
  low = '0',
  high = '10',
  tone,
}: {
  value: number | null;
  onChange: (n: number) => void;
  low?: string;
  high?: string;
  tone?: (n: number) => string;
}) {
  return (
    <div>
      <div className="level-scale">
        {Array.from({ length: 11 }, (_, n) => {
          const on = value === n;
          return (
            <button
              key={n}
              type="button"
              className={`lv ${on ? 'on' : ''}`}
              onClick={() => onChange(n)}
              style={on && tone ? { borderColor: tone(n), color: tone(n), background: 'rgba(95,227,200,0.12)' } : undefined}
              aria-label={`${n} of 10`}
            >
              {n}
            </button>
          );
        })}
      </div>
      <div className="row" style={{ justifyContent: 'space-between', marginTop: 6 }}>
        <span className="tiny faint">{low}</span>
        <span className="tiny faint">{high}</span>
      </div>
    </div>
  );
}

export function Modal({
  visible,
  onClose,
  title,
  subtitle,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  if (!visible) return null;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-grab" />
        <div className="row" style={{ marginBottom: 16 }}>
          <div className="grow">
            <h2 className="h2">{title}</h2>
            {subtitle ? <p className="small dim" style={{ marginTop: 3 }}>{subtitle}</p> : null}
          </div>
          <button type="button" onClick={onClose} aria-label="Close"
            style={{ width: 36, height: 36, borderRadius: 18, background: 'var(--surface-hi)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="faint" style={{ fontSize: 18, lineHeight: 1 }}>×</span>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Stat({ label, value, foot, tint }: { label: string; value: string; foot?: string; tint?: string }) {
  return (
    <div className="card" style={{ padding: 14 }}>
      <div className="label" style={{ fontSize: 10 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 700, marginTop: 6, color: tint ?? 'var(--text)' }}>{value}</div>
      {foot ? <div className="tiny faint" style={{ marginTop: 2 }}>{foot}</div> : null}
    </div>
  );
}
