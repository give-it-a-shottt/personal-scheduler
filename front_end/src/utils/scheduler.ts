import type {
  BookMaterial,
  VideoMaterial,
  DailyTask,
  DailyLearningPlan,
  DayOfWeek,
  WeeklyPlan,
  AnyLearningMaterial,
} from '../types';

// 날짜 유틸리티 함수들
export const dateUtils = {
  // YYYY-MM-DD 형식으로 변환
  formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  },

  // 두 날짜 사이의 일수 계산
  getDaysBetween(start: Date, end: Date): number {
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  },

  // 요일 가져오기 (한글)
  getDayOfWeek(date: Date): DayOfWeek {
    const days: DayOfWeek[] = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
    return days[date.getDay()];
  },

  // 주의 시작일 (일요일) 가져오기
  getWeekStart(date: Date = new Date()): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
  },

  // 주의 종료일 (토요일) 가져오기
  getWeekEnd(date: Date = new Date()): Date {
    const start = dateUtils.getWeekStart(date);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return end;
  },

  // 날짜 배열 생성 (시작일부터 종료일까지)
  getDateRange(start: Date, end: Date): Date[] {
    const dates: Date[] = [];
    const current = new Date(start);

    while (current <= end) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return dates;
  },

  // 오늘 날짜인지 확인
  isToday(date: Date): boolean {
    const today = new Date();
    return dateUtils.formatDate(date) === dateUtils.formatDate(today);
  },

  // 날짜가 과거인지 확인
  isPast(date: Date): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  },
};

