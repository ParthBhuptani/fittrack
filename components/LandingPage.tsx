import React, { useEffect, useMemo, useRef, useState } from 'react';
import './landing/landing.css';
import {
  ASKS, DAYNAMES, DAYS, FALLBACK, FAQS, FOCUS, MEALS, SPLIT, TOPICS,
  Exercise, Goal,
} from './landing/landingData';

interface Props {
  onAuth: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

const REPO = 'https://github.com/ParthBhuptani/fittrack';

type Msg = { who: 'me' | 'coach'; text: string };

const Logo: React.FC<{ id: string; size: number }> = ({ id, size }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true">
    <defs>
      <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#00C389" />
        <stop offset="100%" stopColor="#7ED957" />
      </linearGradient>
    </defs>
    <path className="pulse" pathLength={1} d="M6 34H18L28 14L36 50L44 24L50 34H58" stroke={`url(#${id})`} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const LandingPage: React.FC<Props> = ({ onAuth, theme, onToggleTheme }) => {
  const [goal, setGoal] = useState<Goal>('build');
  const [day, setDay] = useState<number | null>(null);
  const [flags, setFlags] = useState({ knee: false, home: false, veg: false });
  const [open, setOpen] = useState<number | null>(null);
  const [tab, setTab] = useState<'workout' | 'meals'>('workout');
  const [fade, setFade] = useState(false);
  const [roomOpen, setRoomOpen] = useState(false);
  const [typing, setTyping] = useState(false);
  const [used, setUsed] = useState<Record<string, boolean>>({});
  const [draft, setDraft] = useState('');
  const [chat, setChat] = useState<Msg[]>([
    { who: 'coach', text: "Hi, I'm your coach. Pick a question below or ask your own." },
  ]);
  const timers = useRef<number[]>([]);
  const logRef = useRef<HTMLDivElement>(null);

  // Snap and smooth-scroll only while the landing page is mounted.
  useEffect(() => {
    const el = document.documentElement;
    const prev = { snap: el.style.scrollSnapType, beh: el.style.scrollBehavior };
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    el.style.scrollSnapType = 'y proximity';
    if (!reduce) el.style.scrollBehavior = 'smooth';
    return () => {
      el.style.scrollSnapType = prev.snap;
      el.style.scrollBehavior = prev.beh;
      timers.current.forEach(window.clearTimeout);
    };
  }, []);

  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [chat, typing]);

  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  };

