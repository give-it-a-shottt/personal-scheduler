import { useEffect } from 'react';
import type { DailyTask } from '../types';
import { dateUtils } from '../utils/scheduler';

interface DayDetailModalProps {
  isOpen: boolean;
  date: string | null; // YYYY-MM-DD 형식
  tasks: DailyTask[];
  completedTasks: Set<string>;
  onClose: () => void;
  onTaskToggle: (materialId: string, date: string, completed: boolean) => void;
}

export function DayDetailModal({
  isOpen,
  date,
  tasks,
  completedTasks,
  onClose,
  onTaskToggle,
}: DayDetailModalProps) {
  // ESC 키로 닫기
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen || !date) return null;

  // 날짜 포맷팅
  const dateObj = new Date(date);
  const year = dateObj.getFullYear();
  const month = dateObj.getMonth() + 1;
  const day = dateObj.getDate();
  const dayOfWeek = dateUtils.getDayOfWeek(dateObj);

  // 완료된 과제와 미완료 과제 분리
  const completedTaskList = tasks.filter((task) =>
    completedTasks.has(`${task.materialId}-${date}`)
  );
  const incompleteTaskList = tasks.filter(
    (task) => !completedTasks.has(`${task.materialId}-${date}`)
  );

  const totalTasks = tasks.length;
  const completedCount = completedTaskList.length;

  return (
    <>
      {/* 오버레이 */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* 모달 */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="glass-card w-full max-w-2xl max-h-[80vh] overflow-y-auto custom-scrollbar p-6 space-y-6"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 헤더 */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-cyan-500/20 text-cyan-300">
                  {dayOfWeek}
                </span>
                {totalTasks > 0 && (
                  <span className="text-white/60 text-sm">
                    {completedCount}/{totalTasks} 완료
                  </span>
                )}
              </div>
              <h2 className="text-2xl font-bold text-white text-shadow">
                {year}년 {month}월 {day}일
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-white/60 hover:text-white transition-colors"
              aria-label="닫기"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* 진행도 바 */}
          {totalTasks > 0 && (
            <div className="space-y-2">
              <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-500"
                  style={{
                    width: `${(completedCount / totalTasks) * 100}%`,
                  }}
                />
              </div>
            </div>
          )}

          {/* 과제가 없을 때 */}
          {totalTasks === 0 && (
            <div className="text-center py-12 text-white/60">
              <div className="text-6xl mb-4">📅</div>
              <p className="text-lg">이 날짜에 예정된 학습이 없습니다.</p>
            </div>
          )}

          {/* 미완료 과제 목록 */}
          {incompleteTaskList.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-white">
                미완료 과제 ({incompleteTaskList.length})
              </h3>
              <div className="space-y-2">
                {incompleteTaskList.map((task) => (
                  <TaskCard
                    key={`${task.materialId}-${date}`}
                    task={task}
                    date={date}
                    isCompleted={false}
                    onToggle={onTaskToggle}
                  />
                ))}
              </div>
            </div>
          )}

          {/* 완료된 과제 목록 */}
          {completedTaskList.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-white">
                완료된 과제 ({completedTaskList.length})
              </h3>
              <div className="space-y-2">
                {completedTaskList.map((task) => (
                  <TaskCard
                    key={`${task.materialId}-${date}`}
                    task={task}
                    date={date}
                    isCompleted={true}
                    onToggle={onTaskToggle}
                  />
                ))}
              </div>
            </div>
          )}

          {/* 닫기 버튼 */}
          <div className="flex justify-end pt-2">
            <button onClick={onClose} className="glass-button px-6">
              닫기
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// 개별 과제 카드 컴포넌트
interface TaskCardProps {
  task: DailyTask;
  date: string;
  isCompleted: boolean;
  onToggle: (materialId: string, date: string, completed: boolean) => void;
}

function TaskCard({ task, date, isCompleted, onToggle }: TaskCardProps) {
  return (
    <div
      className={`glass-card p-4 transition-all ${
        isCompleted ? 'opacity-70' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        {/* 체크박스 */}
        <button
          onClick={() => onToggle(task.materialId, date, !isCompleted)}
          className={`flex-shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${
            isCompleted
              ? 'border-green-500 bg-green-500/20'
              : 'border-white/30 hover:border-white/50'
          }`}
        >
          {isCompleted && (
            <svg
              className="w-4 h-4 text-green-400"
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

        {/* 과제 내용 */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span
              className={`px-2 py-1 rounded text-xs font-medium ${
                task.materialType === 'book'
                  ? 'bg-primary-500/20 text-primary-300'
                  : 'bg-secondary-500/20 text-secondary-300'
              }`}
            >
              {task.materialType === 'book' ? '📖 책' : '🎬 동영상'}
            </span>
          </div>
          <h4
            className={`text-white font-semibold mb-1 ${
              isCompleted ? 'line-through decoration-red-500 decoration-2' : ''
            }`}
          >
            {task.materialTitle}
          </h4>
          <p className="text-white/80 text-sm">{task.description}</p>

          {/* 동영상 섹션 목록 */}
          {task.materialType === 'video' && task.sections && (
            <div className="mt-3 space-y-1">
              {task.sections.map((section, index) => (
                <div
                  key={index}
                  className="text-white/60 text-xs flex items-start gap-1"
                >
                  <span className="text-white/40">{index + 1}.</span>
                  <span className={isCompleted ? 'line-through' : ''}>
                    {section}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* 책 페이지 범위 */}
          {task.materialType === 'book' && task.startPage && task.endPage && (
            <div className="mt-2 flex items-center gap-2 text-sm text-white/60">
              <span
                className={isCompleted ? 'line-through decoration-red-500' : ''}
              >
                {task.startPage}p
              </span>
              <span>→</span>
              <span
                className={isCompleted ? 'line-through decoration-red-500' : ''}
              >
                {task.endPage}p
              </span>
            </div>
          )}
        </div>

        {/* 완료 토글 버튼 */}
        <button
          onClick={() => onToggle(task.materialId, date, !isCompleted)}
          className={`flex-shrink-0 px-3 py-1 rounded text-sm transition-all ${
            isCompleted
              ? 'bg-white/10 text-white/60 hover:bg-white/20'
              : 'bg-green-500/20 text-green-300 hover:bg-green-500/30'
          }`}
        >
          {isCompleted ? '취소' : '완료'}
        </button>
      </div>
    </div>
  );
}
