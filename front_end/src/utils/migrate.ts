import { supabase } from '../lib/supabase';
import { STORAGE_KEYS } from '../types';

/**
 * localStorage에서 Supabase로 데이터 마이그레이션
 *
 * 사용법:
 * 1. 개발자 도구 콘솔 열기 (F12)
 * 2. 다음 코드 실행:
 *    import { migrateToSupabase } from './utils/migrate'
 *    migrateToSupabase()
 */
export async function migrateToSupabase(): Promise<{
  success: boolean;
  message: string;
  details?: any;
}> {
  try {
    console.log('🚀 Supabase 마이그레이션 시작...');

    // 1. localStorage에서 데이터 읽기
    const materialsJson = localStorage.getItem(STORAGE_KEYS.MATERIALS);
    const completedTasksJson = localStorage.getItem(STORAGE_KEYS.COMPLETED_TASKS);
    const settingsJson = localStorage.getItem(STORAGE_KEYS.SETTINGS);

    console.log('📦 localStorage 데이터 확인 중...');

    // 데이터 파싱
    const materials = materialsJson ? JSON.parse(materialsJson) : [];
    const completedTasksArray = completedTasksJson
      ? JSON.parse(completedTasksJson)
      : [];
    const settings = settingsJson ? JSON.parse(settingsJson) : {};

    console.log(`📚 학습 자료: ${materials.length}개`);
    console.log(`✅ 완료된 과제: ${completedTasksArray.length}개`);

    if (materials.length === 0 && completedTasksArray.length === 0) {
      return {
        success: true,
        message: '마이그레이션할 데이터가 없습니다.',
      };
    }

    // 2. 학습 자료 마이그레이션
    if (materials.length > 0) {
      console.log('📚 학습 자료 마이그레이션 중...');

      for (const material of materials) {
        const dbData: any = {
          id: material.id,
          type: material.type,
          title: material.title,
          description: material.description,
          color: material.color,
          created_at: material.createdAt,
          updated_at: material.updatedAt,
        };

        // 타입별 필드 매핑
        if (material.type === 'book') {
          dbData.total_pages = material.totalPages;
          dbData.current_page = material.currentPage;
          dbData.pages_per_day = material.pagesPerDay;
          dbData.start_date = material.startDate;
          dbData.end_date = material.endDate;
        } else if (material.type === 'video') {
          dbData.sections = material.sections;
          dbData.total_duration = material.totalDuration;
          dbData.current_progress = material.currentProgress;
          dbData.sections_per_day = material.sectionsPerDay;
          dbData.start_date = material.startDate;
          dbData.end_date = material.endDate;
        } else if (material.type === 'custom') {
          dbData.tasks = material.tasks;
          dbData.start_date = material.startDate;
          dbData.end_date = material.endDate;
        }

        const { error } = await supabase.from('materials').upsert(dbData, {
          onConflict: 'id',
        });

        if (error) {
          console.error(`❌ 자료 마이그레이션 실패: ${material.title}`, error);
          throw error;
        }

        console.log(`  ✓ ${material.title}`);
      }

      console.log('✅ 학습 자료 마이그레이션 완료!');
    }

    // 3. 완료된 과제 마이그레이션
    if (completedTasksArray.length > 0) {
      console.log('✅ 완료된 과제 마이그레이션 중...');

      for (const taskKey of completedTasksArray) {
        const [materialId, taskDate] = taskKey.split('-');

        const { error } = await supabase.from('completed_tasks').upsert(
          {
            material_id: materialId,
            task_date: taskDate,
          },
          {
            onConflict: 'material_id,task_date',
          }
        );

        if (error) {
          console.error(`❌ 과제 마이그레이션 실패: ${taskKey}`, error);
          throw error;
        }
      }

      console.log('✅ 완료된 과제 마이그레이션 완료!');
    }

    // 4. 설정 마이그레이션
    if (Object.keys(settings).length > 0) {
      console.log('⚙️ 설정 마이그레이션 중...');

      const settingsData = {
        reminder_enabled: settings.reminderEnabled ?? false,
        reminder_time: settings.reminderTime ?? '09:00',
        reminder_days: settings.reminderDays ?? [1, 2, 3, 4, 5],
      };

      const { error } = await supabase.from('settings').insert(settingsData);

      if (error && error.code !== '23505') {
        // 23505 = unique violation
        console.error('❌ 설정 마이그레이션 실패', error);
        throw error;
      }

      console.log('✅ 설정 마이그레이션 완료!');
    }

    const summary = {
      materials: materials.length,
      completedTasks: completedTasksArray.length,
      settings: Object.keys(settings).length > 0 ? 1 : 0,
    };

    console.log('');
    console.log('🎉 마이그레이션 완료!');
    console.log('📊 요약:', summary);
    console.log('');
    console.log('💡 이제 localStorage 데이터를 삭제해도 안전합니다.');
    console.log('   삭제하려면: clearLocalStorage() 실행');

    return {
      success: true,
      message: '마이그레이션이 성공적으로 완료되었습니다!',
      details: summary,
    };
  } catch (error) {
    console.error('❌ 마이그레이션 실패:', error);
    return {
      success: false,
      message: '마이그레이션 중 오류가 발생했습니다.',
      details: error,
    };
  }
}

