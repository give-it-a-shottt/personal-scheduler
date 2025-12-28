import { useMemo } from 'react';
import type { WeeklyPlan, DailyTask } from '../types';
import { dateUtils } from '../utils/scheduler';

interface TodayTasksProps {
  weeklyPlan: WeeklyPlan;
  completedTasks: Set<string>;
  onTaskClick: (task: DailyTask, date: string) => void;
  onTaskToggle: (materialId: string, date: string, completed: boolean) => void;
}

export function TodayTasks({
  weeklyPlan,
  completedTasks,
  onTaskClick,
  onTaskToggle,
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

  // 내일 일정 계산
  const tomorrowData = useMemo(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDate = dateUtils.formatDate(tomorrow);
    const tomorrowPlan = weeklyPlan.days.find((day) => day.date === tomorrowDate);

    if (!tomorrowPlan) {
      return {
        date: tomorrowDate,
        tasks: [],
        incompleteTasks: [],
        totalTasks: 0,
        completedCount: 0,
      };
    }

    const incompleteTasks = tomorrowPlan.tasks.filter(
      (task) => !completedTasks.has(`${task.materialId}-${tomorrowDate}`)
    );

    const completedCount = tomorrowPlan.tasks.length - incompleteTasks.length;

    return {
      date: tomorrowDate,
      tasks: tomorrowPlan.tasks,
      incompleteTasks,
      totalTasks: tomorrowPlan.tasks.length,
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
              <div
                key={`${task.materialId}-${todayData.date}`}
                className="glass-card-hover p-4"
              >
                <div className="flex items-start gap-3">
                  {/* 체크박스 */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onTaskToggle(task.materialId, todayData.date, true);
                    }}
                    className="flex-shrink-0 w-6 h-6 rounded border-2 border-white/30 hover:border-white/50 flex items-center justify-center transition-all mt-1"
                  >
                  </button>

                  {/* 아이콘 */}
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-lg">
                    {task.materialType === 'book' ? '📖' : '🎬'}
                  </div>

                  {/* 내용 */}
                  <button
                    onClick={() => onTaskClick(task, todayData.date)}
                    className="flex-1 min-w-0 text-left group"
                  >
                    <div className="text-white font-medium mb-1 group-hover:text-primary-300 transition-colors">
                      {task.materialTitle}
                    </div>
                    <div className="text-white/60 text-sm">
                      {task.description}
                    </div>
                  </button>

                  {/* 화살표 */}
                  <button
                    onClick={() => onTaskClick(task, todayData.date)}
                    className="flex-shrink-0 text-white/40 hover:text-white/60 transition-colors"
                  >
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
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="text-4xl mb-3">✅</div>
          <p className="text-white font-semibold mb-1">모든 과제 완료!</p>
          <p className="text-white/60 text-sm">오늘도 수고하셨습니다 🎉</p>
          {todayData.totalTasks > 0 && (
            <div className="mt-2 inline-block px-3 py-1 bg-gradient-to-r from-primary-500/20 to-secondary-500/20 rounded-full">
              <span className="text-primary-300 text-sm font-medium">⚡ 앞서가는 중</span>
            </div>
          )}
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
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onTaskToggle(task.materialId, todayData.date, false);
                      }}
                      className="flex-shrink-0 w-5 h-5 rounded border-2 border-green-500 bg-green-500/20 flex items-center justify-center transition-all hover:bg-green-500/30"
                    >
                      <svg
                        className="w-3 h-3 text-green-400"
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
                    </button>
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

      {/* 내일 일정 (오늘 작업을 모두 완료했을 때만 표시) */}
      {todayData.incompleteTasks.length === 0 && todayData.totalTasks > 0 && tomorrowData.totalTasks > 0 && (
        <div className="mt-6 pt-6 border-t border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <span>내일의 학습 🌅</span>
              <span className="text-xs px-2 py-1 bg-secondary-500/20 text-secondary-300 rounded-full">
                미리 시작 가능
              </span>
            </h3>
            <div className="text-sm text-white/70">
              {tomorrowData.completedCount}/{tomorrowData.totalTasks} 완료
            </div>
          </div>

          {/* 내일 진행도 바 */}
          {tomorrowData.completedCount > 0 && (
            <div className="mb-4">
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-secondary-400 to-primary-400 transition-all duration-300"
                  style={{ width: `${Math.round((tomorrowData.completedCount / tomorrowData.totalTasks) * 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* 내일 미완료 과제 목록 */}
          {tomorrowData.incompleteTasks.length > 0 ? (
            <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
              {tomorrowData.incompleteTasks.map((task) => (
                <div
                  key={`${task.materialId}-${tomorrowData.date}`}
                  className="glass-card-hover p-4 bg-white/5"
                >
                  <div className="flex items-start gap-3">
                    {/* 체크박스 */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onTaskToggle(task.materialId, tomorrowData.date, true);
                      }}
                      className="flex-shrink-0 w-6 h-6 rounded border-2 border-white/30 hover:border-white/50 flex items-center justify-center transition-all mt-1"
                    >
                    </button>

                    {/* 아이콘 */}
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-lg">
                      {task.materialType === 'book' ? '📖' : '🎬'}
                    </div>

                    {/* 내용 */}
                    <button
                      onClick={() => onTaskClick(task, tomorrowData.date)}
                      className="flex-1 min-w-0 text-left group"
                    >
                      <div className="text-white font-medium mb-1 group-hover:text-secondary-300 transition-colors">
                        {task.materialTitle}
                      </div>
                      <div className="text-white/60 text-sm">
                        {task.description}
                      </div>
                    </button>

                    {/* 화살표 */}
                    <button
                      onClick={() => onTaskClick(task, tomorrowData.date)}
                      className="flex-shrink-0 text-white/40 hover:text-white/60 transition-colors"
                    >
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
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 glass-card">
              <div className="text-3xl mb-2">🎯</div>
              <p className="text-white/70 text-sm">내일 과제도 모두 완료했습니다!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
