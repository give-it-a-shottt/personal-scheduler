import type {
  AnyLearningMaterial,
  ReminderSetting,
  ErrorState,
} from '../types';
import { STORAGE_KEYS } from '../types';

// 로컬 스토리지 에러 처리
function handleStorageError(error: unknown): ErrorState {
  console.error('Storage error:', error);

  return {
    hasError: true,
    message: '데이터를 저장하는 중 오류가 발생했습니다. 다시 시도해주세요.',
    type: 'storage',
  };
}

// 학습 자료 저장/불러오기
export const materialStorage = {
  // 모든 학습 자료 가져오기
  getAll(): AnyLearningMaterial[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.MATERIALS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      handleStorageError(error);
      return [];
    }
  },

  // 특정 학습 자료 가져오기
  getById(id: string): AnyLearningMaterial | null {
    const materials = materialStorage.getAll();
    return materials.find((m) => m.id === id) || null;
  },

  // 학습 자료 추가
  add(material: AnyLearningMaterial): { success: boolean; error?: ErrorState } {
    try {
      const materials = materialStorage.getAll();
      materials.push(material);
      localStorage.setItem(STORAGE_KEYS.MATERIALS, JSON.stringify(materials));
      return { success: true };
    } catch (error) {
      return { success: false, error: handleStorageError(error) };
    }
  },

  // 학습 자료 업데이트
  update(
    id: string,
    updates: Partial<AnyLearningMaterial>
  ): { success: boolean; error?: ErrorState } {
    try {
      const materials = materialStorage.getAll();
      const index = materials.findIndex((m) => m.id === id);

      if (index === -1) {
        return {
          success: false,
          error: {
            hasError: true,
            message: '학습 자료를 찾을 수 없습니다.',
            type: 'storage',
          },
        };
      }

      materials[index] = {
        ...materials[index],
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      localStorage.setItem(STORAGE_KEYS.MATERIALS, JSON.stringify(materials));
      return { success: true };
    } catch (error) {
      return { success: false, error: handleStorageError(error) };
    }
  },

  // 학습 자료 삭제
  delete(id: string): { success: boolean; error?: ErrorState } {
    try {
      const materials = materialStorage.getAll();
      const filtered = materials.filter((m) => m.id !== id);

      localStorage.setItem(STORAGE_KEYS.MATERIALS, JSON.stringify(filtered));
      return { success: true };
    } catch (error) {
      return { success: false, error: handleStorageError(error) };
    }
  },

  // 모든 학습 자료 삭제
  clear(): { success: boolean; error?: ErrorState } {
    try {
      localStorage.removeItem(STORAGE_KEYS.MATERIALS);
      return { success: true };
    } catch (error) {
      return { success: false, error: handleStorageError(error) };
    }
  },
};

// 완료된 과제 저장/불러오기
export const completedTasksStorage = {
  // 완료된 과제 ID 목록 가져오기
  getAll(): Set<string> {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.COMPLETED_TASKS);
      return data ? new Set<string>(JSON.parse(data)) : new Set();
    } catch (error) {
      handleStorageError(error);
      return new Set();
    }
  },

  // 과제 완료 표시
  markCompleted(materialId: string, date: string): void {
    try {
      const completed = completedTasksStorage.getAll();
      const key = `${materialId}-${date}`;
      completed.add(key);
      localStorage.setItem(
        STORAGE_KEYS.COMPLETED_TASKS,
        JSON.stringify(Array.from(completed))
      );
    } catch (error) {
      handleStorageError(error);
    }
  },

  // 과제 완료 취소
  markIncomplete(materialId: string, date: string): void {
    try {
      const completed = completedTasksStorage.getAll();
      const key = `${materialId}-${date}`;
      completed.delete(key);
      localStorage.setItem(
        STORAGE_KEYS.COMPLETED_TASKS,
        JSON.stringify(Array.from(completed))
      );
    } catch (error) {
      handleStorageError(error);
    }
  },

  // 특정 과제가 완료되었는지 확인
  isCompleted(materialId: string, date: string): boolean {
    const completed = completedTasksStorage.getAll();
    const key = `${materialId}-${date}`;
    return completed.has(key);
  },

  // 완료된 과제 초기화
  clear(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.COMPLETED_TASKS);
    } catch (error) {
      handleStorageError(error);
    }
  },
};

// 설정 저장/불러오기
export const settingsStorage = {
  // 알림 설정 가져오기
  getReminderSettings(): ReminderSetting {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      const settings = data ? JSON.parse(data) : {};

      return {
        enabled: settings.reminderEnabled ?? false,
        time: settings.reminderTime ?? '09:00',
        daysOfWeek: settings.reminderDays ?? [1, 2, 3, 4, 5], // 월-금
      };
    } catch (error) {
      handleStorageError(error);
      return {
        enabled: false,
        time: '09:00',
        daysOfWeek: [1, 2, 3, 4, 5],
      };
    }
  },

  // 알림 설정 저장
  saveReminderSettings(settings: ReminderSetting): void {
    try {
      const currentSettings = settingsStorage.getAll();
      const newSettings = {
        ...currentSettings,
        reminderEnabled: settings.enabled,
        reminderTime: settings.time,
        reminderDays: settings.daysOfWeek,
      };

      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(newSettings));
    } catch (error) {
      handleStorageError(error);
    }
  },

  // 모든 설정 가져오기
  getAll(): Record<string, unknown> {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      handleStorageError(error);
      return {};
    }
  },

  // 설정 초기화
  clear(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.SETTINGS);
    } catch (error) {
      handleStorageError(error);
    }
  },
};

// 모든 데이터 내보내기 (백업용)
export function exportAllData(): string {
  const data = {
    materials: materialStorage.getAll(),
    completedTasks: Array.from(completedTasksStorage.getAll()),
    settings: settingsStorage.getAll(),
    exportedAt: new Date().toISOString(),
  };

  return JSON.stringify(data, null, 2);
}

// 데이터 가져오기 (복원용)
export function importAllData(jsonString: string): {
  success: boolean;
  error?: ErrorState;
} {
  try {
    const data = JSON.parse(jsonString);

    if (data.materials) {
      localStorage.setItem(
        STORAGE_KEYS.MATERIALS,
        JSON.stringify(data.materials)
      );
    }

    if (data.completedTasks) {
      localStorage.setItem(
        STORAGE_KEYS.COMPLETED_TASKS,
        JSON.stringify(data.completedTasks)
      );
    }

    if (data.settings) {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(data.settings));
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: handleStorageError(error) };
  }
}
