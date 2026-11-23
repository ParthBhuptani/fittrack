import React, { useMemo, useState } from 'react';
import { FileText } from 'lucide-react';
import { ProgressLog, WeeklyPlan } from '../../types';
import { formatDate, getPlanDayIndex, getWeightLabel, toDisplayWeight } from '../../utils';
import './views.css';

interface Props {
  plan: WeeklyPlan;
  logs: ProgressLog[];
  streak: number;
  units: 'metric' | 'imperial';
  waterGoal: number;
  onReport: () => void;
}

interface Day {
  date: Date;
  short: string;
  full: string;
  pct: number;      // share of the day's exercises and meals that were ticked
  rest: boolean;    // no exercises planned that day
  exDone: number; exTotal: number; mDone: number; mTotal: number;
  water: number;
  kg: number | null; // last known weight on or before this day (in the user's units)
  logged: boolean;
}

const edge = (i: number, n: number) => (i < n * 0.18 ? 'el' : i > n * 0.82 ? 'er' : '');

const ProgressView: React.FC<Props> = ({ plan, logs, streak, units, waterGoal, onReport }) => {
  const [range, setRange] = useState<7 | 30>(7);
  const unit = getWeightLabel(units);
  const todayStr = formatDate(new Date());

  const days: Day[] = useMemo(() => {
    const byDate = new Map<string, ProgressLog>(logs.map(l => [l.date, l] as [string, ProgressLog]));
    // The weight that was known before the range starts, so the line does not begin empty.
    const sorted = [...logs].filter(l => l.weight > 0).sort((a, b) => a.date.localeCompare(b.date));
    const now = new Date();
    const first = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (range - 1));
    let carry: number | null = null;
    for (const l of sorted) { if (l.date < formatDate(first)) carry = l.weight; }
    return Array.from({ length: range }, (_, i) => {
      const date = new Date(first.getFullYear(), first.getMonth(), first.getDate() + i);
      const log = byDate.get(formatDate(date));
      const pd = plan.days?.[getPlanDayIndex(date)];
      const exTotal = pd?.workout?.exercises?.length || 0;
      const mTotal = pd?.diet?.meals?.length || 0;
      const det = log?.details || {};
      let exDone = 0, mDone = 0;
      for (let k = 0; k < exTotal; k++) if (det[`exercise-${k}`]) exDone++;
      for (let k = 0; k < mTotal; k++) if (det[`meal-${k}`]) mDone++;
      const total = exTotal + mTotal;
      if (log && log.weight > 0) carry = log.weight;
      return {
        date,
        short: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        full: date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }),
        pct: total ? Math.round(((exDone + mDone) / total) * 100) : 0,
        rest: exTotal === 0,
        exDone, exTotal, mDone, mTotal,
        water: log?.waterIntake || 0,
        kg: carry === null ? null : Math.round(toDisplayWeight(carry, units) * 10) / 10,
        logged: !!log,
      };
    });
  }, [logs, plan, range, units]);

  const n = days.length;
  // Week: a label under every bar. Month: five evenly spaced dates. Each label sits under its own bar.
  const tickIdx = n === 7 ? [0, 1, 2, 3, 4, 5, 6] : [0, 1, 2, 3, 4].map(k => Math.round((k * (n - 1)) / 4));
  const XAxis = () => (
    <div className="xl" aria-hidden="true">
      {tickIdx.map(i => (
        <span key={i} style={{ left: `${((i + 0.5) / n) * 100}%` }}>{n === 7 ? days[i].date.toLocaleDateString('en-US', { weekday: 'short' }) : days[i].short}</span>
      ))}
    </div>
  );
  const anyLog = days.some(d => d.logged);

  const workoutDays = days.filter(d => !d.rest && d.pct >= 50).length;
  const waterDays = days.filter(d => d.water > 0);
  const avgWater = waterDays.length ? Math.round(waterDays.reduce((s, d) => s + d.water, 0) / waterDays.length / 10) * 10 : 0;

  // Water axis: whole litres, always at least up to the goal.
  const maxWater = Math.max(waterGoal, ...days.map(d => d.water));
  const waterTop = Math.ceil(maxWater / 1000) * 1000;
  const waterGrid = Array.from({ length: waterTop / 1000 + 1 }, (_, k) => k * 1000);

  // Weight axis: three even steps around the data.
  const known = days.filter(d => d.kg !== null).map(d => d.kg as number);
  const wMin = known.length ? Math.min(...known) : 0;
  const wMax = known.length ? Math.max(...known) : 0;
  const lo = Math.floor(wMin - 0.3);
  const step = Math.max(1, Math.ceil((wMax + 0.3 - lo) / 3));
  const hi = lo + step * 3;
  const wy = (v: number) => 100 - ((v - lo) / (hi - lo)) * 100;
  const px = (i: number) => ((i + 0.5) / n) * 100;
  const pts = days.map((d, i) => (d.kg === null ? null : `${px(i).toFixed(2)},${wy(d.kg).toFixed(2)}`)).filter(Boolean) as string[];
  const firstK = days.findIndex(d => d.kg !== null);
  let lastK = -1;
  days.forEach((d, i) => { if (d.kg !== null) lastK = i; });
  const delta = known.length > 1 ? (days[lastK].kg as number) - (days[firstK].kg as number) : 0;

  const Pop: React.FC<{ title: string; a: string; b: string }> = ({ title, a, b }) => (
    <div className="pop"><b>{title}</b><span>{a}</span><em>{b}</em></div>
  );

  return (
    <div className="av">
      <div className="view">
        <div className="head">
          <div>
            <h1 className="disp h1">Progress</h1>
            <p className="sub">{range === 7 ? 'Last 7 days' : 'Last 30 days'}</p>
          </div>
          <div className="row">
            <div className="seg" role="group" aria-label="Range">
              <button type="button" aria-pressed={range === 7} onClick={() => setRange(7)}>Week</button>
              <button type="button" aria-pressed={range === 30} onClick={() => setRange(30)}>Month</button>
            </div>
            <button type="button" className="btn ghost sm" onClick={onReport}><FileText size={16} aria-hidden="true" />Report</button>
          </div>
        </div>

        <div className="stats">
          <div className="card"><span className="label">Workouts</span><div className="big">{workoutDays}</div><p className="muted"><span className="d-only">days over 50% done</span><span className="m-only">days done</span></p></div>
          <div className="card"><span className="label">Water</span><div className="big">{avgWater ? avgWater.toLocaleString('en-US') : '–'}</div><p className="muted"><span className="d-only">ml average on days you logged</span><span className="m-only">ml average</span></p></div>
          <div className="card"><span className="label">Streak</span><div className="big">{streak}</div><p className="muted"><span className="d-only">{streak === 1 ? 'day' : 'days'} in a row</span><span className="m-only">{streak === 1 ? 'day' : 'days'}</span></p></div>
        </div>

        {!anyLog && (
          <div className="card note-empty">
            <b>Nothing logged in this period yet.</b> Tick a workout or meal, or add some water, and your charts fill in here.
          </div>
        )}

        <div className="card" style={{ marginBottom: 14 }}>
          <h3 className="disp ch">Daily completion</h3>
          <p className="muted cs">Share of the day's workout and meals you finished.</p>
          <div className="chart">
            {[0, 50, 100].map(v => <div key={v} className="gl" style={{ top: `${100 - v}%` }}><b>{v}%</b></div>)}
            <div className="bars">
              {days.map((d, i) => (
                <div key={i} className={`hz ${edge(i, n)}`}>
                  <i style={{ height: `${d.pct}%`, animationDelay: `${i * 12}ms` }} />
                  <Pop title={d.full} a={d.rest && !d.mTotal ? 'Rest day' : `${d.pct}% complete`} b={d.rest ? `${d.mDone} of ${d.mTotal} meals` : `${d.exDone} of ${d.exTotal} exercises, ${d.mDone} of ${d.mTotal} meals`} />
                </div>
              ))}
            </div>
          </div>
          <XAxis />
        </div>

        <div className="grid one">
          <div className="card">
            <h3 className="disp ch">Weight</h3>
            <p className="muted cs">
              {known.length > 1 ? `${delta <= 0 ? 'Down' : 'Up'} ${Math.abs(delta).toFixed(1)} ${unit} over ${n} days.` : known.length === 1 ? 'Log your weight on the Today tab to see the trend.' : 'No weight logged yet.'}
            </p>
            <div className="chart">
              {known.length > 0 && [0, 1, 2, 3].map(k => <div key={k} className="gl" style={{ top: `${wy(lo + step * k)}%` }}><b>{lo + step * k}</b></div>)}
              {pts.length > 1 && (
                <svg className="lsvg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                  <polygon points={`${px(firstK).toFixed(2)},100 ${pts.join(' ')} ${px(lastK).toFixed(2)},100`} />
                  <polyline points={pts.join(' ')} />
                </svg>
              )}
              <div className="bars wl">
                {days.map((d, i) => {
                  const prev = i > 0 ? days[i - 1].kg : null;
                  const dv = d.kg !== null && prev !== null ? d.kg - prev : null;
                  return (
                    <div key={i} className={`hz ${edge(i, n)} ${i === lastK ? 'last' : ''}`} style={{ ['--y' as string]: d.kg !== null ? `${wy(d.kg)}%` : '0%' }}>
                      {d.kg !== null && <span className="pdot" />}
                      {d.kg !== null && <Pop title={d.full} a={`${d.kg.toFixed(1)} ${unit}`} b={dv === null ? 'First reading' : dv === 0 ? 'No change' : `${dv < 0 ? 'Down' : 'Up'} ${Math.abs(dv).toFixed(1)} ${unit}`} />}
                    </div>
                  );
                })}
              </div>
            </div>
            <XAxis />
          </div>

          <div className="card">
            <h3 className="disp ch">Water</h3>
            <p className="muted cs">Daily intake against your goal.</p>
            <div className="chart">
              {waterGrid.map(v => <div key={v} className="gl" style={{ top: `${100 - (v / waterTop) * 100}%` }}><b>{v / 1000}L</b></div>)}
              <div className="bars blue">
                {days.map((d, i) => (
                  <div key={i} className={`hz ${edge(i, n)}`}>
                    <i style={{ height: `${Math.round((d.water / waterTop) * 100)}%`, animationDelay: `${i * 12}ms` }} />
                    <Pop title={d.full} a={`${d.water.toLocaleString('en-US')} ml`} b={d.water >= waterGoal ? 'Goal met' : `${Math.round((d.water / waterGoal) * 100)}% of goal`} />
                  </div>
                ))}
              </div>
              <div className="goal" style={{ top: `${100 - (waterGoal / waterTop) * 100}%` }} />
            </div>
            <XAxis />
            <div className="key"><span>Goal {waterGoal.toLocaleString('en-US')} ml</span></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgressView;