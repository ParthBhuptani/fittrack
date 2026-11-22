import React, { useEffect, useId, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

export interface DropdownOption {
  value: string;
  label: string;
}

interface DropdownProps {
  label: string;
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  className?: string;
}

// A styled, keyboard-friendly replacement for the browser's native <select>.
export const Dropdown: React.FC<DropdownProps> = ({ label, value, options, onChange, className = '' }) => {
  const uid = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [up, setUp] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const selectedIndex = Math.max(0, options.findIndex(o => o.value === value));
  const current = options[selectedIndex];

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const openMenu = () => {
    // Open upward when the list would run off the bottom of the screen.
    const r = root.current?.getBoundingClientRect();
    if (r) {
      const need = options.length * 44 + 24;
      const below = window.innerHeight - r.bottom;
      setUp(below < need && r.top > below);
    }
    setActive(selectedIndex);
    setOpen(true);
  };
  const choose = (i: number) => { onChange(options[i].value); setOpen(false); };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) { e.preventDefault(); openMenu(); }
      return;
    }
    if (e.key === 'Escape') { e.preventDefault(); setOpen(false); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); setActive(a => Math.min(options.length - 1, a + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(a => Math.max(0, a - 1)); }
    else if (e.key === 'Home') { e.preventDefault(); setActive(0); }
    else if (e.key === 'End') { e.preventDefault(); setActive(options.length - 1); }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); choose(active); }
    else if (e.key === 'Tab') setOpen(false);
  };

  return (
    <div ref={root} className={`relative ${className}`}>
      <span id={`${uid}-label`} className="mb-1.5 block text-[15px] font-semibold text-ink">{label}</span>
      <div className="relative">
      <button
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${uid}-list`}
        aria-labelledby={`${uid}-label`}
        aria-activedescendant={open ? `${uid}-opt-${active}` : undefined}
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={onKeyDown}
        className={`flex min-h-[46px] w-full items-center justify-between gap-2 rounded-xl border bg-canvas px-3.5 text-left text-ink transition-[border-color,box-shadow] hover:border-muted focus-visible:outline-none ${
          open ? 'border-accent-fill ring-[3px] ring-accent-fill/25' : 'border-line'
        }`}
      >
        <span className="truncate">{current?.label}</span>
        <ChevronDown className={`h-[18px] w-[18px] shrink-0 text-muted transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>
      {open && (
        <ul
          id={`${uid}-list`}
          role="listbox"
          aria-labelledby={`${uid}-label`}
          className={`absolute inset-x-0 z-40 m-0 list-none ${up ? 'bottom-[calc(100%+6px)] origin-bottom' : 'top-[calc(100%+6px)] origin-top'} rounded-2xl border border-line bg-surface p-1.5 shadow-2xl animate-dd-in motion-reduce:animate-none`}
        >
          {options.map((o, i) => (
            <li
              key={o.value}
              id={`${uid}-opt-${i}`}
              role="option"
              aria-selected={o.value === value}
              onMouseEnter={() => setActive(i)}
              onMouseDown={e => e.preventDefault()}
              onClick={() => choose(i)}
              className={`flex min-h-[44px] cursor-pointer items-center justify-between gap-2 rounded-[10px] px-3 ${
                i === active ? 'bg-soft' : ''
              } ${o.value === value ? 'font-bold text-accent' : 'font-medium text-ink'}`}
            >
              {o.label}
              <Check className={`h-[18px] w-[18px] ${o.value === value ? 'opacity-100' : 'opacity-0'}`} aria-hidden="true" />
            </li>
          ))}
        </ul>
      )}
      </div>
    </div>
  );
};