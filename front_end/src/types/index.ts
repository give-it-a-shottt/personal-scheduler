// 학습 자료 타입
export type LearningType = 'book' | 'video' | 'custom';

// 학습 자료 기본 인터페이스
export interface LearningMaterial {
  id: string;
  type: LearningType;
  title: string;
  description?: string;
  color?: string; // primary-500, secondary-500 등
  createdAt: string;
  updatedAt: string;
}

// 책 학습 자료
export interface BookMaterial extends LearningMaterial {
  type: 'book';
  totalPages: number;
  currentPage: number;
  startDate: string; // ISO 8601
  endDate: string;   // ISO 8601
  pagesPerDay: number; // 자동 계산됨
}

// 동영상 강의 자료 (나중에 구현)
export interface VideoMaterial extends LearningMaterial {
  type: 'video';
  sections: VideoSection[];
  totalDuration: number; // 분 단위
  currentProgress: number; // 완료된 섹션 수
  startDate: string;
  endDate: string;
  sectionsPerDay: number; // 자동 계산됨
}

// 동영상 섹션
export interface VideoSection {
  id: string;
  title: string;
  duration: number; // 분 단위
  completed: boolean;
  order: number;
}

// 커스텀 학습 자료
export interface CustomMaterial extends LearningMaterial {
  type: 'custom';
  tasks: CustomTask[];
  startDate: string;
  endDate: string;
}

export interface CustomTask {
  id: string;
  title: string;
  completed: boolean;
  date: string;
}

// 통합 학습 자료 타입
export type AnyLearningMaterial = BookMaterial | VideoMaterial | CustomMaterial;

// 하루 학습 계획
export interface DailyLearningPlan {
  date: string; // YYYY-MM-DD
  dayOfWeek: DayOfWeek;
  tasks: DailyTask[];
}

// 하루 학습 과제
export interface DailyTask {
  materialId: string;
  materialTitle: string;
  materialType: LearningType;
  description: string; // "50-75 페이지", "섹션 3-4" 등
  completed: boolean;
  startPage?: number; // 책인 경우
  endPage?: number;   // 책인 경우
  sections?: string[]; // 동영상인 경우
}

// 요일 타입
export type DayOfWeek = '일요일' | '월요일' | '화요일' | '수요일' | '목요일' | '금요일' | '토요일';

// 주간 학습 계획
export interface WeeklyPlan {
  weekStart: Date;
  weekEnd: Date;
  days: DailyLearningPlan[];
}

// 모달 상태
export interface ModalState {
  isOpen: boolean;
  mode: 'create' | 'edit';
  materialType?: LearningType;
  material?: AnyLearningMaterial;
}

// 책 등록 폼 데이터
export interface BookFormData {
  title: string;
  totalPages: number;
  startDate: string;
  endDate: string;
  description?: string;
}

// 동영상 등록 폼 데이터
export interface VideoFormData {
  title: string;
  sections: VideoSection[];
  weeks: number; // 몇 주 안에 완료할지
  description?: string;
}

// 유효성 검증 결과
export interface ValidationResult {
  isValid: boolean;
  errors: {
    field: string;
    message: string;
  }[];
}

// 에러 상태
export interface ErrorState {
  hasError: boolean;
  message: string;
  type?: 'validation' | 'conflict' | 'storage' | 'calculation' | 'unknown';
}

// 시스템 상태 (휴리스틱 원칙 1: 시스템 상태 시각화)
export interface SystemStatus {
  isSaving: boolean;
  lastSaved?: Date;
  hasUnsavedChanges: boolean;
  error?: ErrorState;
  successMessage?: string;
}

// 진행도 통계
export interface ProgressStats {
  totalMaterials: number;
  completedMaterials: number;
  todayTasks: number;
  todayCompleted: number;
  weekProgress: number; // 0-100 퍼센트
}

// 알림 설정
export interface ReminderSetting {
  enabled: boolean;
  time: string; // "09:00" 형식
  daysOfWeek: number[]; // 0-6 (일-토)
}

// 로컬 스토리지 키
export const STORAGE_KEYS = {
  MATERIALS: 'learning-scheduler-materials',
  SETTINGS: 'learning-scheduler-settings',
  COMPLETED_TASKS: 'learning-scheduler-completed-tasks',
} as const;
