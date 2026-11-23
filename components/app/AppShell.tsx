import React, { useEffect, useRef, useState } from 'react';
import { BarChart2, Dumbbell, FileText, Flame, LogOut, MessageSquare, Moon, Settings, Sun, TrendingUp, Utensils } from 'lucide-react';
import './shell.css';

export type TabId = 'overview' | 'workout' | 'diet' | 'chat' | 'analytics' | 'settings';

const NAV: { id: Exclude<TabId, 'settings'>; label: string; icon: React.ComponentType<{ className?: string; size?: number }> }[] = [
  { id: 'overview', label: 'Today', icon: TrendingUp },
  { id: 'workout', label: 'Workouts', icon: Dumbbell },
  { id: 'diet', label: 'Meals', icon: Utensils },
  { id: 'chat', label: 'Coach', icon: MessageSquare },
  { id: 'analytics', label: 'Progress', icon: BarChart2 },
];

interface Props {
  name: string;
  email: string;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  activeTab: TabId;
  onTab: (tab: TabId) => void;
  streak: number;
  timerText?: string | null; // shown while a timer or stopwatch is running
  onReport: () => void;
  onLogout: () => void;
  children: React.ReactNode;
}

const Logo = () => (
  <svg width="34" height="34" viewBox="0 0 64 64" fill="none" aria-hidden="true">
    <defs>
      <linearGradient id="lgApp" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#00C389" />
        <stop offset="100%" stopColor="#7ED957" />
      </linearGradient>
    </defs>
    <path d="M6 34H18L28 14L36 50L44 24L50 34H58" stroke="url(#lgApp)" strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const AppShell: React.FC<Props> = ({ name, email, theme, onToggleTheme, activeTab, onTab, streak, timerText, onReport, onLogout, children }) => {
  const [menu, setMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLElement>(null);
  const themeLabel = theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme';
  const ThemeIcon = theme === 'light' ? Moon : Sun;

  useEffect(() => {
    if (!menu) return;
    const down = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenu(false); };
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenu(false); };
    document.addEventListener('mousedown', down);
    document.addEventListener('keydown', key);
    return () => { document.removeEventListener('mousedown', down); document.removeEventListener('keydown', key); };
  }, [menu]);

  // Start each tab at the top.
  useEffect(() => { mainRef.current?.scrollTo({ top: 0 }); }, [activeTab]);

  const idx = NAV.findIndex(n => n.id === activeTab);
  const choose = (tab: TabId) => { setMenu(false); onTab(tab); };

  return (
    <div className="as">
      <header className="top">
        <button className="brand" type="button" onClick={() => onTab('overview')} aria-label="FitTrack, go to Today">
          <Logo /><span>FitTrack</span>
        </button>
        <div className="top-r">
          {timerText && (
            <button className="chip run" type="button" onClick={() => onTab('workout')} aria-label="Timer running, open workouts"><i />{timerText}</button>
          )}
          <span className="chip" title="Day streak"><Flame size={18} fill="currentColor" aria-hidden="true" />{streak}</span>
          <button className="icon-btn only-d" type="button" onClick={onToggleTheme} aria-label={themeLabel}><ThemeIcon size={20} aria-hidden="true" /></button>
          <div ref={menuRef} style={{ position: 'relative' }}>
            <button className="avatar" type="button" onClick={() => setMenu(m => !m)} aria-label="Account menu" aria-expanded={menu} aria-haspopup="menu">
              {(name || '?').charAt(0).toUpperCase()}
            </button>
            {menu && (
              <div className="menu" role="menu">
                <div className="name"><b>{name}</b><span>{email}</span></div>
                <button role="menuitem" type="button" onClick={() => choose('settings')}><Settings size={18} aria-hidden="true" />Settings</button>
                <button role="menuitem" type="button" onClick={() => { setMenu(false); onReport(); }}><FileText size={18} aria-hidden="true" />Download report</button>
                <button className="only-m" role="menuitem" type="button" onClick={() => { setMenu(false); onToggleTheme(); }}><ThemeIcon size={18} aria-hidden="true" />Switch theme</button>
                <button className="danger" role="menuitem" type="button" onClick={() => { setMenu(false); onLogout(); }}><LogOut size={18} aria-hidden="true" />Log out</button>
              </div>
            )}
          </div>
        </div>
      </header>

      <nav className="side" aria-label="Main" style={{ ['--idx' as string]: Math.max(idx, 0), ['--vis' as string]: idx < 0 ? 0 : 1 }}>
        <span className="pill-ind" aria-hidden="true" />
        {NAV.map(n => (
          <button key={n.id} type="button" className={`ni ${activeTab === n.id ? 'on' : ''}`} aria-current={activeTab === n.id ? 'page' : undefined} onClick={() => choose(n.id)}>
            <n.icon size={20} aria-hidden="true" /><span>{n.label}</span>
          </button>
        ))}
        <button type="button" className={`ni set only-d ${activeTab === 'settings' ? 'on' : ''}`} aria-current={activeTab === 'settings' ? 'page' : undefined} onClick={() => choose('settings')}>
          <Settings size={20} aria-hidden="true" /><span>Settings</span>
        </button>
        <p className="side-note only-d"><b>Not medical advice.</b> FitTrack gives general information. Check with your doctor before you start a new plan.</p>
      </nav>

      <main className="main" ref={mainRef}>{children}</main>
    </div>
  );
};

export default AppShell;