import { useMemo } from 'react';
import type { WeeklyPlan, DailyLearningPlan, DailyTask } from '../types';
import { dateUtils } from '../utils/scheduler';

interface WeeklyCalendarProps {
  weeklyPlan: WeeklyPlan;
  onTaskToggle: (materialId: string, date: string, completed: boolean) => void;
  onTaskClick: (task: DailyTask, date: string) => void;
  completedTasks: Set<string>;
}

export function WeeklyCalendar({
  weeklyPlan,
  onTaskToggle,
  onTaskClick,
  completedTasks,
}: WeeklyCalendarProps) {
  const today = useMemo(() => dateUtils.formatDate(new Date()), []);

  return (
    <div className="glass-card p-6 space-y-6">
      {/* 주간 헤더 */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white text-shadow">
          이번 주 학습 계획
        </h2>
        <div className="text-sm text-white/70">
          {dateUtils.formatDate(weeklyPlan.weekStart)} ~{' '}
          {dateUtils.formatDate(weeklyPlan.weekEnd)}
        </div>
      </div>

      {/* 요일별 학습 계획 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
        {weeklyPlan.days.map((day) => (
          <DayCard
            key={day.date}
            day={day}
            isToday={day.date === today}
            onTaskToggle={onTaskToggle}
            onTaskClick={onTaskClick}
            completedTasks={completedTasks}
          />
        ))}
      </div>
    </div>
  );
}

interface DayCardProps {
  day: DailyLearningPlan;
  isToday: boolean;
  onTaskToggle: (materialId: string, date: string, completed: boolean) => void;
  onTaskClick: (task: DailyTask, date: string) => void;
  completedTasks: Set<string>;
}

function DayCard({
  day,
  isToday,
  onTaskToggle,
  onTaskClick,
  completedTasks,
}: DayCardProps) {
  const isPast = useMemo(() => {
    const dayDate = new Date(day.date);
    return dateUtils.isPast(dayDate) && !isToday;
  }, [day.date, isToday]);

  const completedCount = day.tasks.filter((task) =>
    completedTasks.has(`${task.materialId}-${day.date}`)
  ).length;

  const totalTasks = day.tasks.length;
  const progressPercent =
    totalTasks > 0 ? (completedCount / totalTasks) * 100 : 0;

  return (
    <div
      className={`
        glass-card p-4 space-y-3 transition-all
        ${isToday ? 'ring-2 ring-primary-400 bg-primary-500/20' : ''}
        ${isPast ? 'opacity-60' : ''}
      `}
    >
      {/* 요일 헤더 */}
      <div className="text-center pb-2 border-b border-white/20">
        <div className="text-xs text-white/60 mb-1">
          {day.date.split('-').slice(1).join('/')}
        </div>
        <div
          className={`text-lg font-bold ${
            isToday ? 'text-primary-300' : 'text-white'
          }`}
        >
          {day.dayOfWeek}
        </div>
        {isToday && (
          <div className="text-xs text-primary-300 mt-1">오늘</div>
        )}
      </div>

      {/* 진행도 바 (휴리스틱 #1: 시스템 상태 시각화) */}
      {totalTasks > 0 && (
        <div className="space-y-1">
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary-400 to-secondary-400 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="text-xs text-white/70 text-center">
            {completedCount}/{totalTasks} 완료
          </div>
        </div>
      )}

      {/* 학습 과제 목록 */}
      <div className="space-y-2 custom-scrollbar max-h-48 overflow-y-auto">
        {day.tasks.length === 0 ? (
          <div className="text-center text-white/40 text-sm py-4">
            학습 계획 없음
          </div>
        ) : (
          day.tasks.map((task) => (
            <TaskItem
              key={`${task.materialId}-${day.date}`}
              task={task}
              date={day.date}
              onToggle={onTaskToggle}
              onClick={onTaskClick}
              isCompleted={completedTasks.has(`${task.materialId}-${day.date}`)}
            />
          ))
        )}
      </div>
    </div>
  );
}

interface TaskItemProps {
  task: DailyTask;
  date: string;
  onToggle: (materialId: string, date: string, completed: boolean) => void;
  onClick: (task: DailyTask, date: string) => void;
  isCompleted: boolean;
}

function TaskItem({ task, date, onToggle, onClick, isCompleted }: TaskItemProps) {
  return (
    <div
      className={`
        w-full p-3 rounded-lg border transition-all
        ${
          isCompleted
            ? 'bg-white/10 border-white/20'
            : 'bg-white/5 border-white/10 hover:bg-white/10'
        }
      `}
    >
      <div className="flex items-start gap-2">
        {/* 체크박스 (휴리스틱 #6: 직관적 인터랙션) */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggle(task.materialId, date, !isCompleted);
          }}
          className={`
            flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all mt-0.5
            ${
              isCompleted
                ? 'bg-primary-500 border-primary-500'
                : 'border-white/30 hover:border-white/50'
            }
          `}
        >
          {isCompleted && (
            <svg
              className="w-3 h-3 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </svg>
          )}
        </button>

        <button
          onClick={() => onClick(task, date)}
          className="flex-1 min-w-0 text-left"
        >
          <div
            className={`
              text-sm font-medium
              ${isCompleted ? 'text-white/50 line-through' : 'text-white'}
            `}
          >
            {task.materialTitle}
          </div>
          <div className="text-xs text-white/60 mt-1">{task.description}</div>
        </button>
      </div>
    </div>
  );
}
