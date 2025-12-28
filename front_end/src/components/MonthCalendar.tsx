import { useState, useMemo } from 'react';
import type { AnyLearningMaterial, DailyTask } from '../types';
import {
  dateUtils,
  generateBookTaskForDate,
  generateVideoTaskForDate,
} from '../utils/scheduler';

interface MonthCalendarProps {
  materials: AnyLearningMaterial[];
  completedTasks: Set<string>;
  onDayClick: (date: string, tasks: DailyTask[]) => void;
}

interface DayData {
  date: Date;
  dateString: string;
  tasks: DailyTask[];
  isCurrentMonth: boolean;
  isToday: boolean;
  isPast: boolean;
}

export default function MonthCalendar({
  materials,
  completedTasks,
  onDayClick,
}: MonthCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // 월간 데이터 생성
  const monthData = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    // 이번 달의 첫날과 마지막날
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    // 그리드를 위해 첫 주의 일요일부터 시작
    const gridStart = dateUtils.getWeekStart(firstDayOfMonth);

    // 마지막 주의 토요일까지
    const gridEnd = dateUtils.getWeekEnd(lastDayOfMonth);

    // 날짜 배열 생성
    const dates = dateUtils.getDateRange(gridStart, gridEnd);

    // 각 날짜별 과제 생성
    const dayDataList: DayData[] = dates.map((date) => {
      const dayTasks: DailyTask[] = [];

      // 모든 학습 자료에 대해 해당 날짜의 과제 생성
      materials.forEach((material) => {
        if (material.type === 'book') {
          const task = generateBookTaskForDate(material, date);
          if (task) {
            dayTasks.push(task);
          }
        } else if (material.type === 'video') {
          const task = generateVideoTaskForDate(material, date);
          if (task) {
            dayTasks.push(task);
          }
        }
      });

      return {
        date,
        dateString: dateUtils.formatDate(date),
        tasks: dayTasks,
        isCurrentMonth: date.getMonth() === month,
        isToday: dateUtils.isToday(date),
        isPast: dateUtils.isPast(date),
      };
    });

    return dayDataList;
  }, [materials, currentMonth]);

  // 완료율 계산
  const getCompletionStats = (dateString: string, tasks: DailyTask[]) => {
    const totalTasks = tasks.length;
    const completedCount = tasks.filter((task) =>
      completedTasks.has(`${task.materialId}-${dateString}`)
    ).length;

    return { totalTasks, completedCount };
  };

  // 이전 달로 이동
  const goToPreviousMonth = () => {
    setCurrentMonth((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() - 1);
      return newDate;
    });
  };

  // 다음 달로 이동
  const goToNextMonth = () => {
    setCurrentMonth((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + 1);
      return newDate;
    });
  };

  // 오늘로 이동
  const goToToday = () => {
    setCurrentMonth(new Date());
  };

  // 월/년 표시 포맷
  const monthYearText = `${currentMonth.getFullYear()}년 ${
    currentMonth.getMonth() + 1
  }월`;

  return (
    <div className="glass-card p-6">
      {/* 헤더: 월/년 표시 및 네비게이션 */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={goToPreviousMonth}
          className="glass-button px-4 py-2"
          aria-label="이전 달"
        >
          ◀
        </button>

        <h2 className="text-2xl font-bold text-white text-shadow">
          {monthYearText}
        </h2>

        <button
          onClick={goToNextMonth}
          className="glass-button px-4 py-2"
          aria-label="다음 달"
        >
          ▶
        </button>
      </div>

      {/* 오늘로 이동 버튼 */}
      <div className="flex justify-center mb-4">
        <button onClick={goToToday} className="glass-button-primary px-6 py-2">
          🎯 오늘로 이동
        </button>
      </div>

      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {['일', '월', '화', '수', '목', '금', '토'].map((day, index) => (
          <div
            key={day}
            className={`text-center font-bold text-sm ${
              index === 0
                ? 'text-red-400'
                : index === 6
                ? 'text-blue-400'
                : 'text-white'
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* 날짜 그리드 */}
      <div className="grid grid-cols-7 gap-2">
        {monthData.map((dayData) => {
          const { totalTasks, completedCount } = getCompletionStats(
            dayData.dateString,
            dayData.tasks
          );

          const completionRate =
            totalTasks > 0 ? (completedCount / totalTasks) * 100 : 0;

          return (
            <button
              key={dayData.dateString}
              onClick={() => onDayClick(dayData.dateString, dayData.tasks)}
              className={`
                aspect-square p-2 rounded-lg
                flex flex-col items-center justify-center
                transition-all duration-200
                ${dayData.isToday ? 'ring-2 ring-cyan-400 bg-cyan-500/20' : ''}
                ${
                  !dayData.isCurrentMonth
                    ? 'opacity-30'
                    : dayData.isPast
                    ? 'opacity-60'
                    : ''
                }
                ${
                  totalTasks > 0
                    ? completionRate === 100
                      ? 'bg-green-500/20 hover:bg-green-500/30'
                      : completionRate > 0
                      ? 'bg-yellow-500/20 hover:bg-yellow-500/30'
                      : 'bg-gray-500/10 hover:bg-gray-500/20'
                    : 'hover:bg-white/10'
                }
                hover:scale-105
              `}
            >
              {/* 날짜 숫자 */}
              <div
                className={`text-sm font-semibold ${
                  dayData.isToday ? 'text-cyan-300' : 'text-white'
                }`}
              >
                {dayData.date.getDate()}
              </div>

              {/* 완료 개수 / 전체 개수 */}
              {totalTasks > 0 && (
                <div className="text-xs mt-1 text-white/80">
                  {completedCount}/{totalTasks}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* 범례 */}
      <div className="mt-6 flex flex-wrap gap-4 justify-center text-xs text-white/70">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-500/20 border border-green-500/50"></div>
          <span>100% 완료</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-yellow-500/20 border border-yellow-500/50"></div>
          <span>일부 완료</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-gray-500/10 border border-gray-500/50"></div>
          <span>미완료</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded ring-2 ring-cyan-400"></div>
          <span>오늘</span>
        </div>
      </div>
    </div>
  );
}
