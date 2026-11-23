import React, { useState } from 'react';
import { Info, Send } from 'lucide-react';
import './views.css';

export interface CoachMessage { role: 'user' | 'model'; text: string }

interface Props {
  messages: CoachMessage[];
  typing: boolean;
  error?: string | null;
  onSend: (text: string) => void;
  onRetry?: () => void;
}

const ASKS = [
  'My knee hurts on squats',
  'What to eat before training?',
  'Does walking help weight loss?',
  'I missed two workouts',
];

// Renders the coach's reply as safe React elements (never raw HTML): line breaks, "- " / "* " bullets and **bold**.
// Also repairs missing spaces after a full stop ("Balance.Stay" -> "Balance. Stay").
const fixSpacing = (t: string) => t.replace(/([a-z])\.(\*\*)?([A-Z])/g, (_m, a, b, c) => `${a}.${b || ''} ${c}`);
// Bold is **text** (or __text__). Anything left over (single * for italics, a stray ** from a broken pair) is removed.
const inline = (line: string, key: number) =>
  fixSpacing(line)
    .replace(/\*\*\*(.+?)\*\*\*/g, '**$1**')
    .split(/(\*\*.+?\*\*|__.+?__)/g)
    .filter(Boolean)
    .map((part, i) => {
      const bold = (part.startsWith('**') && part.endsWith('**') && part.length > 4) || (part.startsWith('__') && part.endsWith('__') && part.length > 4);
      return bold
        ? <strong key={`${key}-${i}`}>{part.slice(2, -2).replace(/\*/g, '')}</strong>
        : <React.Fragment key={`${key}-${i}`}>{part.replace(/\*+/g, '').replace(/^#+\s*/, '')}</React.Fragment>;
    });
const renderText = (text: string) => {
  const blocks: React.ReactNode[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;
  const flush = () => {
    if (list) {
      const L = list;
      const Tag = L.ordered ? 'ol' : 'ul';
      blocks.push(<Tag key={`l${blocks.length}`}>{L.items.map((l, i) => <li key={i}>{inline(l, i)}</li>)}</Tag>);
      list = null;
    }
  };
  text.split('\n').forEach((raw, idx) => {
    const line = raw.trim();
    const bullet = line.match(/^[-*•]\s+(.*)$/);
    const num = line.match(/^\d+[.)]\s+(.*)$/);
    const item = bullet ? { ordered: false, t: bullet[1] } : num ? { ordered: true, t: num[1] } : null;
    if (item) {
      if (list && list.ordered !== item.ordered) flush();
      if (!list) list = { ordered: item.ordered, items: [] };
      list.items.push(item.t);
      return;
    }
    flush();
    if (line) blocks.push(<p key={`p${idx}`}>{inline(line, idx)}</p>);
  });
  flush();
  return blocks;
};

const CoachView: React.FC<Props> = ({ messages, typing, error, onSend, onRetry }) => {
  const [draft, setDraft] = useState('');
  const [used, setUsed] = useState<string[]>([]);

  const send = (text: string) => {
    const t = text.trim();
    if (!t || typing) return;
    onSend(t);
  };

  return (
    <div className="av av-coach">
      <div className="view">
        <div className="head">
          <div>
            <h1 className="disp h1">Coach</h1>
            <p className="sub">Ask about your plan, food or training.</p>
          </div>
        </div>

        <div className="card coach">
          <div className="coach-h"><span className="live" /><b>FitTrack coach</b><span className="muted knows">Knows your profile</span></div>
          <div className="log" aria-live="polite">
            {error && !typing && (
              <div className="msg bot err" role="alert">
                <p>{error}</p>
                {onRetry && <button type="button" className="retry" onClick={onRetry}>Try again</button>}
              </div>
            )}
            {typing && <div className="typing" aria-label="Coach is typing"><i /><i /><i /></div>}
            {[...messages].reverse().map((m, i) => (
              <div key={`${messages.length - i}`} className={`msg ${m.role === 'user' ? 'me' : 'bot'}`}>{renderText(m.text)}</div>
            ))}
          </div>
          <div className={`asks ${messages.some(m => m.role === 'user') ? 'started' : ''}`}>
            {ASKS.filter(q => !used.includes(q)).map(q => (
              <button key={q} type="button" className="ask" disabled={typing} onClick={() => { setUsed(u => [...u, q]); send(q); }}>{q}</button>
            ))}
          </div>
          <form className="coach-f" onSubmit={(e) => { e.preventDefault(); if (typing || !draft.trim()) return; send(draft); setDraft(''); }}>
            <label className="sr" htmlFor="coach-in">Ask the coach</label>
            <input id="coach-in" autoComplete="off" maxLength={300} placeholder="Ask your coach" value={draft} onChange={(e) => setDraft(e.target.value)} />
            <button type="submit" className="btn" aria-label="Send" disabled={typing || !draft.trim()}><Send size={16} aria-hidden="true" /><span className="only-d">Send</span></button>
          </form>
          <p className="coach-n"><Info size={14} aria-hidden="true" /><span><b>General information, not medical advice.</b> For pain, injury or a health condition, talk to your doctor.</span></p>
        </div>
      </div>
    </div>
  );
};

export default CoachView;