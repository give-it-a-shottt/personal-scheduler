import { useEffect } from 'react';
import type { DailyTask } from '../types';

interface TaskDetailModalProps {
  isOpen: boolean;
  task: DailyTask | null;
  onClose: () => void;
  onToggle: () => void;
  isCompleted: boolean;
}

export function TaskDetailModal({
  isOpen,
  task,
  onClose,
  onToggle,
  isCompleted,
}: TaskDetailModalProps) {
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

  if (!isOpen || !task) return null;

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
          className="glass-card w-full max-w-lg max-h-[80vh] overflow-y-auto custom-scrollbar p-6 space-y-6"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 헤더 */}
          <div className="flex items-start justify-between">
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
                {isCompleted && (
                  <span className="px-2 py-1 rounded text-xs font-medium bg-green-500/20 text-green-300">
                    ✓ 완료됨
                  </span>
                )}
              </div>
              <h2
                className={`text-2xl font-bold text-white text-shadow ${
                  isCompleted ? 'line-through decoration-red-500 decoration-2' : ''
                }`}
              >
                {task.materialTitle}
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

          {/* 학습 내용 */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">
                오늘의 학습량
              </h3>
              <p className="text-white/80 text-lg">{task.description}</p>
            </div>

            {/* 동영상 강의 목록 */}
            {task.materialType === 'video' && task.sections && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">
                  강의 목록
                </h3>
                <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                  {task.sections.map((section, index) => (
                    <div
                      key={index}
                      className={`glass-card p-3 ${
                        isCompleted ? 'opacity-60' : ''
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <span className="text-white/40 text-sm flex-shrink-0 mt-0.5">
                          {index + 1}.
                        </span>
                        <span
                          className={`text-white/90 text-sm flex-1 ${
                            isCompleted
                              ? 'line-through decoration-red-500'
                              : ''
                          }`}
                        >
                          {section}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 책 페이지 범위 */}
            {task.materialType === 'book' && task.startPage && task.endPage && (
              <div className="glass-card bg-primary-500/10 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-white/60 text-sm mb-1">
                      시작 페이지
                    </div>
                    <div
                      className={`text-white text-2xl font-bold ${
                        isCompleted ? 'line-through decoration-red-500' : ''
                      }`}
                    >
                      {task.startPage}
                    </div>
                  </div>
                  <div className="text-white/40 text-2xl">→</div>
                  <div>
                    <div className="text-white/60 text-sm mb-1">
                      종료 페이지
                    </div>
                    <div
                      className={`text-white text-2xl font-bold ${
                        isCompleted ? 'line-through decoration-red-500' : ''
                      }`}
                    >
                      {task.endPage}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 완료 토글 버튼 */}
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="glass-button flex-1">
              닫기
            </button>
            <button
              onClick={onToggle}
              className={`flex-1 ${
                isCompleted ? 'glass-button' : 'glass-button-primary'
              }`}
            >
              {isCompleted ? '완료 취소' : '완료 표시'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
