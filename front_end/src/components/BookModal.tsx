import { useState, useEffect } from 'react';
import type { BookFormData, ValidationResult, BookMaterial } from '../types';
import { dateUtils } from '../utils/scheduler';

interface BookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: BookFormData) => void;
  editMaterial?: BookMaterial | null;
}

export function BookModal({ isOpen, onClose, onSubmit, editMaterial }: BookModalProps) {
  const getInitialFormData = (): BookFormData => {
    if (editMaterial) {
      return {
        title: editMaterial.title,
        startPage: editMaterial.startPage,
        endPage: editMaterial.endPage,
        startDate: editMaterial.startDate.split('T')[0],
        endDate: editMaterial.endDate.split('T')[0],
        description: editMaterial.description || '',
        studyDays: editMaterial.studyDays || [0, 1, 2, 3, 4, 5, 6], // 기본값: 모든 요일
        dailyStudyHours: editMaterial.dailyStudyHours,
        minutesPerPage: editMaterial.minutesPerPage,
      };
    }
    return {
      title: '',
      startPage: 1,
      endPage: 0,
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      description: '',
      studyDays: [0, 1, 2, 3, 4, 5, 6], // 기본값: 모든 요일
    };
  };

  const [formData, setFormData] = useState<BookFormData>(getInitialFormData());

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [calculatedPages, setCalculatedPages] = useState<number | null>(null);

  // 수정 모드일 때 formData 업데이트
  useEffect(() => {
    if (isOpen) {
      setFormData(getInitialFormData());
    }
  }, [isOpen, editMaterial]);

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

      // 학습 기간 내에서 실제 학습 가능한 날 수 계산
      const dateRange = dateUtils.getDateRange(start, end);
      const actualStudyDays = dateRange.filter((date) =>
        formData.studyDays.includes(date.getDay())
      ).length;

      if (actualStudyDays > 0) {
        setCalculatedPages(Math.ceil(totalPages / actualStudyDays));
      } else {
        setCalculatedPages(null);
      }
    } else {
      setCalculatedPages(null);
    }
  }, [formData.startPage, formData.endPage, formData.startDate, formData.endDate, formData.studyDays]);

  // 종료일 자동 계산 (하루 공부 시간 기반)
  useEffect(() => {
    // 필요한 모든 값이 입력되었는지 확인
    if (
      !formData.minutesPerPage ||
      !formData.dailyStudyHours ||
      !formData.startDate ||
      formData.endPage <= 0 ||
      formData.startPage <= 0 ||
      formData.dailyStudyHours <= 0 ||
      formData.minutesPerPage <= 0
    ) {
      return;
    }

    const totalPages = formData.endPage - formData.startPage + 1;
    const totalMinutes = totalPages * formData.minutesPerPage;
    const totalHours = totalMinutes / 60;
    const dailyHours = formData.dailyStudyHours;
    const studyDays = formData.studyDays;

    const startDate = new Date(formData.startDate);
    let currentDate = new Date(startDate);
    let accumulatedHours = 0;

    let maxIterations = 365 * 2; // 최대 2년
    let iterations = 0;

    while (accumulatedHours < totalHours && iterations < maxIterations) {
      const dayOfWeek = currentDate.getDay();

      // 학습 요일인 경우만 시간 누적
      if (studyDays.includes(dayOfWeek)) {
        accumulatedHours += dailyHours;
      }

      if (accumulatedHours >= totalHours) {
        break;
      }

      currentDate.setDate(currentDate.getDate() + 1);
      iterations++;
    }

    const calculatedEndDate = currentDate.toISOString().split('T')[0];
    if (calculatedEndDate !== formData.endDate) {
      setFormData((prev) => ({ ...prev, endDate: calculatedEndDate }));
    }
  }, [
    formData.minutesPerPage,
    formData.dailyStudyHours,
    formData.startDate,
    formData.startPage,
    formData.endPage,
    formData.studyDays,
  ]);

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
      studyDays: [0, 1, 2, 3, 4, 5, 6], // 기본값: 모든 요일
    });
    setErrors({});
    setCalculatedPages(null);
  };

  // 요일 토글 핸들러
  const toggleStudyDay = (day: number) => {
    setFormData((prev) => {
      const newStudyDays = prev.studyDays.includes(day)
        ? prev.studyDays.filter((d) => d !== day)
        : [...prev.studyDays, day].sort((a, b) => a - b);
      return { ...prev, studyDays: newStudyDays };
    });
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
              {editMaterial ? '책 학습 수정' : '책 학습 등록'}
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
                  {formData.minutesPerPage &&
                    formData.dailyStudyHours &&
                    formData.minutesPerPage > 0 &&
                    formData.dailyStudyHours > 0 && (
                      <span className="ml-2 text-xs text-primary-300">
                        (자동 계산됨)
                      </span>
                    )}
                </label>
                <input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData({ ...formData, endDate: e.target.value })
                  }
                  disabled={
                    !!(
                      formData.minutesPerPage &&
                      formData.dailyStudyHours &&
                      formData.minutesPerPage > 0 &&
                      formData.dailyStudyHours > 0
                    )
                  }
                  className={`glass-input ${
                    formData.minutesPerPage &&
                    formData.dailyStudyHours &&
                    formData.minutesPerPage > 0 &&
                    formData.dailyStudyHours > 0
                      ? 'opacity-60 cursor-not-allowed'
                      : ''
                  }`}
                />
                {errors.endDate && (
                  <p className="mt-1 text-sm text-red-300">{errors.endDate}</p>
                )}
              </div>
            </div>

            {/* 학습 요일 선택 */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                학습 요일 *
              </label>
              <div className="grid grid-cols-7 gap-2">
                {['일', '월', '화', '수', '목', '금', '토'].map((day, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => toggleStudyDay(index)}
                    className={`
                      py-2 px-1 rounded-lg text-sm font-medium transition-all
                      ${
                        formData.studyDays.includes(index)
                          ? 'bg-gradient-to-br from-primary-500 to-secondary-500 text-white shadow-lg'
                          : 'bg-white/10 text-white/50 hover:bg-white/20'
                      }
                    `}
                  >
                    {day}
                  </button>
                ))}
              </div>
              {formData.studyDays.length === 0 && (
                <p className="mt-2 text-sm text-yellow-300">
                  최소 1개 이상의 요일을 선택해주세요.
                </p>
              )}
            </div>

            {/* 1페이지당 평균 소요 시간 (선택사항) */}
            <div>
              <label
                htmlFor="minutesPerPage"
                className="block text-sm font-medium text-white mb-2"
              >
                1페이지당 평균 소요 시간 (선택사항)
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="minutesPerPage"
                  type="number"
                  min="1"
                  max="60"
                  value={formData.minutesPerPage || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      minutesPerPage: e.target.value
                        ? parseInt(e.target.value)
                        : undefined,
                    })
                  }
                  className="glass-input flex-1"
                  placeholder="예: 3"
                />
                <span className="text-white/70 text-sm">분</span>
              </div>
              <p className="mt-1 text-xs text-white/50">
                책 한 페이지를 읽는데 걸리는 평균 시간을 입력하세요
              </p>
            </div>

            {/* 하루 공부 가능 시간 (선택사항) */}
            <div>
              <label
                htmlFor="dailyStudyHours"
                className="block text-sm font-medium text-white mb-2"
              >
                하루 공부 가능 시간 (선택사항)
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="dailyStudyHours"
                  type="number"
                  min="0.5"
                  max="24"
                  step="0.5"
                  value={formData.dailyStudyHours || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      dailyStudyHours: e.target.value
                        ? parseFloat(e.target.value)
                        : undefined,
                    })
                  }
                  className="glass-input flex-1"
                  placeholder="예: 4"
                />
                <span className="text-white/70 text-sm">시간</span>
              </div>
              <p className="mt-1 text-xs text-white/50">
                입력하면 종료일이 자동으로 계산됩니다 (예: 퇴근 후 7시~11시 = 4시간)
              </p>
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
                {editMaterial ? '수정하기' : '등록하기'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
