import { useState, type CSSProperties, type ReactNode } from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

/** Controlled text input in the app's style. */
export function TextInput({ label, value, onChange, type = 'text', hint, error, placeholder, autoComplete, inputMode, autoFocus, maxLength, style }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; hint?: ReactNode; error?: string | null;
  placeholder?: string; autoComplete?: string; inputMode?: 'text' | 'email' | 'numeric' | 'tel'; autoFocus?: boolean; maxLength?: number; style?: CSSProperties;
}) {
  return (
    <label className="stack" style={{ gap: 0, ...style }}>
      <span className="field-label">{label}</span>
      <input
        className="input" type={type} value={value} placeholder={placeholder} autoComplete={autoComplete} inputMode={inputMode}
        autoFocus={autoFocus} maxLength={maxLength} onChange={(e) => onChange(e.target.value)}
        aria-invalid={Boolean(error)} style={error ? { borderColor: 'var(--u-red)' } : undefined}
      />
      {error ? <span className="t-12" style={{ marginTop: 6, color: 'var(--u-red)' }}>{error}</span>
        : hint ? <span className="t-12 faint" style={{ marginTop: 6 }}>{hint}</span> : null}
    </label>
  );
}

export function SelectInput<T extends string>({ label, value, onChange, options, placeholder }: {
  label: string; value: T | ''; onChange: (v: T) => void; options: { value: T; label: string }[]; placeholder?: string;
}) {
  return (
    <label className="stack" style={{ gap: 0 }}>
      <span className="field-label">{label}</span>
      <select className="input" value={value} onChange={(e) => onChange(e.target.value as T)}
        style={{ appearance: 'none', backgroundImage: 'linear-gradient(45deg,transparent 50%,#0a0a0a 50%),linear-gradient(135deg,#0a0a0a 50%,transparent 50%)', backgroundPosition: 'calc(100% - 22px) 24px, calc(100% - 16px) 24px', backgroundSize: '6px 6px', backgroundRepeat: 'no-repeat' }}>
        {placeholder && <option value="" disabled>{placeholder}</option>}
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}

/** Red or green note under a form. */
export function Note({ tone = 'bad', children }: { tone?: 'bad' | 'good' | 'warn'; children: ReactNode }) {
  const c = { bad: ['var(--u-bad-tint)', 'var(--u-red)'], good: ['var(--u-good-tint)', 'var(--u-good)'], warn: ['var(--u-warn-tint)', 'var(--u-warn-ink)'] }[tone];
  return (
    <div role={tone === 'bad' ? 'alert' : 'status'} className="row t-13 w-5" style={{ gap: 8, padding: '10px 12px', borderRadius: 12, background: c[0], color: c[1], alignItems: 'flex-start', lineHeight: 1.45 }}>
      {tone === 'good' ? <CheckCircle2 size={16} style={{ flexShrink: 0, marginTop: 1 }} /> : <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />}
      <span>{children}</span>
    </div>
  );
}

/** Runs an async action, tracks busy/error, and refuses double taps. */
export function useAction() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const run = async <T,>(fn: () => Promise<T>): Promise<T | undefined> => {
    if (busy) return undefined;
    setBusy(true); setError(null);
    try { return await fn(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Something went wrong. Try again.'); return undefined; }
    finally { setBusy(false); }
  };
  return { busy, error, setError, run };
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
