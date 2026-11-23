import React, { useMemo, useState } from 'react';
import { Info, Minus, Plus } from 'lucide-react';
import { ProgressLog, WeeklyPlan } from '../../types';
import { formatDate, fromDisplayWeight, getPlanDayIndex, getWeightLabel, toDisplayWeight } from '../../utils';
import { useToast } from '../ui/Toast';
import WeekStrip, { DAYNAMES, isWorkoutDayFull, weekDates } from './WeekStrip';
import './views.css';

interface Props {
  firstName: string;
  plan: WeeklyPlan;
  logs: ProgressLog[];
  units: 'metric' | 'imperial';
  profileWeightKg: number;
  selectedDate: Date;
  onSelectDate: (d: Date) => void;
  isToday: boolean;
  waterIntake: number;
  waterGoal: number;
  onWater: (delta: number) => void;
  onSaveWeight: (kg: number) => void;
  onOpenWorkouts: () => void;
  onOpenMeals: () => void;
}

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
};

const TodayView: React.FC<Props> = ({
  firstName, plan, logs, units, profileWeightKg, selectedDate, onSelectDate, isToday,
  waterIntake, waterGoal, onWater, onSaveWeight, onOpenWorkouts, onOpenMeals,
}) => {
  const toast = useToast();
  const [weightOpen, setWeightOpen] = useState(false);
  const [draft, setDraft] = useState('');

  const week = useMemo(weekDates, [new Date().toDateString()]);
  const todayStr = formatDate(new Date());
  const selStr = formatDate(selectedDate);
  const dayIdx = getPlanDayIndex(selectedDate);
  const day = plan.days?.[dayIdx];
  const exercises = day?.workout?.exercises || [];
  const meals = day?.diet?.meals || [];
  const hasEx = exercises.length > 0;

  const log = logs.find(l => l.date === selStr);
  const details = log?.details || {};
  const doneEx = exercises.filter((_, i) => details[`exercise-${i}`]).length;
  const exPct = hasEx ? Math.round((doneEx / exercises.length) * 100) : 0;

  const target = day?.diet?.totalCalories || 0;
  const eaten = meals.reduce((sum, m, i) => (details[`meal-${i}`] ? sum + (m.calories || 0) : sum), 0);
  const mealPct = target ? Math.min(100, Math.round((eaten / target) * 100)) : 0;
  const nextIdx = meals.findIndex((_, i) => !details[`meal-${i}`]);

  // At most 12 blocks, however big the goal is.
  const glassCount = Math.min(12, Math.max(1, Math.ceil(waterGoal / 250)));
  const glassMl = waterGoal / glassCount;
  const waterPct = Math.min(100, Math.round((waterIntake / waterGoal) * 100));

  // Weekly workout progress: days this week where every exercise is ticked.
  const planWorkoutDays = (plan.days || []).filter(d => (d.workout?.exercises?.length || 0) > 0).length;
  const full = week.map((d, i) => isWorkoutDayFull(plan, logs, d, i));
  const weekDone = full.filter(Boolean).length;
  const weekPct = planWorkoutDays ? Math.min(100, Math.round((weekDone / planWorkoutDays) * 100)) : 0;

  const lastLog = [...logs].sort((a, b) => a.date.localeCompare(b.date)).pop();
  const weightKg = lastLog ? lastLog.weight : profileWeightKg;
  const weightShown = units === 'imperial' ? toDisplayWeight(weightKg, units) : Number(weightKg.toFixed(1));
  const unitLabel = getWeightLabel(units);

  const submitWeight = (e: React.FormEvent) => {
    e.preventDefault();
    const v = parseFloat(draft);
    const kg = fromDisplayWeight(v, units);
    if (!isFinite(v) || kg < 20 || kg > 400) {
      toast.show(`Enter a weight between ${toDisplayWeight(20, units)} and ${toDisplayWeight(400, units)} ${unitLabel}`, 'error');
      return;
    }
    onSaveWeight(kg);
    setDraft('');
    setWeightOpen(false);
    toast.show(`Weight logged: ${v} ${unitLabel}`, 'success');
  };

  const dayLabel = DAYNAMES[dayIdx] + (selStr === todayStr ? ', today' : '');
  const focusTitle = day?.focus || 'Rest day';
  const focusMeta = hasEx && day?.workout?.durationMinutes ? `, ${day.workout.durationMinutes} minutes` : '';

  return (
    <div className="av">
      <div className="view">
        <div className="head">
          <div>
            <h1 className="disp h1">{greeting()}, {firstName}.</h1>
            <p className="sub">{dayLabel}. {focusTitle}{focusMeta}</p>
          </div>
        </div>

        <WeekStrip plan={plan} logs={logs} selectedDate={selectedDate} onSelect={(d) => { onSelectDate(d); setWeightOpen(false); }} />

        <div className="grid">
          <div className="card hov today span2">
            <span className="label">Workout</span>
            <h2 className="disp focus">{focusTitle}</h2>
            <p className="meta">{hasEx ? `${doneEx} of ${exercises.length} exercises done` : 'Recovery day, nothing to log'}</p>
            <div className="bar" role="progressbar" aria-label="Workout progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={exPct}><i style={{ width: `${exPct}%` }} /></div>
            {hasEx && <button type="button" className="btn rest-btn" onClick={onOpenWorkouts}>Open workout</button>}
          </div>

          <div className="card hov">
            <span className="label">Meals</span>
            <div className="big">{eaten.toLocaleString('en-US')}<small>of {target.toLocaleString('en-US')} kcal</small></div>
            <div className="bar"><i style={{ width: `${mealPct}%` }} /></div>
            <div className="meal-next">
              <span className="muted">{meals.length === 0 ? 'No meals planned' : nextIdx === -1 ? 'All meals done' : `Next up, ${meals[nextIdx].type.toLowerCase()}`}</span>
              <b>{meals.length === 0 ? '-' : nextIdx === -1 ? 'Nice work today' : meals[nextIdx].name}</b>
            </div>
            <button type="button" className="btn ghost sm" style={{ marginTop: 14 }} onClick={onOpenMeals}>Open meal plan</button>
          </div>

          <div className="card hov col">
            <span className="label">Water</span>
            <div className="big">{waterIntake.toLocaleString('en-US')}<small>of {waterGoal.toLocaleString('en-US')} ml</small></div>
            <div className="bar blue"><i style={{ width: `${waterPct}%` }} /></div>
            <div className="glasses" aria-hidden="true">
              {Array.from({ length: glassCount }, (_, k) => (
                <i key={k} className={k < Math.floor(waterIntake / glassMl) ? 'on' : ''} />
              ))}
            </div>
            <p className="glass-note">Each block is about {Math.round(glassMl / 50) * 50} ml</p>
            <div className="water-ctl">
              <button type="button" className="btn ghost" onClick={() => onWater(-250)} disabled={!isToday || waterIntake === 0} aria-label="Remove 250 ml"><Minus size={16} aria-hidden="true" />250</button>
              <button type="button" className="btn" onClick={() => onWater(250)} disabled={!isToday} aria-label="Add 250 ml"><Plus size={16} aria-hidden="true" />250 ml</button>
            </div>
            {!isToday && <p className="note-line">You can only log water for today.</p>}
          </div>

          <div className="card hov">
            <span className="label">Weight</span>
            <div className="big">{weightShown}<small>{unitLabel}</small></div>
            {!weightOpen ? (
              <button type="button" className="btn ghost sm" style={{ marginTop: 12 }} onClick={() => setWeightOpen(true)} disabled={!isToday}>Log weight</button>
            ) : (
              <form className="weight-row" onSubmit={submitWeight}>
                <label className="sr" htmlFor="w-in">Today's weight in {unitLabel}</label>
                <input id="w-in" inputMode="decimal" placeholder={unitLabel} value={draft} onChange={e => setDraft(e.target.value)} autoFocus />
                <button className="btn sm" type="submit">Save</button>
              </form>
            )}
            {!isToday && <p className="note-line">You can only log weight for today.</p>}
          </div>

          <div className="card hov">
            <span className="label">This week</span>
            <div className="big">{weekDone}<small>of {planWorkoutDays} days</small></div>
            <div className="bar"><i style={{ width: `${weekPct}%` }} /></div>
            <p className="muted" style={{ margin: '12px 0 0', fontSize: 14 }}>Workout days finished</p>
          </div>
        </div>

        <p className="legal"><Info size={18} aria-hidden="true" /><span>General fitness and nutrition information, not medical advice. Check with your doctor before you start a new plan.</span></p>
      </div>
    </div>
  );
};

export default TodayView;