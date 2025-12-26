import type { VideoSection } from '../types';

// 시간 문자열(MM:SS)을 분 단위로 변환하고 +20분 추가
function parseTimeToMinutes(timeStr: string): number {
  const parts = timeStr.trim().split(':');

  if (parts.length === 2) {
    // MM:SS 형식
    const minutes = parseInt(parts[0]) || 0;
    const seconds = parseInt(parts[1]) || 0;
    const totalMinutes = minutes + Math.ceil(seconds / 60);

    // 학습 + 정리 시간 추가 (20분)
    return totalMinutes + 20;
  }

  if (parts.length === 3) {
    // HH:MM:SS 형식
    const hours = parseInt(parts[0]) || 0;
    const minutes = parseInt(parts[1]) || 0;
    const seconds = parseInt(parts[2]) || 0;
    const totalMinutes = hours * 60 + minutes + Math.ceil(seconds / 60);

    // 학습 + 정리 시간 추가 (20분)
    return totalMinutes + 20;
  }

  return 20; // 시간 정보가 없으면 기본 20분
}

// 줄이 시간 형식을 포함하는지 확인
function containsTimeFormat(line: string): boolean {
  // MM:SS 또는 HH:MM:SS 형식 확인
  return /\d{1,2}:\d{2}/.test(line);
}

// videos.txt 텍스트를 VideoSection 배열로 파싱
export function parseVideoText(text: string): {
  sections: VideoSection[];
  totalDuration: number;
  totalCount: number;
} {
  const lines = text.split('\n');
  const sections: VideoSection[] = [];
  let currentTitle = '';
  let order = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // 빈 줄 건너뛰기
    if (!line) continue;

    // 숫자만 있는 줄(섹션 구분자) 건너뛰기
    if (/^\d+$/.test(line)) continue;

    // 챕터 번호(01, 02 등) 건너뛰기
    if (/^\d{2}$/.test(line)) continue;

    // "무료", "강의 자료", "수업 자료" 등 건너뛰기
    if (
      line === '무료' ||
      line.includes('다운로드') ||
      line.includes('강의 자료') ||
      line.includes('수업 자료')
    ) {
      continue;
    }

    // 시간 형식이 포함된 줄 찾기
    if (containsTimeFormat(line)) {
      const timeMatch = line.match(/(\d{1,2}:\d{2}(?::\d{2})?)/);

      if (timeMatch && currentTitle) {
        const timeStr = timeMatch[1];
        const duration = parseTimeToMinutes(timeStr);

        sections.push({
          id: `video-${order}`,
          title: currentTitle,
          duration,
          completed: false,
          order,
        });

        order++;
        currentTitle = '';
      }
    } else {
      // 제목으로 간주 (시간이 없는 줄)
      currentTitle = line;
    }
  }

  // 총 시간 계산
  const totalDuration = sections.reduce((sum, section) => sum + section.duration, 0);

  return {
    sections,
    totalDuration,
    totalCount: sections.length,
  };
}

// 총 시간을 "X시간 Y분" 형식으로 변환
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours === 0) {
    return `${mins}분`;
  }

  if (mins === 0) {
    return `${hours}시간`;
  }

  return `${hours}시간 ${mins}분`;
}

// 일일 학습 시간 계산 (분 단위)
export function calculateDailyMinutes(
  totalMinutes: number,
  totalDays: number
): number {
  return Math.ceil(totalMinutes / totalDays);
}

// 일일 강의 개수 계산
export function calculateDailySections(
  totalSections: number,
  totalDays: number
): number {
  return Math.ceil(totalSections / totalDays);
}

// 예상 완료 시간 계산 (하루 최대 학습 시간 기준)
export function estimateCompletionDays(
  totalMinutes: number,
  maxDailyMinutes: number = 180 // 기본 3시간
): number {
  return Math.ceil(totalMinutes / maxDailyMinutes);
}

// 섹션을 날짜별로 분배
export function distributeSectionsAcrossDays(
  sections: VideoSection[],
  startDate: Date,
  endDate: Date
): Map<string, VideoSection[]> {
  const distribution = new Map<string, VideoSection[]>();

  const daysDiff = Math.ceil(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  ) + 1;

  const sectionsPerDay = calculateDailySections(sections.length, daysDiff);

  let currentDate = new Date(startDate);
  let sectionIndex = 0;

  while (sectionIndex < sections.length && currentDate <= endDate) {
    const dateKey = currentDate.toISOString().split('T')[0];
    const daySections: VideoSection[] = [];

    // 해당 날짜에 배정할 섹션 추가
    for (let i = 0; i < sectionsPerDay && sectionIndex < sections.length; i++) {
      daySections.push(sections[sectionIndex]);
      sectionIndex++;
    }

    if (daySections.length > 0) {
      distribution.set(dateKey, daySections);
    }

    // 다음 날로 이동
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return distribution;
}
