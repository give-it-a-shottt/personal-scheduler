import type {
  AnyLearningMaterial,
  BookMaterial,
  VideoMaterial,
  ReminderSetting,
  ErrorState,
} from '../types';
import { supabase } from '../lib/supabase';

// 에러 처리 헬퍼
function handleStorageError(error: unknown): ErrorState {
  console.error('Supabase storage error:', error);

  return {
    hasError: true,
    message: '데이터를 저장하는 중 오류가 발생했습니다. 다시 시도해주세요.',
    type: 'storage',
  };
}

// 학습 자료 변환: DB 형식 → 앱 형식
function dbToMaterial(row: any): AnyLearningMaterial {
  const base = {
    id: row.id,
    title: row.title,
    description: row.description || '',
    color: row.color,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };

  if (row.type === 'book') {
    return {
      ...base,
      type: 'book',
      totalPages: row.total_pages,
      currentPage: row.current_page,
      startDate: row.start_date,
      endDate: row.end_date,
      pagesPerDay: row.pages_per_day,
    } as BookMaterial;
  } else if (row.type === 'video') {
    return {
      ...base,
      type: 'video',
      sections: row.sections,
      totalDuration: row.total_duration,
      currentProgress: row.current_progress,
      startDate: row.start_date,
      endDate: row.end_date,
      sectionsPerDay: row.sections_per_day,
    } as VideoMaterial;
  } else {
    return {
      ...base,
      type: 'custom',
      tasks: row.tasks,
      startDate: row.start_date,
      endDate: row.end_date,
    } as any;
  }
}

// 날짜를 YYYY-MM-DD 형식으로 변환
function formatDateForDb(isoString: string): string {
  return isoString.split('T')[0];
}

// 학습 자료 변환: 앱 형식 → DB 형식
function materialToDb(material: AnyLearningMaterial) {
  const base = {
    type: material.type,
    title: material.title,
    description: material.description || null,
    color: material.color || null,
  };

  if (material.type === 'book') {
    return {
      ...base,
      total_pages: material.totalPages,
      current_page: material.currentPage,
      pages_per_day: material.pagesPerDay,
      start_date: formatDateForDb(material.startDate),
      end_date: formatDateForDb(material.endDate),
      sections: null,
      total_duration: null,
      current_progress: null,
      sections_per_day: null,
      tasks: null,
    };
  } else if (material.type === 'video') {
    return {
      ...base,
      sections: material.sections,
      total_duration: material.totalDuration,
      current_progress: material.currentProgress,
      sections_per_day: material.sectionsPerDay,
      start_date: formatDateForDb(material.startDate),
      end_date: formatDateForDb(material.endDate),
      total_pages: null,
      current_page: null,
      pages_per_day: null,
      tasks: null,
    };
  } else {
    return {
      ...base,
      tasks: (material as any).tasks,
      start_date: formatDateForDb(material.startDate),
      end_date: formatDateForDb(material.endDate),
      total_pages: null,
      current_page: null,
      pages_per_day: null,
      sections: null,
      total_duration: null,
      current_progress: null,
      sections_per_day: null,
    };
  }
}

// 학습 자료 저장/불러오기
export const materialStorage = {
  // 모든 학습 자료 가져오기
  async getAll(): Promise<AnyLearningMaterial[]> {
    try {
      const { data, error } = await supabase
        .from('materials')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data ? data.map(dbToMaterial) : [];
    } catch (error) {
      handleStorageError(error);
      return [];
    }
  },

  // 특정 학습 자료 가져오기
  async getById(id: string): Promise<AnyLearningMaterial | null> {
    try {
      const { data, error } = await supabase
        .from('materials')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data ? dbToMaterial(data) : null;
    } catch (error) {
      handleStorageError(error);
      return null;
    }
  },

  // 학습 자료 추가
  async add(
    material: AnyLearningMaterial
  ): Promise<{ success: boolean; error?: ErrorState }> {
    try {
      const dbData = materialToDb(material);

      const { error } = await supabase.from('materials').insert({
        id: material.id,
        ...dbData,
        created_at: material.createdAt,
        updated_at: material.updatedAt,
      });

      if (error) throw error;
      return { success: true };
    } catch (error) {
      return { success: false, error: handleStorageError(error) };
    }
  },

  // 학습 자료 업데이트
  async update(
    id: string,
    updates: Partial<AnyLearningMaterial>
  ): Promise<{ success: boolean; error?: ErrorState }> {
    try {
      // 기존 자료 가져오기
      const existing = await materialStorage.getById(id);
      if (!existing) {
        return {
          success: false,
          error: {
            hasError: true,
            message: '학습 자료를 찾을 수 없습니다.',
            type: 'storage',
          },
        };
      }

      // 업데이트된 자료 병합
      const updated = { ...existing, ...updates };
      const dbData = materialToDb(updated as AnyLearningMaterial);

      const { error } = await supabase
        .from('materials')
        .update(dbData)
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      return { success: false, error: handleStorageError(error) };
    }
  },

  // 학습 자료 삭제
  async delete(id: string): Promise<{ success: boolean; error?: ErrorState }> {
    try {
      const { error } = await supabase.from('materials').delete().eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      return { success: false, error: handleStorageError(error) };
    }
  },

  // 모든 학습 자료 삭제
  async clear(): Promise<{ success: boolean; error?: ErrorState }> {
    try {
      const { error } = await supabase.from('materials').delete().neq('id', '');

      if (error) throw error;
      return { success: true };
    } catch (error) {
      return { success: false, error: handleStorageError(error) };
    }
  },
};