  // Fade the detail panel briefly when the sample plan changes.
  const change = (fn: () => void) => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce) { fn(); setOpen(null); return; }
    setFade(true);
    later(() => { fn(); setOpen(null); setFade(false); }, 110);
  };

  const today = (new Date().getDay() + 6) % 7;
  const activeDay = day === null ? today : day;
  const focus = FOCUS[SPLIT[goal][activeDay]];

  const resolve = (e: Exercise) => {
    const { knee, home } = flags;
    if (knee && home && (e.kh || e.k || e.g)) {
      if (e.kh) return { name: e.kh, reason: 'bad knees and no equipment' };
      if (e.k) return { name: e.k, reason: 'bad knees' };
      return { name: e.g as string, reason: 'no equipment' };
    }
    if (knee && e.k) return { name: e.k, reason: 'bad knees' };
    if (home && e.g) return { name: e.g, reason: 'no equipment' };
    return { name: e.n, reason: null as string | null };
  };

  const mealList = MEALS[goal][flags.veg ? 'v' : 'n'];
  const totalKcal = useMemo(() => mealList.reduce((s, m) => s + m[2], 0), [mealList]);

  const reply = (text: string, delay: number) => {
    setTyping(true);
    later(() => {
      setTyping(false);
      setChat((c) => [...c, { who: 'coach', text }]);
    }, delay);
  };

  const ask = (a: (typeof ASKS)[number]) => {
    if (used[a.id] || typing) return;
    setChat((c) => [...c, { who: 'me', text: a.q }]);
    setUsed((u) => ({ ...u, [a.id]: true }));
    reply(a.a, 800);
  };

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || typing) return;
    setChat((c) => [...c, { who: 'me', text }]);
    setDraft('');
    const hit = TOPICS.find((t) => t.k.test(text));
    reply(hit ? hit.a : FALLBACK, 900);
  };

  const go = (e: React.MouseEvent) => { e.preventDefault(); onAuth(); };
  const isLight = theme === 'light';
  const themeLabel = isLight ? 'Switch to dark theme' : 'Switch to light theme';

  const goals: { id: Goal; label: string }[] = [
    { id: 'lose', label: 'Lose fat' },
    { id: 'build', label: 'Build muscle' },
    { id: 'fit', label: 'Stay fit' },
  ];
  const chips: { key: 'knee' | 'home' | 'veg'; label: string }[] = [
    { key: 'knee', label: 'Bad knees' },
    { key: 'home', label: 'No equipment' },
    { key: 'veg', label: 'Vegetarian' },
  ];

  return (
    <div className="lp" id="top">
      <header className="bar">
        <div className="wrap bar-in">
          <a className="brand" href="#top" aria-label="FitTrack home">
            <Logo id="lgH" size={38} />
            <span>FitTrack</span>
          </a>
          <div className="nav">
            <nav className="nav-links" aria-label="Page sections">
              <a href="#how">How it works</a>
              <a href="#coach">Coach</a>
              <a href="#faq">FAQ</a>
            </nav>
            <button className="icon-btn" onClick={onToggleTheme} aria-label={themeLabel}>
              {isLight ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" /></svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
              )}
            </button>
            <a className="login" href="#" onClick={go}>Log in</a>
            <a className="btn" href="#" onClick={go}>Start free</a>
          </div>
        </div>
      </header>

      <main>
        <section className="wrap hero">
          <div className="hero-copy">
            <h1 className="disp h1">A week of training and meals, built around you.</h1>
            <p className="lede">Tell FitTrack your goal, injuries and equipment. It plans seven days of workouts and meals, then coaches you through them.</p>
            <div className="cta-row">
              <a className="btn btn-lg" href="#" onClick={go}>Create my plan</a>
              <p className="fine">Free and open source. <a href={REPO}>See the code</a></p>
            </div>
          </div>

          <div className="hero-card">
            <div className="planner">
              <div className="seg" role="group" aria-label="Goal">
                {goals.map((g) => (
                  <button key={g.id} aria-pressed={goal === g.id} onClick={() => change(() => setGoal(g.id))}>{g.label}</button>
                ))}
              </div>
              <div className="chips" role="group" aria-label="Your situation">
                {chips.map((c) => (
                  <button key={c.key} className="chip" aria-pressed={flags[c.key]} onClick={() => change(() => setFlags((f) => ({ ...f, [c.key]: !f[c.key] })))}>{c.label}</button>
                ))}
              </div>

              <div className="dock" role="group" aria-label="Day of the week">
                {DAYS.map((label, i) => (
                  <button key={label} className="day" style={{ ['--i' as string]: i }} aria-pressed={activeDay === i} aria-label={DAYNAMES[i]} onClick={() => change(() => setDay(i))}>
                    <span className="d-full">{label}</span>
                    <span className="d-short" aria-hidden="true">{label[0]}</span>
                    <span className={`tdot ${today === i ? 'on' : 'off'}`} />
                  </button>
                ))}
              </div>

              <div className="detail" style={{ opacity: fade ? 0 : 1 }}>
                <div className="detail-head">
                  <div>
                    <h3>{DAYNAMES[activeDay] + ', ' + focus.title}</h3>
                    <span className="meta">{focus.ex.length === 0 ? 'Recovery' : `${focus.mins} minutes, ${focus.ex.length} exercises`}</span>
                  </div>
                  <div className="tabs" role="group" aria-label="Show">
                    <button aria-pressed={tab === 'workout'} onClick={() => setTab('workout')}>Workout</button>
                    <button aria-pressed={tab === 'meals'} onClick={() => setTab('meals')}>Meals</button>
                  </div>
                </div>

                {tab === 'workout' && (
                  <div>
                    {focus.ex.length === 0 && (
                      <p className="rest">Nothing scheduled today. Walk if you feel like it. Recovery is part of the plan.</p>
                    )}
                    {focus.ex.map((e, i) => {
                      const r = resolve(e);
                      const expanded = open === i;
                      return (
                        <div key={e.n}>
                          <button className="ex" aria-expanded={expanded} onClick={() => setOpen(expanded ? null : i)}>
                            <span className="ex-name">{r.name}{r.reason && <span className="badge">swapped</span>}</span>
                            <span className="ex-scheme">{e.s}</span>
                          </button>
                          {expanded && (
                            <div className="exmore">
                              <span>{r.reason ? `Replaces ${e.n}. Chosen for ${r.reason}.` : `Easier: ${e.e}`}</span>
                              {!r.reason && <span>{`Harder: ${e.h}`}</span>}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {tab === 'meals' && (
                  <div>
                    {mealList.map((m) => (
                      <div className="meal" key={m[0]}>
                        <span className="meal-t">{m[0]}</span>
                        <span className="meal-n">{m[1]}</span>
                        <span className="meal-k">{m[2] + ' kcal'}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="planner-foot">
                <span>Sample plan. Meals add up to {totalKcal.toLocaleString('en-US')} kcal a day.</span>
                <a href="#" onClick={go}>Build mine</a>
              </div>
            </div>
          </div>
        </section>

        <section className="wrap sec screen" id="how">
          <h2 className="disp h2 rv">From a few questions to a full week.</h2>
          <div className="steps">
            <div className="step rv">
              <h3><span className="step-no">1</span>Describe yourself</h3>
              <p>Age, weight, goal, diet, injuries and the equipment you have. It's one short form.</p>
              <div className="viz">
                <div className="pills" aria-hidden="true">
                  {['Build muscle', 'Vegetarian', 'Left knee', 'Dumbbells', 'No dairy'].map((p) => (
                    <span className="pill" key={p}>{p}</span>
                  ))}
                </div>
              </div>
            </div>
            <div className="step rv">
              <h3><span className="step-no">2</span>Get your week</h3>
              <p>Seven days of workouts and meals in about a minute. Every exercise has an easier and a harder version, and every meal comes with a recipe.</p>
              <div className="viz">
                <div className="mini-week" aria-hidden="true">
                  {([['70%', 1, 'M'], ['90%', 1, 'T'], ['55%', 1, 'W'], ['12%', 0.5, 'T'], ['80%', 1, 'F'], ['95%', 1, 'S'], ['30%', 0.5, 'S']] as [string, number, string][]).map(([h, o, l], i) => (
                    <div key={i}><i style={{ height: h, opacity: o }} />{l}</div>
                  ))}
                </div>
              </div>
            </div>
            <div className="step rv">
              <h3><span className="step-no">3</span>Log it and adjust</h3>
              <p>Track workouts, weight and water, and watch your progress in charts. When life changes, update your profile and generate a new plan.</p>
              <div className="viz">
                <svg viewBox="0 0 280 100" width="100%" height="96" role="img" aria-label="Example weight chart trending down over time">
                  {[20, 50, 80].map((y) => (
                    <line key={y} x1="0" y1={y} x2="280" y2={y} stroke="currentColor" strokeOpacity=".18" strokeDasharray="3 4" />
                  ))}
                  <polyline className="draw" pathLength={1} points="6,24 46,30 86,28 126,42 166,48 206,58 246,66 274,70" fill="none" stroke="#0E9F6E" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="274" cy="70" r="5" fill="#0E9F6E" />
                </svg>
              </div>
            </div>
          </div>
        </section>

        <section className="wrap sec screen" id="coach">
          <div className="coach">
            <div className="coach-copy rv-x">
              <h2 className="disp h2">Ask your coach, not a search engine.</h2>
              <p>The coach has your profile and your current plan, so its answers fit you. Swap an exercise, plan around a missed day, or ask what to eat before training. Try a sample right here, no account needed.</p>
            </div>
            <div className="room-wrap">
              <div className={`room rv-scale ${roomOpen ? 'open' : 'closed'}`}>
                <div className="room-head">
                  <div className="room-title"><span className="live" />Coach room <small>sample</small></div>
                  {roomOpen ? (
                    <button className="close-btn" onClick={() => setRoomOpen(false)} aria-label="Close the coach room">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
                    </button>
                  ) : (
                    <button className="btn" onClick={() => setRoomOpen(true)}>Try it now</button>
                  )}
                </div>
                <p className="room-peek">Pick a question or type your own.</p>
                <div className="room-body">
                  <div className="room-inner">
                    <div className="chat-log" role="log" aria-live="polite" aria-label="Sample conversation with the coach" ref={logRef}>
                      <div className="chat-log-in">
                        {chat.map((m, i) => (
                          <div key={i} className={`msg ${m.who === 'me' ? 'me' : 'coach'}`}>{m.text}</div>
                        ))}
                        {typing && (
                          <div className="msg coach"><span className="typing" aria-label="Coach is typing"><i /><i /><i /></span></div>
                        )}
                      </div>
                    </div>
                    <div className="asks">
                      {ASKS.map((a) => (
                        <button key={a.id} className="ask" onClick={() => ask(a)} disabled={!!used[a.id]}>{a.q}</button>
                      ))}
                    </div>
                    <form className="room-form" onSubmit={send}>
                      <label className="sr" htmlFor="room-q">Ask the coach a question</label>
                      <input id="room-q" type="text" maxLength={200} autoComplete="off" placeholder="Ask your own question" value={draft} onChange={(e) => setDraft(e.target.value)} />
                      <button className="btn" type="submit">Send</button>
                    </form>
                    <p className="room-note"><strong>Sample coach, general information only, not medical advice.</strong> It answers common questions. <a href="#" onClick={go}>Create a free account</a> and the coach uses your own profile and plan.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="wrap sec screen" id="faq">
          <div className="faq">
            <div className="faq-head rv-x">
              <h2 className="disp h2">Questions before you sign up.</h2>
            </div>
            <div className="faq-list">
              {FAQS.map((f) => (
                <details className="rv" key={f.q} open={f.open}>
                  <summary>{f.q}</summary>
                  <p>{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="wrap sec screen" style={{ paddingBlock: '48px 0' }}>
          <div className="band rv-scale">
            <div>
              <h2 className="disp h2">Your first week is about a minute away.</h2>
              <p>Sign up with email or Google.</p>
            </div>
            <a className="btn btn-lg" href="#" onClick={go}>Create my plan</a>
          </div>
          <footer className="foot" style={{ paddingInline: 0 }}>
            <div className="foot-grid">
              <div className="foot-brand">
                <a className="brand" href="#top" aria-label="FitTrack home">
                  <Logo id="lgF" size={32} />
                  <span style={{ fontSize: 20 }}>FitTrack</span>
                </a>
                <p>A week of training and meals, built around you. Free and open source.</p>
              </div>
              <nav className="foot-col" aria-label="Product">
                <h3>Product</h3>
                <a href="#how">How it works</a>
                <a href="#coach">Coach room</a>
                <a href="#faq">FAQ</a>
              </nav>
              <nav className="foot-col" aria-label="Account">
                <h3>Account</h3>
                <a href="#" onClick={go}>Log in</a>
                <a href="#" onClick={go}>Sign up free</a>
              </nav>
              <nav className="foot-col" aria-label="Project">
                <h3>Project</h3>
                <a href={REPO}>GitHub</a>
                <a href={`${REPO}/issues`}>Report an issue</a>
                <a href={`${REPO}/blob/main/LICENSE`}>MIT license</a>
              </nav>
            </div>
            <p className="disclaimer">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10" /><path d="M12 8v5M12 16.5v.01" /></svg>
              <span><strong>FitTrack is general fitness and nutrition information, not medical advice.</strong> Check with your doctor before you start, especially if you have an injury, a health condition or take medication.</span>
            </p>
            <div className="foot-bottom">
              <span>© 2026 FitTrack. Released under the MIT license.</span>
              <span>Built by Parth Bhuptani · <a href={REPO}>Source on GitHub</a></span>
            </div>
          </footer>
        </section>
      </main>
    </div>
  );
};

export default LandingPage;