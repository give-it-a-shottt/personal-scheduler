import { useMemo } from 'react';
import type { WeeklyPlan, DailyTask } from '../types';
import { dateUtils } from '../utils/scheduler';

interface TodayTasksProps {
  weeklyPlan: WeeklyPlan;
  completedTasks: Set<string>;
  onTaskClick: (task: DailyTask, date: string) => void;
}

export function TodayTasks({
  weeklyPlan,
  completedTasks,
  onTaskClick,
}: TodayTasksProps) {
  const todayData = useMemo(() => {
    const today = dateUtils.formatDate(new Date());
    const todayPlan = weeklyPlan.days.find((day) => day.date === today);

    if (!todayPlan) {
      return {
        date: today,
        tasks: [],
        incompleteTasks: [],
        totalTasks: 0,
        completedCount: 0,
      };
    }

    const incompleteTasks = todayPlan.tasks.filter(
      (task) => !completedTasks.has(`${task.materialId}-${today}`)
    );

    const completedCount = todayPlan.tasks.length - incompleteTasks.length;

    return {
      date: today,
      tasks: todayPlan.tasks,
      incompleteTasks,
      totalTasks: todayPlan.tasks.length,
      completedCount,
    };
  }, [weeklyPlan, completedTasks]);

  if (todayData.totalTasks === 0) {
    return (
      <div className="glass-card p-6">
        <h2 className="text-xl font-bold text-white mb-4">오늘의 학습 📅</h2>
        <div className="text-center py-8">
          <div className="text-4xl mb-3">🎉</div>
          <p className="text-white/60">오늘은 학습 계획이 없습니다</p>
        </div>
      </div>
    );
  }

  const progressPercent = Math.round(
    (todayData.completedCount / todayData.totalTasks) * 100
  );

  return (
    <div className="glass-card p-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white">오늘의 학습 📅</h2>
        <div className="text-sm text-white/70">
          {todayData.completedCount}/{todayData.totalTasks} 완료
        </div>
      </div>

      {/* 진행도 바 */}
      <div className="mb-4">
        <div className="h-3 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary-400 to-secondary-400 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="text-xs text-white/60 text-right mt-1">
          {progressPercent}% 완료
        </div>
      </div>

      {/* 미완료 과제 목록 */}
      {todayData.incompleteTasks.length > 0 ? (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-white/80 mb-2">
            📋 미완료 과제 ({todayData.incompleteTasks.length}개)
          </h3>
          <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
            {todayData.incompleteTasks.map((task) => (
              <button
                key={`${task.materialId}-${todayData.date}`}
                onClick={() => onTaskClick(task, todayData.date)}
                className="w-full text-left glass-card-hover p-4 group"
              >
                <div className="flex items-start gap-3">
                  {/* 아이콘 */}
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-lg">
                    {task.materialType === 'book' ? '📖' : '🎬'}
                  </div>

                  {/* 내용 */}
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-medium mb-1 group-hover:text-primary-300 transition-colors">
                      {task.materialTitle}
                    </div>
                    <div className="text-white/60 text-sm">
                      {task.description}
                    </div>
                  </div>

                  {/* 화살표 */}
                  <div className="flex-shrink-0 text-white/40 group-hover:text-white/60 transition-colors">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="text-4xl mb-3">✅</div>
          <p className="text-white font-semibold mb-1">모든 과제 완료!</p>
          <p className="text-white/60 text-sm">오늘도 수고하셨습니다 🎉</p>
        </div>
      )}

      {/* 완료된 과제도 표시 (접을 수 있게) */}
      {todayData.completedCount > 0 && (
        <details className="mt-4">
          <summary className="cursor-pointer text-sm text-white/60 hover:text-white/80 transition-colors">
            완료된 과제 보기 ({todayData.completedCount}개)
          </summary>
          <div className="space-y-2 mt-3">
            {todayData.tasks
              .filter((task) =>
                completedTasks.has(`${task.materialId}-${todayData.date}`)
              )
              .map((task) => (
                <div
                  key={`${task.materialId}-${todayData.date}`}
                  className="glass-card p-3 opacity-60"
                >
                  <div className="flex items-center gap-2">
                    <svg
                      className="w-5 h-5 text-green-400 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <div className="flex-1">
                      <div className="text-white/80 text-sm line-through decoration-red-500 decoration-2">
                        {task.materialTitle}
                      </div>
                      <div className="text-white/50 text-xs line-through decoration-red-500">
                        {task.description}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </details>
      )}
    </div>
  );
}
