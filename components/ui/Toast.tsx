import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Check, AlertCircle } from 'lucide-react';

type ToastKind = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  message: string;
  kind: ToastKind;
}

interface ToastApi {
  show: (message: string, kind?: ToastKind) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

// Small, calm notifications. They replace alert() pop-ups.
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(0);
  const timers = useRef(new Map<number, number>());

  const dismiss = useCallback((id: number) => {
    const t = timers.current.get(id);
    if (t) window.clearTimeout(t);
    timers.current.delete(id);
    setItems(prev => prev.filter(i => i.id !== id));
  }, []);

  const show = useCallback((message: string, kind: ToastKind = 'success') => {
    const id = ++nextId.current;
    setItems(prev => [...prev.slice(-2), { id, message, kind }]);
    timers.current.set(id, window.setTimeout(() => dismiss(id), kind === 'error' ? 5000 : 2600));
  }, [dismiss]);

  useEffect(() => {
    const map = timers.current;
    return () => { map.forEach(t => window.clearTimeout(t)); map.clear(); };
  }, []);

  const api = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      {/* The app shell can set --toast-bottom so toasts sit above a bottom tab bar. */}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 z-[100] flex flex-col items-center gap-2 px-4"
        style={{ bottom: 'var(--toast-bottom, 24px)' }}
      >
        {items.map(item => (
          <button
            key={item.id}
            type="button"
            onClick={() => dismiss(item.id)}
            className="pointer-events-auto animate-toast-in motion-reduce:animate-none flex max-w-full items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-semibold leading-snug text-canvas shadow-lg"
          >
            {item.kind === 'error'
              ? <AlertCircle className="h-4 w-4 shrink-0 text-danger" aria-hidden="true" />
              : <Check className="h-4 w-4 shrink-0 text-accent-fill" aria-hidden="true" />}
            <span className="text-left">{item.message}</span>
          </button>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  // Without a provider, fall back quietly instead of crashing a screen.
  return ctx ?? { show: (message: string) => console.warn('Toast:', message) };
}