// 책 학습 자동 스케줄링
export function scheduleBook(
  title: string,
  startPage: number,
  endPage: number,
  totalPages: number,
  startDate: Date,
  endDate: Date,
  description?: string
): BookMaterial {
  const days = dateUtils.getDaysBetween(startDate, endDate) + 1;
  const pagesPerDay = Math.ceil(totalPages / days);

  return {
    id: crypto.randomUUID(),
    type: 'book',
    title,
    description,
    startPage,
    endPage,
    totalPages,
    currentPage: startPage - 1, // 시작 페이지 이전을 현재 페이지로 설정
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    pagesPerDay,
    color: 'primary-500',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

// 동영상 강의 자동 스케줄링
export function scheduleVideo(
  title: string,
  sections: import('../types').VideoSection[],
  totalDuration: number,
  startDate: Date,
  endDate: Date,
  description?: string
): VideoMaterial {
  const days = dateUtils.getDaysBetween(startDate, endDate) + 1;
  const sectionsPerDay = sections.length / days;

  return {
    id: crypto.randomUUID(),
    type: 'video',
    title,
    description,
    sections,
    totalDuration,
    currentProgress: 0,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    sectionsPerDay: Math.ceil(sectionsPerDay), // 정수로 올림
    color: 'secondary-500',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

// 특정 날짜의 책 학습 과제 생성
export function generateBookTaskForDate(
  book: BookMaterial,
  date: Date
): DailyTask | null {
  // 날짜를 YYYY-MM-DD 형식으로 정규화 (시간 제거)
  const normalizeDate = (d: Date): Date => {
    const normalized = new Date(d);
    normalized.setHours(0, 0, 0, 0);
    return normalized;
  };

  const targetDate = normalizeDate(date);
  const bookStart = normalizeDate(new Date(book.startDate));
  const bookEnd = normalizeDate(new Date(book.endDate));

  // 날짜가 학습 기간 내에 있는지 확인
  if (targetDate < bookStart || targetDate > bookEnd) {
    return null;
  }

  // 책을 완료했는지 확인
  if (book.currentPage >= book.endPage) {
    return null;
  }

  // 시작일로부터 며칠째인지 계산
  const dayIndex = dateUtils.getDaysBetween(bookStart, targetDate);

  // 해당 날짜의 학습 범위 계산 (book.startPage 기준)
  const startPage = Math.max(book.startPage, book.startPage + dayIndex * book.pagesPerDay);
  const endPage = Math.min(book.startPage + (dayIndex + 1) * book.pagesPerDay - 1, book.endPage);

  // 페이지 범위가 유효하지 않으면 null 반환
  if (startPage > book.endPage) {
    return null;
  }

  return {
    materialId: book.id,
    materialTitle: book.title,
    materialType: 'book',
    description: `${startPage}-${endPage} 페이지`,
    completed: book.currentPage >= endPage,
    startPage,
    endPage,
  };
}

// 특정 날짜의 동영상 학습 과제 생성
export function generateVideoTaskForDate(
  video: import('../types').VideoMaterial,
  date: Date
): DailyTask | null {
  // 날짜를 YYYY-MM-DD 형식으로 정규화 (시간 제거)
  const normalizeDate = (d: Date): Date => {
    const normalized = new Date(d);
    normalized.setHours(0, 0, 0, 0);
    return normalized;
  };

  const targetDate = normalizeDate(date);
  const videoStart = normalizeDate(new Date(video.startDate));
  const videoEnd = normalizeDate(new Date(video.endDate));

  // 날짜가 학습 기간 내에 있는지 확인
  if (targetDate < videoStart || targetDate > videoEnd) {
    return null;
  }

  // 강의를 완료했는지 확인
  if (video.currentProgress >= video.sections.length) {
    return null;
  }

  // 시작일로부터 며칠째인지 계산
  const dayIndex = dateUtils.getDaysBetween(videoStart, targetDate);

  // 해당 날짜의 학습 범위 계산
  const startIndex = Math.floor(dayIndex * video.sectionsPerDay);
  const endIndex = Math.min(
    Math.floor((dayIndex + 1) * video.sectionsPerDay),
    video.sections.length
  );

  // 섹션 범위가 유효하지 않으면 null 반환
  if (startIndex >= video.sections.length) {
    return null;
  }

  // 해당 날짜의 섹션들
  const daySections = video.sections.slice(startIndex, endIndex);

  if (daySections.length === 0) {
    return null;
  }

  // 총 시간 계산
  const totalMinutes = daySections.reduce((sum, s) => sum + s.duration, 0);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  let timeStr = '';
  if (hours > 0) {
    timeStr = `약 ${hours}시간 ${minutes}분`;
  } else {
    timeStr = `약 ${minutes}분`;
  }

  return {
    materialId: video.id,
    materialTitle: video.title,
    materialType: 'video',
    description: `${daySections.length}개 강의 (${timeStr})`,
    completed: video.currentProgress >= endIndex,
    sections: daySections.map((s) => s.title),
  };
}

// 주간 학습 계획 생성
export function generateWeeklyPlan(
  materials: AnyLearningMaterial[],
  weekStart?: Date
): WeeklyPlan {
  const start = weekStart || dateUtils.getWeekStart();
  const end = dateUtils.getWeekEnd(start);
  const dateRange = dateUtils.getDateRange(start, end);

  const days: DailyLearningPlan[] = dateRange.map((date) => {
    const tasks: DailyTask[] = [];

    // 각 학습 자료에 대해 해당 날짜의 과제 생성
    materials.forEach((material) => {
      if (material.type === 'book') {
        const task = generateBookTaskForDate(material, date);
        if (task) {
          tasks.push(task);
        }
      } else if (material.type === 'video') {
        const task = generateVideoTaskForDate(material, date);
        if (task) {
          tasks.push(task);
        }
      }
    });

    return {
      date: dateUtils.formatDate(date),
      dayOfWeek: dateUtils.getDayOfWeek(date),
      tasks,
    };
  });

  return {
    weekStart: start,
    weekEnd: end,
    days,
  };
}

// 진행도 계산
export function calculateProgress(material: AnyLearningMaterial): number {
  if (material.type === 'book') {
    return Math.min(Math.round((material.currentPage / material.totalPages) * 100), 100);
  }

  if (material.type === 'video') {
    const totalSections = material.sections.length;
    if (totalSections === 0) return 0;
    return Math.round((material.currentProgress / totalSections) * 100);
  }

  return 0;
}

// 책 진행도 업데이트
export function updateBookProgress(
  book: BookMaterial,
  completedPage: number
): BookMaterial {
  return {
    ...book,
    currentPage: Math.min(completedPage, book.totalPages),
    updatedAt: new Date().toISOString(),
  };
}

// 오늘 학습해야 할 총량 계산
export function getTodayWorkload(materials: AnyLearningMaterial[]): {
  books: { title: string; pages: string }[];
  total: number;
} {
  const today = new Date();
  const books: { title: string; pages: string }[] = [];
  let totalTasks = 0;

  materials.forEach((material) => {
    if (material.type === 'book') {
      const task = generateBookTaskForDate(material, today);
      if (task && !task.completed) {
        books.push({
          title: material.title,
          pages: task.description,
        });
        totalTasks++;
      }
    }
  });

  return { books, total: totalTasks };
}

// 학습 완료 여부 확인
export function isLearningCompleted(material: AnyLearningMaterial): boolean {
  if (material.type === 'book') {
    return material.currentPage >= material.totalPages;
  }

  if (material.type === 'video') {
    return material.currentProgress >= material.sections.length;
  }

  return false;
}

// 남은 학습 일수 계산
export function getRemainingDays(material: AnyLearningMaterial): number {
  const endDate = new Date(material.endDate);
  const today = new Date();

  if (endDate < today) return 0;

  return dateUtils.getDaysBetween(today, endDate);
}
