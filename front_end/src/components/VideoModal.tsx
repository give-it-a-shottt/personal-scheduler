import { useState, useEffect, useMemo } from 'react';
import type { VideoFormData, VideoMaterial } from '../types';
import { parseVideoText, formatDuration } from '../utils/videoParser';

interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: VideoFormData) => void;
  editMaterial?: VideoMaterial | null;
}

export function VideoModal({ isOpen, onClose, onSubmit, editMaterial }: VideoModalProps) {
  // 오늘 날짜와 4주 후 날짜를 기본값으로 설정
  const getDefaultDates = () => {
    const today = new Date();
    const fourWeeksLater = new Date(today);
    fourWeeksLater.setDate(today.getDate() + 27); // 4주 - 1일

    return {
      startDate: today.toISOString().split('T')[0],
      endDate: fourWeeksLater.toISOString().split('T')[0],
    };
  };

  const getInitialFormData = () => {
    if (editMaterial) {
      // 수정 모드: 기존 섹션들을 텍스트로 변환
      const videoText = editMaterial.sections
        .map((section) => {
          // duration에는 정리 시간 20분이 이미 포함되어 있으므로 빼줌
          const originalDuration = Math.max(0, section.duration - 20);
          const hours = Math.floor(originalDuration / 60);
          const minutes = originalDuration % 60;
          const timeStr = hours > 0 ? `${hours}:${minutes.toString().padStart(2, '0')}` : `${minutes}`;
          return `${section.title}\n${timeStr}`;
        })
        .join('\n\n');

      return {
        title: editMaterial.title,
        videoText,
        startDate: editMaterial.startDate.split('T')[0],
        endDate: editMaterial.endDate.split('T')[0],
        description: editMaterial.description || '',
        studyDays: editMaterial.studyDays || [0, 1, 2, 3, 4, 5, 6], // 기본값: 모든 요일
        dailyStudyHours: editMaterial.dailyStudyHours,
      };
    }
    return {
      title: '',
      videoText: '',
      ...getDefaultDates(),
      description: '',
      studyDays: [0, 1, 2, 3, 4, 5, 6], // 기본값: 모든 요일
      dailyStudyHours: undefined,
    };
  };

  const [formData, setFormData] = useState<{
    title: string;
    videoText: string;
    startDate: string;
    endDate: string;
    description: string;
    studyDays: number[];
    dailyStudyHours?: number;
  }>(getInitialFormData());

  const [errors, setErrors] = useState<Record<string, string>>({});

  // 수정 모드일 때 formData 업데이트
  useEffect(() => {
    if (isOpen) {
      setFormData(getInitialFormData());
    }
  }, [isOpen, editMaterial]);

  // 자동 파싱 및 분석 (휴리스틱 #1: 시스템 상태 시각화)
  const parsedData = useMemo(() => {
    if (!formData.videoText.trim()) {
      return null;
    }

    try {
      const result = parseVideoText(formData.videoText);
      return result;
    } catch (error) {
      return null;
    }
  }, [formData.videoText]);

  // 종료일 자동 계산 (하루 공부 시간이 입력된 경우)
  useEffect(() => {
    if (!parsedData || !formData.startDate || !formData.dailyStudyHours || formData.dailyStudyHours <= 0) {
      return;
    }

    const totalHours = parsedData.totalDuration / 60; // 분 -> 시간
    const dailyHours = formData.dailyStudyHours;
    const studyDays = formData.studyDays;

    // 시작일부터 종료일 계산
    const startDate = new Date(formData.startDate);
    let currentDate = new Date(startDate);
    let accumulatedHours = 0;

    // 최대 1년까지만 계산 (무한 루프 방지)
    let maxIterations = 365;
    let iterations = 0;

    while (accumulatedHours < totalHours && iterations < maxIterations) {
      const dayOfWeek = currentDate.getDay();

      // 학습 요일인 경우에만 시간 누적
      if (studyDays.includes(dayOfWeek)) {
        accumulatedHours += dailyHours;
      }

      // 목표 시간 달성했으면 종료
      if (accumulatedHours >= totalHours) {
        break;
      }

      // 다음 날로 이동
      currentDate.setDate(currentDate.getDate() + 1);
      iterations++;
    }

    // 계산된 종료일을 formData에 반영
    const calculatedEndDate = currentDate.toISOString().split('T')[0];
    if (calculatedEndDate !== formData.endDate) {
      setFormData((prev) => ({ ...prev, endDate: calculatedEndDate }));
    }
  }, [parsedData, formData.startDate, formData.dailyStudyHours, formData.studyDays]);

  // 하루 학습량 계산
  const dailyStats = useMemo(() => {
    if (!parsedData || !formData.startDate || !formData.endDate) return null;

    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    if (totalDays <= 0) return null;

    const sectionsPerDay = Math.ceil(parsedData.totalCount / totalDays);
    const minutesPerDay = Math.ceil(parsedData.totalDuration / totalDays);

    return {
      sectionsPerDay,
      minutesPerDay,
      timePerDay: formatDuration(minutesPerDay),
      totalDays,
    };
  }, [parsedData, formData.startDate, formData.endDate]);

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

  // 유효성 검증 (휴리스틱 #5: 오류 방지)
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = '강의 제목을 입력해주세요.';
    }

    if (!formData.videoText.trim()) {
      newErrors.videoText = '강의 목록을 붙여넣어주세요.';
    }

    if (!parsedData || parsedData.totalCount === 0) {
      newErrors.videoText = '올바른 강의 목록 형식이 아닙니다.';
    }

    if (!formData.startDate) {
      newErrors.startDate = '시작 날짜를 선택해주세요.';
    }

    if (!formData.endDate) {
      newErrors.endDate = '종료 날짜를 선택해주세요.';
    }

    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      if (end <= start) {
        newErrors.endDate = '종료 날짜는 시작 날짜보다 이후여야 합니다.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate() || !parsedData) {
      return;
    }

    const submitData: VideoFormData = {
      title: formData.title,
      sections: parsedData.sections,
      startDate: formData.startDate,
      endDate: formData.endDate,
      description: formData.description,
      studyDays: formData.studyDays,
      dailyStudyHours: formData.dailyStudyHours,
    };

    onSubmit(submitData);
    handleReset();
    onClose();
  };

  const handleReset = () => {
    setFormData({
      title: '',
      videoText: '',
      ...getDefaultDates(),
      description: '',
      studyDays: [0, 1, 2, 3, 4, 5, 6], // 기본값: 모든 요일
      dailyStudyHours: undefined,
    });
    setErrors({});
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
          className="glass-card w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar p-6 space-y-6"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 헤더 (휴리스틱 #2: 명확한 제목) */}
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white text-shadow">
              {editMaterial ? '동영상 강의 수정' : '동영상 강의 등록'}
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

          {/* 안내 메시지 */}
          <div className="glass-card bg-primary-500/10 p-4">
            <div className="flex items-start gap-3 text-white/90 text-sm">
              <svg
                className="w-5 h-5 flex-shrink-0 mt-0.5"
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
              <div>
                <p className="font-medium mb-1">강의 시간에 +20분 자동 추가</p>
                <p className="text-white/70 text-xs">
                  각 강의마다 정리 및 복습 시간 20분이 자동으로 추가됩니다.
                </p>
              </div>
            </div>
          </div>

          {/* 폼 */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 강의 제목 */}
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-white mb-2"
              >
                강의 제목 *
              </label>
              <input
                id="title"
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="glass-input"
                placeholder="예: 파이썬 풀스택 완전 정복"
                autoFocus
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-300">{errors.title}</p>
              )}
            </div>

            {/* 강의 목록 */}
            <div>
              <label
                htmlFor="videoText"
                className="block text-sm font-medium text-white mb-2"
              >
                강의 목록 (videos.txt 내용 붙여넣기) *
              </label>
              <textarea
                id="videoText"
                value={formData.videoText}
                onChange={(e) =>
                  setFormData({ ...formData, videoText: e.target.value })
                }
                className="glass-input resize-none font-mono text-sm"
                rows={10}
                placeholder="강의 제목과 시간이 포함된 텍스트를 붙여넣어주세요.&#10;예:&#10;오리엔테이션과 강의 특징&#10;05:39&#10;&#10;파이썬 기본 문법&#10;12:45"
              />
              {errors.videoText && (
                <p className="mt-1 text-sm text-red-300">{errors.videoText}</p>
              )}
            </div>

            {/* 파싱 결과 표시 (휴리스틱 #1: 시스템 상태 시각화) */}
            {parsedData && (
              <div className="glass-card bg-secondary-500/20 p-4 space-y-2">
                <div className="text-white font-medium mb-2">
                  📊 분석 결과
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-white/60">총 강의 수:</span>
                    <span className="text-white font-semibold ml-2">
                      {parsedData.totalCount}개
                    </span>
                  </div>
                  <div>
                    <span className="text-white/60">총 학습 시간:</span>
                    <span className="text-white font-semibold ml-2">
                      {formatDuration(parsedData.totalDuration)}
                    </span>
                  </div>
                </div>
                <div className="text-xs text-white/50 mt-2">
                  * 각 강의마다 정리 시간 20분이 포함된 시간입니다
                </div>
              </div>
            )}

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
                      dailyStudyHours: e.target.value ? parseFloat(e.target.value) : undefined,
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

            {/* 학습 기간 */}
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
                    setFormData({
                      ...formData,
                      startDate: e.target.value,
                    })
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
                  종료 날짜 * {formData.dailyStudyHours ? '(자동 계산됨)' : ''}
                </label>
                <input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      endDate: e.target.value,
                    })
                  }
                  disabled={!!formData.dailyStudyHours}
                  className="glass-input"
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

            {/* 하루 학습량 표시 (휴리스틱 #1, #6) */}
            {dailyStats && (
              <div className="glass-card bg-primary-500/20 p-4 space-y-2">
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
                  <div className="text-sm">
                    총 <strong className="text-lg">{dailyStats.totalDays}</strong>일 동안
                    하루{' '}
                    <strong className="text-lg">
                      {dailyStats.sectionsPerDay}
                    </strong>
                    개 강의 (
                    <strong className="text-lg">{dailyStats.timePerDay}</strong>
                    )씩 학습하면 됩니다
                  </div>
                </div>
              </div>
            )}

            {/* 메모 (선택사항) */}
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
                placeholder="예: 백엔드 개발자 전환을 위한 필수 강의"
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
              <button
                type="submit"
                className="glass-button-primary flex-1"
                disabled={!parsedData}
              >
                {editMaterial ? '수정하기' : '등록하기'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