// 완료된 과제 저장/불러오기
export const completedTasksStorage = {
  // 완료된 과제 ID 목록 가져오기
  async getAll(): Promise<Set<string>> {
    try {
      const { data, error } = await supabase
        .from('completed_tasks')
        .select('material_id, task_date');

      if (error) throw error;

      const taskKeys = data
        ? data.map((row) => `${row.material_id}-${row.task_date}`)
        : [];

      return new Set(taskKeys);
    } catch (error) {
      handleStorageError(error);
      return new Set();
    }
  },

  // 과제 완료 표시
  async markCompleted(materialId: string, date: string): Promise<void> {
    try {
      const { error } = await supabase.from('completed_tasks').upsert(
        {
          material_id: materialId,
          task_date: date,
        },
        {
          onConflict: 'material_id,task_date',
        }
      );

      if (error) throw error;
    } catch (error) {
      handleStorageError(error);
    }
  },

  // 과제 완료 취소
  async markIncomplete(materialId: string, date: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('completed_tasks')
        .delete()
        .eq('material_id', materialId)
        .eq('task_date', date);

      if (error) throw error;
    } catch (error) {
      handleStorageError(error);
    }
  },

  // 특정 과제가 완료되었는지 확인
  async isCompleted(materialId: string, date: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('completed_tasks')
        .select('id')
        .eq('material_id', materialId)
        .eq('task_date', date)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = 결과 없음
      return !!data;
    } catch (error) {
      handleStorageError(error);
      return false;
    }
  },

  // 완료된 과제 초기화
  async clear(): Promise<void> {
    try {
      const { error } = await supabase
        .from('completed_tasks')
        .delete()
        .neq('id', '');

      if (error) throw error;
    } catch (error) {
      handleStorageError(error);
    }
  },
};

// 설정 저장/불러오기
export const settingsStorage = {
  // 알림 설정 가져오기
  async getReminderSettings(): Promise<ReminderSetting> {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (!data) {
        // 기본값 반환
        return {
          enabled: false,
          time: '09:00',
          daysOfWeek: [1, 2, 3, 4, 5],
        };
      }

      return {
        enabled: data.reminder_enabled,
        time: data.reminder_time,
        daysOfWeek: data.reminder_days,
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
  async saveReminderSettings(settings: ReminderSetting): Promise<void> {
    try {
      // 기존 설정 확인
      const { data: existing } = await supabase
        .from('settings')
        .select('id')
        .limit(1)
        .single();

      const settingsData = {
        reminder_enabled: settings.enabled,
        reminder_time: settings.time,
        reminder_days: settings.daysOfWeek,
      };

      if (existing) {
        // 업데이트
        const { error } = await supabase
          .from('settings')
          .update(settingsData)
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // 새로 생성
        const { error } = await supabase.from('settings').insert(settingsData);

        if (error) throw error;
      }
    } catch (error) {
      handleStorageError(error);
    }
  },

  // 모든 설정 가져오기
  async getAll(): Promise<Record<string, unknown>> {
    const reminderSettings = await settingsStorage.getReminderSettings();
    return {
      reminderEnabled: reminderSettings.enabled,
      reminderTime: reminderSettings.time,
      reminderDays: reminderSettings.daysOfWeek,
    };
  },

  // 설정 초기화
  async clear(): Promise<void> {
    try {
      const { error } = await supabase.from('settings').delete().neq('id', '');

      if (error) throw error;
    } catch (error) {
      handleStorageError(error);
    }
  },
};

// 모든 데이터 내보내기 (백업용)
export async function exportAllData(): Promise<string> {
  const materials = await materialStorage.getAll();
  const completedTasks = Array.from(await completedTasksStorage.getAll());
  const settings = await settingsStorage.getAll();

  const data = {
    materials,
    completedTasks,
    settings,
    exportedAt: new Date().toISOString(),
  };

  return JSON.stringify(data, null, 2);
}

// 데이터 가져오기 (복원용)
export async function importAllData(
  jsonString: string
): Promise<{
  success: boolean;
  error?: ErrorState;
}> {
  try {
    const data = JSON.parse(jsonString);

    // 기존 데이터 삭제
    await materialStorage.clear();
    await completedTasksStorage.clear();
    await settingsStorage.clear();

    // 학습 자료 복원
    if (data.materials && Array.isArray(data.materials)) {
      for (const material of data.materials) {
        await materialStorage.add(material);
      }
    }

    // 완료된 과제 복원
    if (data.completedTasks && Array.isArray(data.completedTasks)) {
      for (const taskKey of data.completedTasks) {
        const [materialId, date] = taskKey.split('-');
        await completedTasksStorage.markCompleted(materialId, date);
      }
    }

    // 설정 복원
    if (data.settings) {
      const reminderSettings: ReminderSetting = {
        enabled: data.settings.reminderEnabled ?? false,
        time: data.settings.reminderTime ?? '09:00',
        daysOfWeek: data.settings.reminderDays ?? [1, 2, 3, 4, 5],
      };
      await settingsStorage.saveReminderSettings(reminderSettings);
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: handleStorageError(error) };
  }
}