/**
 * localStorage 데이터 백업
 */
export function backupLocalStorage(): string {
  const materialsJson = localStorage.getItem(STORAGE_KEYS.MATERIALS);
  const completedTasksJson = localStorage.getItem(STORAGE_KEYS.COMPLETED_TASKS);
  const settingsJson = localStorage.getItem(STORAGE_KEYS.SETTINGS);

  const backup = {
    materials: materialsJson ? JSON.parse(materialsJson) : [],
    completedTasks: completedTasksJson ? JSON.parse(completedTasksJson) : [],
    settings: settingsJson ? JSON.parse(settingsJson) : {},
    backupDate: new Date().toISOString(),
  };

  const backupString = JSON.stringify(backup, null, 2);

  // 콘솔에 출력
  console.log('💾 localStorage 백업:');
  console.log(backupString);

  // 파일로 다운로드
  const blob = new Blob([backupString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `backup-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);

  console.log('✅ 백업 파일 다운로드됨!');

  return backupString;
}

/**
 * localStorage 데이터 삭제 (마이그레이션 후 실행)
 */
export function clearLocalStorage(): void {
  const confirm = window.confirm(
    '⚠️ localStorage의 모든 데이터를 삭제합니다.\n' +
      'Supabase로 마이그레이션이 완료되었는지 확인하세요!\n\n' +
      '계속하시겠습니까?'
  );

  if (!confirm) {
    console.log('❌ 삭제 취소됨');
    return;
  }

  localStorage.removeItem(STORAGE_KEYS.MATERIALS);
  localStorage.removeItem(STORAGE_KEYS.COMPLETED_TASKS);
  localStorage.removeItem(STORAGE_KEYS.SETTINGS);

  console.log('🗑️ localStorage 데이터 삭제 완료!');
  console.log('페이지를 새로고침하면 Supabase에서 데이터를 불러옵니다.');
}

/**
 * Supabase 연결 테스트
 */
export async function testSupabaseConnection(): Promise<boolean> {
  try {
    console.log('🔍 Supabase 연결 테스트 중...');

    const { data, error } = await supabase
      .from('materials')
      .select('count')
      .limit(1);

    if (error) {
      console.error('❌ 연결 실패:', error);
      return false;
    }

    console.log('✅ Supabase 연결 성공!');
    return true;
  } catch (error) {
    console.error('❌ 연결 실패:', error);
    return false;
  }
}

// 전역 객체에 함수 등록 (콘솔에서 쉽게 사용하기 위해)
if (typeof window !== 'undefined') {
  (window as any).migrateToSupabase = migrateToSupabase;
  (window as any).backupLocalStorage = backupLocalStorage;
  (window as any).clearLocalStorage = clearLocalStorage;
  (window as any).testSupabaseConnection = testSupabaseConnection;
}
