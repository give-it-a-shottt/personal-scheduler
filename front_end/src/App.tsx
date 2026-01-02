import { useState, useEffect, useMemo } from 'react';
import { WeeklyCalendar } from './components/WeeklyCalendar';
import { BookModal } from './components/BookModal';
import { VideoModal } from './components/VideoModal';
import { TaskDetailModal } from './components/TaskDetailModal';
import { TodayTasks } from './components/TodayTasks';
import MonthCalendar from './components/MonthCalendar';
import { DayDetailModal } from './components/DayDetailModal';
import type {
  AnyLearningMaterial,
  BookFormData,
  VideoFormData,
  SystemStatus,
  WeeklyPlan,
  DailyTask,
} from './types';
import { materialStorage, completedTasksStorage } from './utils/supabaseStorage';
import { scheduleBook, scheduleVideo, generateWeeklyPlan, calculateProgress } from './utils/scheduler';
import { formatDuration } from './utils/videoParser';
// 마이그레이션 함수를 전역에서 사용할 수 있도록 import
import './utils/migrate';

function App() {
  // 상태 관리
  const [materials, setMaterials] = useState<AnyLearningMaterial[]>([]);
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());
  const [activeView, setActiveView] = useState<'today' | 'week' | 'calendar'>('today');
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [isTaskDetailOpen, setIsTaskDetailOpen] = useState(false);
  const [isDayDetailModalOpen, setIsDayDetailModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<{
    task: DailyTask;
    date: string;
  } | null>(null);
  const [selectedDate, setSelectedDate] = useState<{
    date: string;
    tasks: DailyTask[];
  } | null>(null);
  const [editingMaterial, setEditingMaterial] = useState<AnyLearningMaterial | null>(null);
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    isSaving: false,
    hasUnsavedChanges: false,
  });

  // 초기 데이터 로드
  useEffect(() => {
    const loadData = async () => {
      const loadedMaterials = await materialStorage.getAll();
      const loadedCompletedTasks = await completedTasksStorage.getAll();

      setMaterials(loadedMaterials);
      setCompletedTasks(loadedCompletedTasks);
    };

    loadData();
  }, []);

  // 주간 계획 생성
  const weeklyPlan: WeeklyPlan = useMemo(() => {
    return generateWeeklyPlan(materials);
  }, [materials]);

  // 책 등록/수정 처리
  const handleAddBook = async (formData: BookFormData) => {
    setSystemStatus({ ...systemStatus, isSaving: true });

    const totalPages = formData.endPage - formData.startPage + 1;

    const bookData = scheduleBook(
      formData.title,
      formData.startPage,
      formData.endPage,
      totalPages,
      new Date(formData.startDate),
      new Date(formData.endDate),
      formData.studyDays,
      formData.description,
      formData.dailyStudyHours,
      formData.minutesPerPage
    );

    let result;
    if (editingMaterial && editingMaterial.type === 'book') {
      // 수정 모드
      const updatedBook = { ...bookData, id: editingMaterial.id };
      result = await materialStorage.update(editingMaterial.id, updatedBook);

      if (result.success) {
        setMaterials(materials.map(m => m.id === editingMaterial.id ? updatedBook : m));
        setSystemStatus({
          isSaving: false,
          hasUnsavedChanges: false,
          lastSaved: new Date(),
          successMessage: '책이 성공적으로 수정되었습니다!',
        });
      }
    } else {
      // 등록 모드
      result = await materialStorage.add(bookData);

      if (result.success) {
        setMaterials([...materials, bookData]);
        setSystemStatus({
          isSaving: false,
          hasUnsavedChanges: false,
          lastSaved: new Date(),
          successMessage: '책이 성공적으로 등록되었습니다!',
        });
      }
    }

    if (!result.success) {
      setSystemStatus({
        isSaving: false,
        hasUnsavedChanges: false,
        error: result.error,
      });
    } else {
      // 성공 메시지 3초 후 자동 숨김
      setTimeout(() => {
        setSystemStatus((prev) => ({ ...prev, successMessage: undefined }));
      }, 3000);
      setEditingMaterial(null);
    }
  };

  // 동영상 등록/수정 처리
  const handleAddVideo = async (formData: VideoFormData) => {
    setSystemStatus({ ...systemStatus, isSaving: true });

    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);

    const totalDuration = formData.sections.reduce(
      (sum, section) => sum + section.duration,
      0
    );

    const videoData = scheduleVideo(
      formData.title,
      formData.sections,
      totalDuration,
      startDate,
      endDate,
      formData.studyDays,
      formData.description,
      formData.dailyStudyHours
    );

    let result;
    if (editingMaterial && editingMaterial.type === 'video') {
      // 수정 모드
      const updatedVideo = { ...videoData, id: editingMaterial.id };
      result = await materialStorage.update(editingMaterial.id, updatedVideo);

      if (result.success) {
        setMaterials(materials.map(m => m.id === editingMaterial.id ? updatedVideo : m));
        setSystemStatus({
          isSaving: false,
          hasUnsavedChanges: false,
          lastSaved: new Date(),
          successMessage: '동영상 강의가 성공적으로 수정되었습니다!',
        });
      }
    } else {
      // 등록 모드
      result = await materialStorage.add(videoData);

      if (result.success) {
        setMaterials([...materials, videoData]);
        setSystemStatus({
          isSaving: false,
          hasUnsavedChanges: false,
          lastSaved: new Date(),
          successMessage: '동영상 강의가 성공적으로 등록되었습니다!',
        });
      }
    }

    if (!result.success) {
      setSystemStatus({
        isSaving: false,
        hasUnsavedChanges: false,
        error: result.error,
      });
    } else {
      // 성공 메시지 3초 후 자동 숨김
      setTimeout(() => {
        setSystemStatus((prev) => ({ ...prev, successMessage: undefined }));
      }, 3000);
      setEditingMaterial(null);
    }
  };

  // 과제 완료/미완료 토글
  const handleTaskToggle = async (
    materialId: string,
    date: string,
    completed: boolean
  ) => {
    if (completed) {
      await completedTasksStorage.markCompleted(materialId, date);
      setCompletedTasks(new Set([...completedTasks, `${materialId}-${date}`]));
    } else {
      await completedTasksStorage.markIncomplete(materialId, date);
      const newSet = new Set(completedTasks);
      newSet.delete(`${materialId}-${date}`);
      setCompletedTasks(newSet);
    }

    // 진행도 업데이트
    const material = materials.find((m) => m.id === materialId);
    if (material) {
      // 해당 날짜의 과제 찾기
      const task = weeklyPlan.days
        .find(day => day.date === date)
        ?.tasks.find(t => t.materialId === materialId);

      if (task) {
        if (material.type === 'book' && task.endPage) {
          // 책: 완료된 경우 currentPage를 업데이트, 미완료 시에도 이전 진행도로 조정
          const newCurrentPage = completed
            ? Math.max(material.currentPage, task.endPage)
            : task.startPage ? task.startPage - 1 : material.currentPage;

          const updatedBook = {
            ...material,
            currentPage: newCurrentPage,
            updatedAt: new Date().toISOString(),
          };

          // 상태 업데이트
          setMaterials(materials.map(m => m.id === materialId ? updatedBook : m));

          // 스토리지에 저장
          await materialStorage.update(materialId, updatedBook);
        } else if (material.type === 'video') {
          // 동영상: 완료된 섹션 수를 계산
          // 해당 날짜까지의 모든 완료된 과제를 확인하여 진행도 계산
          const videoStart = new Date(material.startDate);
          const currentDate = new Date(date);
          const dateRange = [];
          for (let d = new Date(videoStart); d <= currentDate; d.setDate(d.getDate() + 1)) {
            dateRange.push(new Date(d));
          }

          // 완료된 학습일 수 계산
          const completedStudyDays = dateRange.filter(d => {
            const dayOfWeek = d.getDay();
            const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            return material.studyDays.includes(dayOfWeek) &&
                   (completedTasks.has(`${materialId}-${dateStr}`) || (dateStr === date && completed));
          }).length;

          // 진행도 = 완료된 학습일 수 * 하루 섹션 수 (최대값은 전체 섹션 수)
          const newProgress = Math.min(
            Math.floor(completedStudyDays * material.sectionsPerDay),
            material.sections.length
          );

          const updatedVideo = {
            ...material,
            currentProgress: newProgress,
            updatedAt: new Date().toISOString(),
          };

          // 상태 업데이트
          setMaterials(materials.map(m => m.id === materialId ? updatedVideo : m));

          // 스토리지에 저장
          await materialStorage.update(materialId, updatedVideo);
        }
      }
    }
  };

  // 과제 클릭 핸들러
  const handleTaskClick = (task: DailyTask, date: string) => {
    setSelectedTask({ task, date });
    setIsTaskDetailOpen(true);
  };

  // 날짜 클릭 핸들러 (달력에서 날짜 클릭 시)
  const handleDayClick = (date: string, tasks: DailyTask[]) => {
    setSelectedDate({ date, tasks });
    setIsDayDetailModalOpen(true);
  };

  // 학습 자료 수정
  const handleEditMaterial = (material: AnyLearningMaterial) => {
    setEditingMaterial(material);
    if (material.type === 'book') {
      setIsBookModalOpen(true);
    } else if (material.type === 'video') {
      setIsVideoModalOpen(true);
    }
  };

  // 학습 자료 삭제
  const handleDeleteMaterial = async (id: string) => {
    if (confirm('정말 이 학습 자료를 삭제하시겠습니까?')) {
      const result = await materialStorage.delete(id);

      if (result.success) {
        setMaterials(materials.filter((m) => m.id !== id));
        setSystemStatus({
          ...systemStatus,
          successMessage: '삭제되었습니다.',
        });

        setTimeout(() => {
          setSystemStatus((prev) => ({ ...prev, successMessage: undefined }));
        }, 3000);
      }
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8 relative z-10">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 헤더 */}
        <header className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white text-shadow-lg">
                📚 1주 학습 스케줄러
              </h1>
              <p className="text-white/70 mt-2">
                체계적인 학습 계획으로 목표를 달성하세요
              </p>
            </div>

            {/* 등록 버튼 그룹 */}
            <div className="flex gap-2">
              <button
                onClick={() => setIsBookModalOpen(true)}
                className="glass-button-primary flex items-center gap-2"
                title="새로운 책 등록"
              >
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
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
                <span className="hidden md:inline">책 등록</span>
              </button>
              <button
                onClick={() => setIsVideoModalOpen(true)}
                className="glass-button bg-secondary-500/80 hover:bg-secondary-600/80 border-secondary-400/50 flex items-center gap-2"
                title="새로운 동영상 강의 등록"
              >
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
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                <span className="hidden md:inline">동영상 등록</span>
              </button>
            </div>
          </div>

          {/* 시스템 상태 표시 (휴리스틱 #1: 시스템 상태 시각화) */}
          {systemStatus.successMessage && (
            <div className="glass-card bg-green-500/20 p-3 flex items-center gap-2">
              <svg
                className="w-5 h-5 text-green-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span className="text-white text-sm">
                {systemStatus.successMessage}
              </span>
            </div>
          )}

          {systemStatus.error && (
            <div className="glass-card bg-red-500/20 p-3 flex items-center gap-2">
              <svg
                className="w-5 h-5 text-red-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-white text-sm">
                {systemStatus.error.message}
              </span>
            </div>
          )}
        </header>

        {/* 탭 네비게이션 */}
        <div className="glass-card p-2 flex gap-2">
          <button
            onClick={() => setActiveView('today')}
            className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
              activeView === 'today'
                ? 'glass-button-primary'
                : 'glass-button hover:bg-white/10'
            }`}
          >
            📅 오늘
          </button>
          <button
            onClick={() => setActiveView('week')}
            className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
              activeView === 'week'
                ? 'glass-button-primary'
                : 'glass-button hover:bg-white/10'
            }`}
          >
            📆 이번주
          </button>
          <button
            onClick={() => setActiveView('calendar')}
            className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
              activeView === 'calendar'
                ? 'glass-button-primary'
                : 'glass-button hover:bg-white/10'
            }`}
          >
            🗓️ 달력
          </button>
        </div>

        {/* 등록된 학습 자료 목록 */}
        {materials.length > 0 && (
          <div className="glass-card p-6">
            <h3 className="text-xl font-bold text-white mb-4">
              등록된 학습 자료
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {materials.map((material) => (
                <div
                  key={material.id}
                  className="glass-card-hover p-4 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="text-white font-semibold">
                        {material.title}
                      </h4>
                      {material.type === 'book' && (
                        <p className="text-white/60 text-sm mt-1">
                          총 {material.totalPages}페이지 · 하루{' '}
                          {material.pagesPerDay}페이지
                        </p>
                      )}
                      {material.type === 'video' && (
                        <p className="text-white/60 text-sm mt-1">
                          총 {material.sections.length}개 강의 ·{' '}
                          {formatDuration(material.totalDuration)}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditMaterial(material)}
                        className="text-white/40 hover:text-blue-300 transition-colors"
                        title="수정"
                      >
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
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteMaterial(material.id)}
                        className="text-white/40 hover:text-red-300 transition-colors"
                        title="삭제"
                      >
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
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* 진행도 */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-white/70">
                      <span>진행도</span>
                      <span>{calculateProgress(material)}%</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary-400 to-secondary-400 transition-all"
                        style={{ width: `${calculateProgress(material)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 오늘의 학습 */}
        {activeView === 'today' && materials.length > 0 && (
          <TodayTasks
            weeklyPlan={weeklyPlan}
            completedTasks={completedTasks}
            onTaskClick={handleTaskClick}
            onTaskToggle={handleTaskToggle}
          />
        )}

        {/* 주간 캘린더 */}
        {activeView === 'week' && (
          <WeeklyCalendar
            weeklyPlan={weeklyPlan}
            onTaskToggle={handleTaskToggle}
            onTaskClick={handleTaskClick}
            completedTasks={completedTasks}
          />
        )}

        {/* 월간 캘린더 */}
        {activeView === 'calendar' && (
          <MonthCalendar
            materials={materials}
            completedTasks={completedTasks}
            onDayClick={handleDayClick}
          />
        )}

        {/* 빈 상태 (휴리스틱 #6: 직관적 안내) */}
        {materials.length === 0 && (
          <div className="glass-card p-12 text-center">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-2xl font-bold text-white mb-2">
              아직 등록된 학습 자료가 없습니다
            </h3>
            <p className="text-white/60 mb-6">
              상단의 '책 등록' 또는 '동영상 등록' 버튼을 눌러<br />
              첫 학습 계획을 시작해보세요!
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setIsBookModalOpen(true)}
                className="glass-button-primary"
              >
                첫 책 등록하기
              </button>
              <button
                onClick={() => setIsVideoModalOpen(true)}
                className="glass-button bg-secondary-500/80 hover:bg-secondary-600/80 border-secondary-400/50"
              >
                첫 동영상 등록하기
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 책 등록 모달 */}
      <BookModal
        isOpen={isBookModalOpen}
        onClose={() => {
          setIsBookModalOpen(false);
          setEditingMaterial(null);
        }}
        onSubmit={handleAddBook}
        editMaterial={editingMaterial?.type === 'book' ? editingMaterial : null}
      />

      {/* 동영상 등록 모달 */}
      <VideoModal
        isOpen={isVideoModalOpen}
        onClose={() => {
          setIsVideoModalOpen(false);
          setEditingMaterial(null);
        }}
        onSubmit={handleAddVideo}
        editMaterial={editingMaterial?.type === 'video' ? editingMaterial : null}
      />

      {/* 과제 상세 모달 */}
      {selectedTask && (
        <TaskDetailModal
          isOpen={isTaskDetailOpen}
          onClose={() => {
            setIsTaskDetailOpen(false);
            setSelectedTask(null);
          }}
          task={selectedTask.task}
          onToggle={() => {
            const taskKey = `${selectedTask.task.materialId}-${selectedTask.date}`;
            const isCurrentlyCompleted = completedTasks.has(taskKey);
            handleTaskToggle(
              selectedTask.task.materialId,
              selectedTask.date,
              !isCurrentlyCompleted
            );
          }}
          isCompleted={completedTasks.has(
            `${selectedTask.task.materialId}-${selectedTask.date}`
          )}
        />
      )}

      {/* 날짜별 과제 모달 */}
      {selectedDate && (
        <DayDetailModal
          isOpen={isDayDetailModalOpen}
          date={selectedDate.date}
          tasks={selectedDate.tasks}
          completedTasks={completedTasks}
          onClose={() => {
            setIsDayDetailModalOpen(false);
            setSelectedDate(null);
          }}
          onTaskToggle={handleTaskToggle}
        />
      )}
    </div>
  );
}

export default App;
