import { useState, useEffect } from 'react';
import type { BookFormData, ValidationResult } from '../types';

interface BookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: BookFormData) => void;
}

export function BookModal({ isOpen, onClose, onSubmit }: BookModalProps) {
  const [formData, setFormData] = useState<BookFormData>({
    title: '',
    startPage: 1,
    endPage: 0,
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    description: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [calculatedPages, setCalculatedPages] = useState<number | null>(null);

  // 휴리스틱 #3: ESC 키로 모달 닫기
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // 하루 학습량 자동 계산 (휴리스틱 #1: 시스템 상태 시각화)
  useEffect(() => {
    const totalPages = formData.endPage - formData.startPage + 1;

    if (totalPages > 0 && formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

      if (diffDays > 0) {
        setCalculatedPages(Math.ceil(totalPages / diffDays));
      } else {
        setCalculatedPages(null);
      }
    } else {
      setCalculatedPages(null);
    }
  }, [formData.startPage, formData.endPage, formData.startDate, formData.endDate]);

  // 유효성 검증 (휴리스틱 #5: 오류 방지)
  const validate = (): ValidationResult => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = '책 제목을 입력해주세요.';
    }

    if (formData.startPage < 1) {
      newErrors.startPage = '시작 페이지는 1 이상이어야 합니다.';
    }

    if (formData.endPage < 1) {
      newErrors.endPage = '종료 페이지는 1 이상이어야 합니다.';
    }

    if (formData.startPage > 0 && formData.endPage > 0 && formData.endPage < formData.startPage) {
      newErrors.endPage = '종료 페이지는 시작 페이지보다 크거나 같아야 합니다.';
    }

    if (!formData.startDate) {
      newErrors.startDate = '시작 날짜를 선택해주세요.';
    }

    if (!formData.endDate) {
      newErrors.endDate = '완료 날짜를 선택해주세요.';
    }

    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);

      if (end <= start) {
        newErrors.endDate = '완료 날짜는 시작 날짜보다 이후여야 합니다.';
      }
    }

    setErrors(newErrors);

    return {
      isValid: Object.keys(newErrors).length === 0,
      errors: Object.entries(newErrors).map(([field, message]) => ({
        field,
        message,
      })),
    };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const validation = validate();

    if (validation.isValid) {
      onSubmit(formData);
      handleReset();
      onClose();
    }
  };

  const handleReset = () => {
    setFormData({
      title: '',
      startPage: 1,
      endPage: 0,
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      description: '',
    });
    setErrors({});
    setCalculatedPages(null);
  };

  // 휴리스틱 #3: 취소 버튼
  const handleCancel = () => {
    handleReset();
    onClose();
  };

  if (!isOpen) return null;

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
          className="glass-card w-full max-w-md p-6 space-y-6"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 헤더 (휴리스틱 #2: 명확한 제목) */}
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white text-shadow">
              책 학습 등록
            </h2>
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

          {/* 폼 */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 책 제목 */}
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-white mb-2"
              >
                책 제목 *
              </label>
              <input
                id="title"
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="glass-input"
                placeholder="예: 클린 코드"
                autoFocus
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-300">{errors.title}</p>
              )}
            </div>

            {/* 페이지 범위 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="startPage"
                  className="block text-sm font-medium text-white mb-2"
                >
                  시작 페이지 *
                </label>
                <input
                  id="startPage"
                  type="number"
                  min="1"
                  value={formData.startPage || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      startPage: parseInt(e.target.value) || 1,
                    })
                  }
                  className="glass-input"
                  placeholder="예: 1"
                />
                {errors.startPage && (
                  <p className="mt-1 text-sm text-red-300">{errors.startPage}</p>
                )}
              </div>
              <div>
                <label
                  htmlFor="endPage"
                  className="block text-sm font-medium text-white mb-2"
                >
                  종료 페이지 *
                </label>
                <input
                  id="endPage"
                  type="number"
                  min="1"
                  value={formData.endPage || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      endPage: parseInt(e.target.value) || 0,
                    })
                  }
                  className="glass-input"
                  placeholder="예: 460"
                />
                {errors.endPage && (
                  <p className="mt-1 text-sm text-red-300">{errors.endPage}</p>
                )}
              </div>
            </div>

            {/* 날짜 범위 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="startDate"
                  className="block text-sm font-medium text-white mb-2"
                >
                  시작 날짜 *
                </label>
                <input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                  className="glass-input"
                />
                {errors.startDate && (
                  <p className="mt-1 text-sm text-red-300">{errors.startDate}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="endDate"
                  className="block text-sm font-medium text-white mb-2"
                >
                  완료 날짜 *
                </label>
                <input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData({ ...formData, endDate: e.target.value })
                  }
                  className="glass-input"
                />
                {errors.endDate && (
                  <p className="mt-1 text-sm text-red-300">{errors.endDate}</p>
                )}
              </div>
            </div>

            {/* 자동 계산된 하루 학습량 표시 (휴리스틱 #1, #6) */}
            {calculatedPages !== null && (
              <div className="glass-card bg-primary-500/20 p-4">
                <div className="flex items-center gap-2 text-white">
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
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="text-sm">
                    하루 <strong className="text-lg">{calculatedPages}</strong>{' '}
                    페이지씩 읽으면 됩니다
                  </span>
                </div>
              </div>
            )}

            {/* 설명 (선택사항) */}
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-white mb-2"
              >
                메모 (선택사항)
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="glass-input resize-none"
                rows={3}
                placeholder="예: 소프트웨어 장인정신 향상을 위해"
              />
            </div>

            {/* 버튼 그룹 (휴리스틱 #3: 사용자 제어) */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleCancel}
                className="glass-button flex-1"
              >
                취소
              </button>
              <button type="submit" className="glass-button-primary flex-1">
                등록하기
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
