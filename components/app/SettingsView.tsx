import React, { useMemo, useState } from 'react';
import { Info, LogOut, Minus, Plus, X } from 'lucide-react';
import { ActivityLevel, DietType, Goal, User, UserProfile, WeeklyPlan } from '../../types';
import { GeminiService } from '../../services/geminiService';
import { Dropdown } from '../ui/Dropdown';
import { useToast } from '../ui/Toast';
import {
  DIETARY_RESTRICTIONS, MAX_WATER_GOAL, MIN_WATER_GOAL, fromDisplayWeight, getWaterGoal, getWeightLabel, toDisplayHeight, toDisplayWeight,
} from '../../utils';
import './views.css';

interface Props {
  user: User;
  onUpdateProfile: (profile: UserProfile) => void;
  onUpdatePlan: (plan: WeeklyPlan) => void | Promise<void>;
  onLogout: () => void;
}

const num = (s: string) => parseFloat(s.replace(',', '.'));
const round1 = (n: number) => Math.round(n * 10) / 10;

const SettingsView: React.FC<Props> = ({ user, onUpdateProfile, onUpdatePlan, onLogout }) => {
  const toast = useToast();
  const base = user.profile!;
  const [name, setName] = useState(base.name || '');
  const [age, setAge] = useState(String(base.age ?? ''));
  const [units, setUnits] = useState<'metric' | 'imperial'>(base.units || 'metric');
  const [weight, setWeight] = useState(String(round1(toDisplayWeight(base.weight || 0, base.units || 'metric'))));
  const [height, setHeight] = useState(String(base.height ?? ''));
  const [goal, setGoal] = useState<Goal>(base.goal);
  const [diet, setDiet] = useState<DietType>(base.dietType);
  const [activity, setActivity] = useState<ActivityLevel>(base.activityLevel);
  const [restrictions, setRestrictions] = useState<string[]>(base.restrictions || []);
  const [custom, setCustom] = useState('');
  const [equipment, setEquipment] = useState(base.equipment || '');
  const [injuries, setInjuries] = useState(base.injuries || '');
  const [allergies, setAllergies] = useState(base.allergies || '');
  const [water, setWater] = useState(getWaterGoal(base));
  const [busy, setBusy] = useState<'save' | 'plan' | null>(null);

  // Switching units keeps the same real weight, just shown in the other unit.
  const switchUnits = (u: 'metric' | 'imperial') => {
    if (u === units) return;
    const w = num(weight);
    if (isFinite(w)) setWeight(String(round1(toDisplayWeight(fromDisplayWeight(w, units), u))));
    setUnits(u);
  };

  const next: UserProfile = useMemo(() => {
    const kg = fromDisplayWeight(num(weight), units);
    return {
      ...base,
      name: name.trim(),
      age: Math.round(num(age)),
      units,
      weight: isFinite(kg) ? parseFloat(kg.toFixed(2)) : NaN,
      height: Math.round(num(height)),
      goal, dietType: diet, activityLevel: activity,
      restrictions,
      equipment: equipment.trim(), injuries: injuries.trim(), allergies: allergies.trim(),
      waterGoal: water,
    };
  }, [base, name, age, units, weight, height, goal, diet, activity, restrictions, equipment, injuries, allergies, water]);

  const norm = (p: UserProfile) => JSON.stringify({ ...p, waterGoal: getWaterGoal(p), restrictions: [...(p.restrictions || [])].sort() });
  const dirty = norm(next) !== norm(base);
  const planFields: (keyof UserProfile)[] = ['goal', 'dietType', 'activityLevel', 'injuries', 'allergies', 'equipment', 'age', 'weight', 'height'];
  const needsPlan =
    planFields.some(f => next[f] !== base[f]) ||
    [...next.restrictions].sort().join('|') !== [...(base.restrictions || [])].sort().join('|');

  const validate = (): string | null => {
    if (!next.name) return 'Please enter your name.';
    if (!(next.age >= 13 && next.age <= 100)) return 'Age should be between 13 and 100.';
    if (!(next.weight >= 20 && next.weight <= 400)) return 'Enter a realistic weight.';
    if (!(next.height >= 100 && next.height <= 250)) return 'Height should be between 100 and 250 cm.';
    return null;
  };

  const save = async (regenerate: boolean) => {
    if (busy) return;
    const problem = validate();
    if (problem) { toast.show(problem, 'error'); return; }
    setBusy(regenerate ? 'plan' : 'save');
    // The profile is saved first, so it is kept even if building the plan fails.
    onUpdateProfile(next);
    if (!regenerate) { toast.show('Profile saved', 'success'); setBusy(null); return; }
    try {
      const plan = await GeminiService.generateWeeklyPlan(next);
      await onUpdatePlan(plan);
      toast.show('Profile saved and your new plan is ready', 'success');
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Your profile was saved, but the new plan could not be built.', 'error');
    }
    setBusy(null);
  };

  const toggleR = (r: string) => setRestrictions(c => (c.includes(r) ? c.filter(x => x !== r) : [...c, r]));
  const addCustom = () => {
    const v = custom.trim();
    if (v && !restrictions.includes(v)) setRestrictions(c => [...c, v]);
    setCustom('');
  };
  const nudgeWater = (d: number) => setWater(w => Math.min(MAX_WATER_GOAL, Math.max(MIN_WATER_GOAL, w + d)));
  const glasses = Math.round((water / 250) * 10) / 10;

  return (
    <div className="av">
      <div className="view">
        <div className="head">
          <div>
            <h1 className="disp h1">Settings</h1>
            <p className="sub">Your profile drives your plan and your coach.</p>
          </div>
        </div>

        <div className="stack">
          <div className="card">
            <h2 className="disp sec-t">Account</h2>
            <div className="fields">
              <div className="fld"><label htmlFor="s-name">Name</label><input id="s-name" className="inp" value={name} maxLength={60} onChange={e => setName(e.target.value)} /></div>
              <div className="fld"><label htmlFor="s-mail">Email</label><input id="s-mail" className="inp" value={user.email} disabled /></div>
            </div>
            <div className="fld" style={{ marginTop: 14 }}>
              <span className="lbl">Units</span>
              <div className="seg" role="group" aria-label="Units">
                <button type="button" aria-pressed={units === 'metric'} onClick={() => switchUnits('metric')}>Metric</button>
                <button type="button" aria-pressed={units === 'imperial'} onClick={() => switchUnits('imperial')}>Imperial</button>
              </div>
              <p className="hint">{units === 'metric' ? 'Weight in kg, height in cm.' : 'Weight in lb, height also shown in feet and inches.'}</p>
            </div>
          </div>

          <div className="card water-card">
            <h2 className="disp sec-t">Daily water goal</h2>
            <p className="muted wd-desc">Used on your Today tab and the Progress charts.</p>
            <div className="stepper">
              <button type="button" className="icon-btn" aria-label="Decrease goal by 250 ml" onClick={() => nudgeWater(-250)} disabled={water <= MIN_WATER_GOAL}><Minus size={18} aria-hidden="true" /></button>
              <div className="st-v" aria-live="polite"><b>{water.toLocaleString('en-US')}</b><span>ml, about {glasses} glasses</span></div>
              <button type="button" className="icon-btn" aria-label="Increase goal by 250 ml" onClick={() => nudgeWater(250)} disabled={water >= MAX_WATER_GOAL}><Plus size={18} aria-hidden="true" /></button>
            </div>
            <div className="chips" style={{ marginTop: 12 }}>
              {[2000, 2500, 3000, 3500].map(v => (
                <button key={v} type="button" className="chp" aria-pressed={water === v} onClick={() => setWater(v)}>{(v / 1000).toFixed(1)} L</button>
              ))}
            </div>
          </div>

          <div className="card">
            <h2 className="disp sec-t">Plan inputs</h2>
            <div className="fields">
              <div className="fld"><label htmlFor="s-age">Age</label><input id="s-age" className="inp" inputMode="numeric" value={age} onChange={e => setAge(e.target.value)} /></div>
              <div className="fld"><label htmlFor="s-w">Weight ({getWeightLabel(units)})</label><input id="s-w" className="inp" inputMode="decimal" value={weight} onChange={e => setWeight(e.target.value)} /></div>
              <div className="fld">
                <label htmlFor="s-h">Height (cm)</label>
                <input id="s-h" className="inp" inputMode="numeric" value={height} onChange={e => setHeight(e.target.value)} />
                {units === 'imperial' && isFinite(num(height)) && <p className="hint">That is {toDisplayHeight(num(height), 'imperial').text}</p>}
              </div>
              <Dropdown label="Activity level" value={activity} onChange={v => setActivity(v as ActivityLevel)} options={Object.values(ActivityLevel).map(v => ({ value: v, label: v }))} />
              <Dropdown label="Goal" value={goal} onChange={v => setGoal(v as Goal)} options={Object.values(Goal).map(v => ({ value: v, label: v }))} />
              <Dropdown label="Diet type" value={diet} onChange={v => setDiet(v as DietType)} options={Object.values(DietType).map(v => ({ value: v, label: v }))} />
              <div className="fld"><label htmlFor="s-e">Equipment</label><input id="s-e" className="inp" value={equipment} maxLength={200} onChange={e => setEquipment(e.target.value)} /></div>
              <div className="fld"><label htmlFor="s-i">Injuries or limits</label><input id="s-i" className="inp" value={injuries} maxLength={300} onChange={e => setInjuries(e.target.value)} /></div>
              <div className="fld span2"><label htmlFor="s-a">Allergies</label><input id="s-a" className="inp" value={allergies} maxLength={300} onChange={e => setAllergies(e.target.value)} /></div>
            </div>

            <div className="fld" style={{ marginTop: 18 }}>
              <span className="lbl">Dietary restrictions</span>
              <div className="chips">
                {DIETARY_RESTRICTIONS.map(r => (
                  <button key={r} type="button" className="chp" aria-pressed={restrictions.includes(r)} onClick={() => toggleR(r)}>{r}</button>
                ))}
                {restrictions.filter(r => !DIETARY_RESTRICTIONS.includes(r)).map(r => (
                  <button key={r} type="button" className="chp" aria-pressed="true" aria-label={`Remove ${r}`} onClick={() => toggleR(r)}>{r}<X size={14} aria-hidden="true" /></button>
                ))}
              </div>
              <div className="add-row">
                <input className="inp" aria-label="Add a custom restriction" placeholder="Add your own, e.g. no cilantro" value={custom} maxLength={40} onChange={e => setCustom(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustom(); } }} />
                <button type="button" className="btn ghost" onClick={addCustom} disabled={!custom.trim()}>Add</button>
              </div>
            </div>

            {needsPlan && (
              <p className="note"><Info size={18} aria-hidden="true" /><span>These changes affect your plan. You can build a new plan from them now. There is a limit of 10 new plans a day.</span></p>
            )}
            <div className="row" style={{ marginTop: 16 }}>
              {needsPlan && <button type="button" className="btn" onClick={() => save(true)} disabled={!!busy}>{busy === 'plan' ? 'Building your plan…' : 'Save and build new plan'}</button>}
              <button type="button" className={needsPlan ? 'btn ghost' : 'btn'} onClick={() => save(false)} disabled={!!busy || !dirty}>{busy === 'save' ? 'Saving…' : needsPlan ? 'Save only' : 'Save changes'}</button>
            </div>
          </div>

          <div className="card">
            <h2 className="disp sec-t">Session</h2>
            <div className="row">
              <button type="button" className="btn danger-soft" onClick={onLogout}><LogOut size={16} aria-hidden="true" />Log out</button>
            </div>
          </div>
        </div>

        <p className="legal"><Info size={18} aria-hidden="true" /><span>FitTrack gives general fitness and nutrition information, not medical advice. Check with your doctor before you start, especially if you have an injury, a health condition or take medication.</span></p>
      </div>
    </div>
  );
};

export default SettingsView;