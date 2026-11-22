import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Check, Info, Moon, Sun } from 'lucide-react';
import { User, UserProfile, Gender, Goal, ActivityLevel, DietType } from '../types';
import { StorageService } from '../services/storageService';
import { DIETARY_RESTRICTIONS } from '../utils';
import { Dropdown } from './ui/Dropdown';
import './auth/auth.css';

type Screen = 'login' | 'signup' | 'form' | 'generating';

interface Props {
  // Resolves to an error message if the plan could not be built, otherwise nothing.
  onComplete: (user: User) => Promise<string | void>;
  existingUser?: User;
  onBack?: () => void;
  initialMode?: 'login' | 'signup';
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

const STEPS = [
  { t: 'About you', s: 'A few basics so we can size your plan.' },
  { t: 'Goal and equipment', s: 'What you want, and what you have to work with.' },
  { t: 'Food and health', s: 'So meals fit how you eat.' },
];
const GOALS: { v: Goal; label: string; hint: string }[] = [
  { v: Goal.WeightLoss, label: 'Lose fat', hint: 'Steady deficit, strength to keep muscle.' },
  { v: Goal.MuscleGain, label: 'Build muscle', hint: 'Progressive training and enough fuel.' },
  { v: Goal.Maintenance, label: 'Stay fit', hint: 'Balanced cardio, strength and mobility.' },
];
const GEAR = ['Gym', 'Dumbbells at home', 'Resistance bands', 'No equipment'];
const TODO = ['Calculating your calorie needs', 'Choosing exercises that fit you', 'Writing seven days of meals', 'Checking the plan is complete'];
const EMAIL_RE = /^\S+@\S+\.\S+$/;

// A decorative grid of "training days" for the side panel.
const CELLS: { x: number; y: number; k: string; lvl: number }[] = [];
for (let x = 0; x < 16; x++) {
  for (let y = 0; y < 7; y++) {
    const v = (0.5 + 0.5 * Math.sin(x * 0.9 + y * 1.7)) * (0.45 + (x / 15) * 0.6) * 4.2;
    CELLS.push({ x, y, k: `${x}-${y}`, lvl: Math.max(0, Math.min(4, Math.round(v))) });
  }
}

const GoogleLogo = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#4285F4" d="M22.6 12.2c0-.8-.1-1.4-.2-2H12v3.9h5.9c-.3 1.4-1.1 2.5-2.2 3.3v2.7h3.5c2.1-1.9 3.4-4.7 3.4-7.9z" />
    <path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.5-2.7c-1 .7-2.2 1.1-3.8 1.1-2.9 0-5.4-2-6.3-4.6H2.1v2.8C3.9 20.4 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.7 14.1c-.2-.7-.4-1.4-.4-2.1s.1-1.4.4-2.1V7.1H2.1C1.4 8.6 1 10.2 1 12s.4 3.4 1.1 4.9l3.6-2.8z" />
    <path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.1-3.1C17.5 2.2 15 1 12 1 7.7 1 3.9 3.6 2.1 7.1l3.6 2.8C6.6 7.4 9.1 5.4 12 5.4z" />
  </svg>
);

const Logo: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true">
    <defs>
      <linearGradient id="lgAuth" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#00C389" />
        <stop offset="100%" stopColor="#7ED957" />
      </linearGradient>
    </defs>
    <path pathLength={1} d="M6 34H18L28 14L36 50L44 24L50 34H58" stroke="url(#lgAuth)" strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const AuthFlow: React.FC<Props> = ({ onComplete, existingUser, onBack, initialMode = 'login', theme, onToggleTheme }) => {
  const [screen, setScreen] = useState<Screen>(existingUser ? 'form' : initialMode);
  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const [gen, setGen] = useState(0);

  // Account fields
  const [name, setName] = useState(existingUser?.displayName || '');
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [emailErr, setEmailErr] = useState('');
  const [pwErr, setPwErr] = useState('');
  const [nameErr, setNameErr] = useState('');
  const [formErr, setFormErr] = useState('');

  // Profile fields (numbers stay as text while typing)
  const [age, setAge] = useState('25');
  const [gender, setGender] = useState<Gender>(Gender.Male);
  const [height, setHeight] = useState('170');
  const [weight, setWeight] = useState('70');
  const [activity, setActivity] = useState<ActivityLevel>(ActivityLevel.Sedentary);
  const [goal, setGoal] = useState<Goal>(Goal.WeightLoss);
  const [gear, setGear] = useState('Gym');
  const [injuries, setInjuries] = useState('');
  const [diet, setDiet] = useState<DietType>(DietType.NonVeg);
  const [restrictions, setRestrictions] = useState<string[]>([]);
  const [prefs, setPrefs] = useState('');
  const [allergies, setAllergies] = useState('');
  const [stepErr, setStepErr] = useState('');

  // Side panel
  const [lit, setLit] = useState<Record<string, boolean>>({});
  const heatRef = useRef<HTMLDivElement>(null);
  const litCount = useMemo(() => Object.values(lit).filter(Boolean).length, [lit]);

  // Move focus to the heading when the screen or step changes (not on first paint).
  const headRef = useRef<HTMLHeadingElement>(null);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    headRef.current?.focus();
  }, [screen, step]);

  // Progress checklist on the loading screen. The last item stays "in progress" until we are done.
  useEffect(() => {
    if (screen !== 'generating') return;
    setGen(0);
    const id = window.setInterval(() => setGen(g => Math.min(g + 1, TODO.length - 1)), 5000);
    return () => window.clearInterval(id);
  }, [screen]);

  const go = (s: Screen) => {
    setScreen(s);
    setEmailErr(''); setPwErr(''); setNameErr(''); setFormErr('');
  };

  const validate = (needStrongPw: boolean, needName: boolean) => {
    const e = !email.trim() ? 'Enter your email.' : !EMAIL_RE.test(email.trim()) ? 'That email does not look right.' : '';
    const p = !pw ? 'Enter your password.' : needStrongPw && pw.length < 8 ? 'Use at least 8 characters.' : '';
    const n = needName && !name.trim() ? 'Enter your name.' : '';
    setEmailErr(e); setPwErr(p); setNameErr(n);
    return !e && !p && !n;
  };

  const submitLogin = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setFormErr('');
    if (!validate(false, false) || busy) return;
    setBusy(true);
    const user = await StorageService.login(email.trim(), pw);
    if (!user) {
      setBusy(false);
      setFormErr('Invalid email or password. Please try again.');
      return;
    }
    const err = await onComplete(user);
    setBusy(false);
    if (err) setFormErr(err);
  };

  const submitSignup = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate(true, true)) return;
    setStep(1);
    go('form');
  };

  const google = async () => {
    setFormErr('');
    await StorageService.signInWithGoogle(); // the page redirects to Google from here
  };

  const buildProfile = (): UserProfile => ({
    name: name.trim(),
    age: parseInt(age, 10),
    gender,
    height: parseFloat(height),
    weight: parseFloat(weight),
    units: 'metric',
    goal,
    activityLevel: activity,
    dietType: diet,
    restrictions,
    dietaryPreferences: prefs.trim(),
    injuries: injuries.trim() || 'None',
    allergies: allergies.trim() || 'None',
    equipment: gear,
  });

  const finish = async () => {
    const profile = buildProfile();
    setFormErr('');
    setScreen('generating');

    let user: User | null;
    if (existingUser) {
      // Signed in with Google already: just save the profile.
      const saved = await StorageService.saveProfile(existingUser.id, profile);
      user = saved ? { ...existingUser, profile } : null;
      if (!user) {
        setStep(3); setScreen('form');
        setFormErr('Something went wrong saving your profile. Please try again.');
        return;
      }
    } else {
      user = await StorageService.register(email.trim(), pw, profile);
      if (!user) {
        go('login');
        setFormErr('That email may already be registered. Please try logging in instead.');
        return;
      }
    }

    const err = await onComplete(user);
    if (err) {
      setStep(3); setScreen('form');
      setFormErr(err);
    }
  };

  const next = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (step === 1) {
      const a = parseInt(age, 10), h = parseFloat(height), w = parseFloat(weight);
      if (!(a >= 14 && a <= 100)) return setStepErr('Enter an age between 14 and 100.');
      if (!(h >= 100 && h <= 250)) return setStepErr('Enter a height between 100 and 250 cm.');
      if (!(w >= 30 && w <= 300)) return setStepErr('Enter a weight between 30 and 300 kg.');
    }
    setStepErr(''); setFormErr('');
    if (step < 3) setStep(step + 1);
    else finish();
  };

  const back = () => {
    setStepErr('');
    if (step > 1) setStep(step - 1);
    else go('signup');
  };

  const toggleRestriction = (r: string) =>
    setRestrictions(cur => (cur.includes(r) ? cur.filter(x => x !== r) : [...cur, r]));

  const spot = (e: React.MouseEvent<HTMLElement>) => {
    const h = heatRef.current;
    if (!h) return;
    const r = h.getBoundingClientRect();
    h.style.setProperty('--cx', (((e.clientX - r.left) / r.width) * 16 - 0.5).toFixed(2));
    h.style.setProperty('--cy', (((e.clientY - r.top) / r.height) * 7 - 0.5).toFixed(2));
  };
  const unspot = () => {
    heatRef.current?.style.setProperty('--cx', '-20');
    heatRef.current?.style.setProperty('--cy', '-20');
  };

  const homeLink = onBack && !existingUser ? (
    <button type="button" className="backlink" onClick={onBack}><ArrowLeft className="ic" aria-hidden="true" />Back to home</button>
  ) : null;

  const heading = (text: string) => (
    <h1 className="disp h1" ref={headRef} tabIndex={-1} style={{ outline: 'none' }}>{text}</h1>
  );

  const pwField = (id: string, autoComplete: string, placeholder: string) => (
    <div className="fld">
      <label htmlFor={id}>Password</label>
      <div className="pw">
        <input className={`inp ${pwErr ? 'bad' : ''}`} id={id} type={showPw ? 'text' : 'password'} autoComplete={autoComplete} placeholder={placeholder} value={pw} onChange={e => { setPw(e.target.value); setPwErr(''); }} disabled={busy} aria-invalid={!!pwErr} />
        <button type="button" onClick={() => setShowPw(s => !s)} aria-label={showPw ? 'Hide password' : 'Show password'}>{showPw ? 'Hide' : 'Show'}</button>
      </div>
      {pwErr && <p className="err" role="alert">{pwErr}</p>}
    </div>
  );

  const emailField = (id: string) => (
    <div className="fld">
      <label htmlFor={id}>Email</label>
      <input className={`inp ${emailErr ? 'bad' : ''}`} id={id} type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={e => { setEmail(e.target.value); setEmailErr(''); }} disabled={busy} aria-invalid={!!emailErr} />
      {emailErr && <p className="err" role="alert">{emailErr}</p>}
    </div>
  );

  const googleBtn = (
    <button className="btn ghost block" type="button" onClick={google} disabled={busy}>
      <GoogleLogo /> Continue with Google
    </button>
  );

  return (
    <div className="au">
      <div className="shell">
        <div className="left">
          <div className="topbar">
            {onBack && !existingUser ? (
              <button className="brand" type="button" onClick={onBack} aria-label="FitTrack home" style={{ background: 'none', border: 0, padding: 0, cursor: 'pointer' }}>
                <Logo size={34} /><span>FitTrack</span>
              </button>
            ) : (
              <div className="brand"><Logo size={34} /><span>FitTrack</span></div>
            )}
            <button className="icon-btn" onClick={onToggleTheme} aria-label={theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}>
              {theme === 'light' ? <Moon className="ic" /> : <Sun className="ic" />}
            </button>
          </div>

          <div className="center">
            {screen === 'login' && (
              <div className="panel" key="login">
                {homeLink}
                {heading('Welcome back.')}
                <p className="sub">Log in to see today's plan.</p>
                <form className="form" onSubmit={submitLogin} noValidate>
                  {emailField('l-mail')}
                  {pwField('l-pw', 'current-password', 'Your password')}
                  {formErr && <p className="err top" role="alert">{formErr}</p>}
                  <button className="btn block" type="submit" disabled={busy}>{busy ? 'Logging in…' : 'Log in'}</button>
                  <div className="or">or</div>
                  {googleBtn}
                </form>
                <p className="switch">New to FitTrack? <button type="button" onClick={() => go('signup')}>Create an account</button></p>
                <p className="legal">General fitness and nutrition information, not medical advice.</p>
              </div>
            )}

            {screen === 'signup' && (
              <div className="panel" key="signup">
                {homeLink}
                {heading('Create your account.')}
                <p className="sub">Free, and your first plan takes about a minute.</p>
                <form className="form" onSubmit={submitSignup} noValidate>
                  <div className="fld">
                    <label htmlFor="s-name">Name</label>
                    <input className={`inp ${nameErr ? 'bad' : ''}`} id="s-name" autoComplete="name" placeholder="Your name" value={name} onChange={e => { setName(e.target.value); setNameErr(''); }} aria-invalid={!!nameErr} />
                    {nameErr && <p className="err" role="alert">{nameErr}</p>}
                  </div>
                  {emailField('s-mail')}
                  {pwField('s-pw', 'new-password', 'At least 8 characters')}
                  <button className="btn block" type="submit">Create account</button>
                  <div className="or">or</div>
                  {googleBtn}
                </form>
                <p className="switch">Already have an account? <button type="button" onClick={() => go('login')}>Log in</button></p>
                <p className="legal">By continuing you agree that FitTrack gives general information, not medical advice.</p>
              </div>
            )}

            {screen === 'form' && (
              <div className="panel wide" key="form">
                {(step > 1 || !existingUser) && (
                  <button type="button" className="backlink" onClick={back}><ArrowLeft className="ic" aria-hidden="true" />{step > 1 ? 'Back' : 'Back to sign up'}</button>
                )}
                <div className="steps" aria-hidden="true">
                  {[1, 2, 3].map(i => <i key={i} className={i <= step ? 'on' : ''} />)}
                </div>
                <p className="kicker">Step {step} of 3</p>
                {heading(STEPS[step - 1].t)}
                <p className="sub">{STEPS[step - 1].s}</p>

                <form className="form" onSubmit={next} noValidate>
                  {step === 1 && (
                    <>
                      <div className="two">
                        <div className="fld"><label htmlFor="o-age">Age</label><input className="inp" id="o-age" inputMode="numeric" value={age} onChange={e => { setAge(e.target.value); setStepErr(''); }} /></div>
                        <div className="fld"><span className="lbl">Gender</span>
                          <div className="seg" role="group" aria-label="Gender">
                            {Object.values(Gender).map(g => (
                              <button type="button" key={g} aria-pressed={gender === g} onClick={() => setGender(g)}>{g}</button>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="two keep">
                        <div className="fld"><label htmlFor="o-h">Height (cm)</label><input className="inp" id="o-h" inputMode="numeric" value={height} onChange={e => { setHeight(e.target.value); setStepErr(''); }} /></div>
                        <div className="fld"><label htmlFor="o-w">Weight (kg)</label><input className="inp" id="o-w" inputMode="decimal" value={weight} onChange={e => { setWeight(e.target.value); setStepErr(''); }} /></div>
                      </div>
                      <Dropdown label="Activity level" value={activity} onChange={v => setActivity(v as ActivityLevel)} options={Object.values(ActivityLevel).map(v => ({ value: v, label: v }))} />
                      {stepErr && <p className="err" role="alert">{stepErr}</p>}
                    </>
                  )}

                  {step === 2 && (
                    <>
                      <div className="fld"><span className="lbl">Main goal</span>
                        <div className="goals">
                          {GOALS.map(g => (
                            <button type="button" key={g.v} className="goal" aria-pressed={goal === g.v} onClick={() => setGoal(g.v)}><b>{g.label}</b><span>{g.hint}</span></button>
                          ))}
                        </div>
                      </div>
                      <div className="fld"><span className="lbl">Where do you train?</span>
                        <div className="chips" role="group" aria-label="Equipment">
                          {GEAR.map(g => <button type="button" key={g} className="chp" aria-pressed={gear === g} onClick={() => setGear(g)}>{g}</button>)}
                        </div>
                      </div>
                      <div className="fld"><label htmlFor="o-i">Injuries or limits</label>
                        <input className="inp" id="o-i" placeholder="For example, bad knees or a sore lower back" value={injuries} onChange={e => setInjuries(e.target.value)} />
                        <p className="hint">Your plan avoids moves that could aggravate these. Leave it empty if none.</p>
                      </div>
                    </>
                  )}

                  {step === 3 && (
                    <>
                      <div className="fld"><span className="lbl">Diet type</span>
                        <div className="chips" role="group" aria-label="Diet type">
                          {Object.values(DietType).map(d => <button type="button" key={d} className="chp" aria-pressed={diet === d} onClick={() => setDiet(d)}>{d}</button>)}
                        </div>
                      </div>
                      <div className="fld"><span className="lbl">Dietary restrictions</span>
                        <div className="chips" role="group" aria-label="Dietary restrictions">
                          {DIETARY_RESTRICTIONS.map(r => <button type="button" key={r} className="chp" aria-pressed={restrictions.includes(r)} onClick={() => toggleRestriction(r)}>{r}</button>)}
                        </div>
                      </div>
                      <div className="two">
                        <div className="fld"><label htmlFor="o-p">Likes and dislikes</label><input className="inp" id="o-p" placeholder="No mushrooms, love spicy food" value={prefs} onChange={e => setPrefs(e.target.value)} /></div>
                        <div className="fld"><label htmlFor="o-al">Allergies</label><input className="inp" id="o-al" placeholder="For example, peanuts" value={allergies} onChange={e => setAllergies(e.target.value)} /></div>
                      </div>
                      <p className="note"><Info className="ic" aria-hidden="true" /><span><b>General information, not medical advice.</b> Talk to your doctor before you start a new plan, especially if you have an injury, a health condition or take medication.</span></p>
                      {formErr && <p className="err top" role="alert">{formErr}</p>}
                    </>
                  )}

                  <div className="nav-row">
                    {(step > 1 || !existingUser) && <button className="btn ghost" type="button" onClick={back}>Back</button>}
                    <button className="btn" type="submit">{step === 3 ? 'Create my plan' : 'Continue'}</button>
                  </div>
                </form>
              </div>
            )}

            {screen === 'generating' && (
              <div className="panel gen" key="gen">
                <div className="pulse-wrap" aria-hidden="true"><Logo size={48} /></div>
                {heading('Building your plan.')}
                <p className="sub">This usually takes 30 to 60 seconds. Please keep this tab open.</p>
                <ul className="todo" aria-live="polite">
                  {TODO.map((label, i) => (
                    <li key={label} className={gen > i ? 'done' : gen === i ? 'doing' : ''}>
                      <span className="dot"><Check className="ic" aria-hidden="true" /></span>{label}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        <aside className="right" onMouseMove={spot} onMouseLeave={unspot} aria-hidden="false">
          <div className="right-in">
            <p className="kick2">Week after week</p>
            <h2 className="disp quote-h">Show up. <em>Then do it again.</em></h2>
            <div className="heat" ref={heatRef} role="group" aria-label="A grid of training days. Tap a square to log a day.">
              {CELLS.map(c => (
                <button
                  type="button"
                  key={c.k}
                  className={`cell l${c.lvl} ${lit[c.k] ? 'on' : ''}`}
                  style={{ ['--x' as string]: c.x, ['--y' as string]: c.y }}
                  aria-pressed={!!lit[c.k]}
                  aria-label={`Day ${c.x * 7 + c.y + 1}`}
                  onClick={() => setLit(l => ({ ...l, [c.k]: !l[c.k] }))}
                />
              ))}
            </div>
            <p className="hmeta">
              {litCount === 0 ? 'Every streak starts with one day. Tap a square.' : `${litCount} day${litCount === 1 ? '' : 's'} logged. Keep it going.`}
            </p>
            <div className="hkey" aria-hidden="true">Less <i /><i /><i /><i /><i /> More</div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default AuthFlow;