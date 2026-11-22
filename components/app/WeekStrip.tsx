import React, { useMemo } from 'react';
import { ProgressLog, WeeklyPlan } from '../../types';
import { formatDate } from '../../utils';

export const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
export const DAYNAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// The days of the current week, Monday to Sunday, as real dates.
export const weekDates = (): Date[] => {
  const now = new Date();
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i));
};

// True when every exercise planned for that weekday is ticked in that day's log.
export const isWorkoutDayFull = (plan: WeeklyPlan, logs: ProgressLog[], date: Date, planIdx: number) => {
  const ex = plan.days?.[planIdx]?.workout?.exercises || [];
  if (!ex.length) return false;
  const l = logs.find(x => x.date === formatDate(date));
  return !!l && ex.every((_, k) => l.details?.[`exercise-${k}`]);
};

interface Props {
  plan: WeeklyPlan;
  logs: ProgressLog[];
  selectedDate: Date;
  onSelect: (d: Date) => void;
}

const WeekStrip: React.FC<Props> = ({ plan, logs, selectedDate, onSelect }) => {
  const todayStr = formatDate(new Date());
  const week = useMemo(weekDates, [todayStr]);
  const selStr = formatDate(selectedDate);
  return (
    <div className="week" role="group" aria-label="Pick a day">
      {week.map((d, i) => {
        const full = isWorkoutDayFull(plan, logs, d, i);
        const ds = formatDate(d);
        return (
          <button key={i} type="button" className="wd" aria-pressed={ds === selStr} aria-label={DAYNAMES[i]} onClick={() => onSelect(d)}>
            <span className="dl">{DAYS[i]}</span><span className="ds">{DAYS[i][0]}</span>
            <i className={full ? 'full' : ds === todayStr ? 'today' : ''} />
          </button>
        );
      })}
    </div>
  );
};

export default WeekStrip;