import React, { useState } from 'react';
import { Check, ChevronDown, Info, Play } from 'lucide-react';
import { ProgressLog, WeeklyPlan } from '../../types';
import { formatDate, getPlanDayIndex } from '../../utils';
import WeekStrip, { DAYNAMES } from './WeekStrip';
import './views.css';

interface Props {
  plan: WeeklyPlan;
  logs: ProgressLog[];
  selectedDate: Date;
  onSelectDate: (d: Date) => void;
  isToday: boolean;
  onToggleMeal: (idx: number) => void;
  searchLink: (query: string) => string;
}

const MealsView: React.FC<Props> = ({ plan, logs, selectedDate, onSelectDate, isToday, onToggleMeal, searchLink }) => {
  const [open, setOpen] = useState<number | null>(null);
  const dayIdx = getPlanDayIndex(selectedDate);
  const day = plan.days?.[dayIdx];
  const meals = day?.diet?.meals || [];
  const target = day?.diet?.totalCalories || meals.reduce((s, m) => s + (m.calories || 0), 0);
  const details = logs.find(l => l.date === formatDate(selectedDate))?.details || {};
  const doneCount = meals.filter((_, i) => details[`meal-${i}`]).length;
  const eaten = meals.reduce((s, m, i) => (details[`meal-${i}`] ? s + (m.calories || 0) : s), 0);
  const pct = target ? Math.min(100, Math.round((eaten / target) * 100)) : 0;
  const isTodaySel = formatDate(selectedDate) === formatDate(new Date());

  return (
    <div className="av">
      <div className="view">
        <div className="head">
          <div>
            <h1 className="disp h1">Meal plan</h1>
            <p className="sub">{DAYNAMES[dayIdx]}{isTodaySel ? ', today' : ''}. {target.toLocaleString('en-US')} kcal target.</p>
          </div>
        </div>

        <WeekStrip plan={plan} logs={logs} selectedDate={selectedDate} onSelect={(d) => { onSelectDate(d); setOpen(null); }} />

        <div className="card" style={{ marginBottom: 14 }}>
          <div className="row-between">
            <span className="label">{isTodaySel ? 'Eaten today' : 'Eaten'}</span>
            <span className="muted">{doneCount} of {meals.length} meals</span>
          </div>
          <div className="big" style={{ marginTop: 8 }}>{eaten.toLocaleString('en-US')}<small>of {target.toLocaleString('en-US')} kcal</small></div>
          <div className="bar"><i style={{ width: `${pct}%` }} /></div>
        </div>

        <div className="sticky-sum">
          <span className="muted">{isToday ? 'Tap a circle when you have eaten a meal' : 'You can tick meals for today only'}</span>
          <span className="muted">Tap a meal for the recipe</span>
        </div>

        {meals.length > 0 ? (
          <div className="list">
            {meals.map((m, i) => {
              const done = !!details[`meal-${i}`];
              const isOpen = open === i;
              return (
                <div key={`${i}-${m.name}`} className={`ex ml ${done ? 'done' : ''} ${isOpen ? 'open' : ''}`}>
                  <div className="ex-head">
                    <button type="button" className="chk" aria-pressed={done} aria-label={`Mark ${m.name} eaten`} onClick={() => onToggleMeal(i)}>
                      <span><Check size={16} aria-hidden="true" /></span>
                    </button>
                    <button type="button" className="ex-main" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : i)}>
                      <span className="ml-t">{m.type} · {m.calories} kcal</span>
                      <span className="nm">{m.name}</span>
                      {m.recipeStub && <span className="sc">{m.recipeStub}</span>}
                    </button>
                    <button type="button" className="chev" aria-label={`Show recipe for ${m.name}`} aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : i)}>
                      <ChevronDown size={20} aria-hidden="true" />
                    </button>
                  </div>
                  <div className={`xp ${isOpen ? 'open' : ''}`}>
                    <div>
                      <div className="xp-in">
                        <div className="cols">
                          <div>
                            <h4>Ingredients</h4>
                            {m.ingredients?.length ? <ul>{m.ingredients.map((g, k) => <li key={k}>{g}</li>)}</ul> : <p className="muted">Not available.</p>}
                          </div>
                          <div>
                            <h4>Instructions</h4>
                            {m.instructions?.length ? <ol>{m.instructions.map((g, k) => <li key={k}>{g}</li>)}</ol> : <p className="muted">Not available.</p>}
                          </div>
                        </div>
                        <div className="acts">
                          <a className="link" href={searchLink(m.name)} target="_blank" rel="noopener noreferrer"><Play size={16} aria-hidden="true" />Watch cooking video</a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="card empty">
            <h3 className="disp">No meals planned</h3>
            <p className="muted" style={{ maxWidth: '30em', margin: '10px auto 0' }}>There are no meals in the plan for this day.</p>
          </div>
        )}

        <p className="legal"><Info size={18} aria-hidden="true" /><span>Meal and calorie suggestions are general information, not medical or dietary advice. Check with your doctor or a dietitian if you have a health condition, allergy or take medication.</span></p>
      </div>
    </div>
  );
};

export default MealsView;