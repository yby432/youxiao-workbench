import { useState, useEffect, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Star,
  Flame,
  CalendarDays,
  TrendingUp,
  Check,
  X,
} from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import {
  getCheckinStats,
  getCalendar,
  getDayDetail,
  getProfile,
} from '@client/src/api/checkin';
import type { CheckinStats, UserLearningProfile } from '@shared/api.interface';
import type {
  CalendarDay,
  DayDetailResponse,
  SupplementResponse,
} from '@client/src/api/checkin';
import SupplementModal from './SupplementModal';

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

const MODULE_COLORS: Record<string, string> = {
  literacy: 'bg-green-200',
  pinyin: 'bg-purple-200',
  poetry: 'bg-orange-200',
  english: 'bg-cyan-200',
  math: 'bg-blue-200',
  science: 'bg-yellow-200',
};

const CheckinPage = () => {
  const [stats, setStats] = useState<CheckinStats | null>(null);
  const [profile, setProfile] = useState<UserLearningProfile | null>(null);
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [loading, setLoading] = useState(true);
  const [supplementOpen, setSupplementOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [dayDetail, setDayDetail] = useState<DayDetailResponse | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const [statsData, profileData] = await Promise.all([
        getCheckinStats(),
        getProfile(),
      ]);
      setStats(statsData);
      setProfile(profileData);
    } catch (err) {
      logger.error('获取打卡统计失败', err);
    }
  }, []);

  const fetchCalendar = useCallback(async (year: number, month: number) => {
    try {
      const data = await getCalendar(year, month);
      setCalendarDays(data.days);
    } catch (err) {
      logger.error('获取日历数据失败', err);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchStats(), fetchCalendar(currentYear, currentMonth)]);
      setLoading(false);
    };
    loadData();
  }, [currentYear, currentMonth, fetchStats, fetchCalendar]);

  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentYear(currentYear - 1);
      setCurrentMonth(12);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentYear(currentYear + 1);
      setCurrentMonth(1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleDayClick = async (day: CalendarDay) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dayDate = new Date(day.date);
    const isFuture = dayDate > today;

    if (isFuture) return;

    setSelectedDate(day.date);

    // 如果未完成且可补签，打开补签弹窗
    if (day.status !== 'full' && day.canSupplement) {
      setSupplementOpen(true);
    } else {
      // 显示任务详情
      try {
        const detail = await getDayDetail(day.date);
        setDayDetail(detail);
        setDetailOpen(true);
      } catch (err) {
        logger.error('获取日详情失败', err);
      }
    }
  };

  const handleSupplementSuccess = (result: SupplementResponse) => {
    // 更新日历状态
    setCalendarDays((prev) =>
      prev.map((d) =>
        d.date === selectedDate
          ? { ...d, status: result.newStatus, canSupplement: false }
          : d,
      ),
    );
    // 更新余额
    setProfile((prev) =>
      prev ? { ...prev, beanBalance: result.newBalance } : null,
    );
    // 重新获取统计
    fetchStats();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'full':
        return 'bg-green-200 text-green-800';
      case 'partial':
        return 'bg-amber-200 text-amber-800';
      default:
        return 'bg-gray-100 text-gray-400';
    }
  };

  const getFirstDayOfMonth = () => {
    return new Date(currentYear, currentMonth - 1, 1).getDay();
  };

  const isToday = (dateStr: string) => {
    const today = new Date();
    const t = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    return dateStr === t;
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-muted-foreground">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* 顶部打卡统计卡片 */}
      <div className="relative overflow-hidden bg-gradient-to-br from-amber-100 via-orange-50 to-yellow-100 px-5 pb-8 pt-12">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-yellow-200/40" />
        <div className="absolute -left-8 top-20 h-24 w-24 rounded-full bg-orange-200/40" />

        <h1 className="relative mb-6 text-center text-2xl font-bold text-amber-900">
          🌟 我的打卡
        </h1>

        {/* 连续打卡大数字 */}
        <div className="relative mb-6 flex flex-col items-center">
          <div className="flex items-center gap-2">
            <Flame className="h-8 w-8 text-orange-500" />
            <span className="text-6xl font-black text-orange-500 drop-shadow-sm">
              {stats?.currentStreak ?? 0}
            </span>
            <span className="text-xl font-bold text-orange-600">天</span>
          </div>
          <p className="mt-1 text-sm font-medium text-orange-700">
            连续打卡，继续加油！
          </p>
        </div>

        {/* 统计数据行 */}
        <div className="relative grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-white/80 p-4 shadow-sm backdrop-blur">
            <div className="mb-1 flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-amber-500" />
              <span className="text-sm text-muted-foreground">累计打卡</span>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {stats?.totalCheckinDays ?? 0}
              <span className="ml-1 text-sm font-normal text-muted-foreground">天</span>
            </p>
          </div>

          <div className="rounded-2xl bg-white/80 p-4 shadow-sm backdrop-blur">
            <div className="mb-1 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <span className="text-sm text-muted-foreground">本月完成率</span>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {Math.round((stats?.monthCompleteRate ?? 0) * 100)}
              <span className="ml-1 text-sm font-normal text-muted-foreground">%</span>
            </p>
          </div>
        </div>

        {/* 本月进度条 */}
        <div className="relative mt-4">
          <div className="h-3 w-full overflow-hidden rounded-full bg-white/60">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-400 transition-all duration-500"
              style={{ width: `${Math.round((stats?.monthCompleteRate ?? 0) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* 日历区域 */}
      <div className="px-5 py-6">
        <div className="rounded-3xl bg-white p-5 shadow-sm">
          {/* 月份切换 */}
          <div className="mb-4 flex items-center justify-between">
            <button
              onClick={handlePrevMonth}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-muted/50 text-muted-foreground transition hover:bg-muted"
            >
              <ChevronLeft size={20} />
            </button>
            <h2 className="text-lg font-bold text-foreground">
              {currentYear}年{currentMonth}月
            </h2>
            <button
              onClick={handleNextMonth}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-muted/50 text-muted-foreground transition hover:bg-muted"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          {/* 星期表头 */}
          <div className="mb-2 grid grid-cols-7 gap-1">
            {WEEKDAYS.map((day) => (
              <div
                key={day}
                className="py-2 text-center text-xs font-medium text-muted-foreground"
              >
                {day}
              </div>
            ))}
          </div>

          {/* 日历格子 */}
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: getFirstDayOfMonth() }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}
            {calendarDays.map((day) => {
              const dayNum = parseInt(day.date.split('-')[2], 10);
              const today = isToday(day.date);
              const futureDate = new Date(day.date) > new Date(new Date().setHours(0, 0, 0, 0));

              return (
                <button
                  key={day.date}
                  onClick={() => handleDayClick(day)}
                  disabled={futureDate}
                  className={`
                    relative flex aspect-square flex-col items-center justify-center
                    rounded-xl text-sm font-medium transition
                    ${getStatusColor(day.status)}
                    ${today ? 'ring-2 ring-primary ring-offset-1' : ''}
                    ${futureDate ? 'opacity-30 cursor-not-allowed' : 'hover:scale-105 active:scale-95'}
                  `}
                >
                  <span>{dayNum}</span>
                  {day.status === 'full' && (
                    <Star className="absolute -top-1 -right-1 h-4 w-4 fill-yellow-400 text-yellow-500" />
                  )}
                  {day.canSupplement && day.status !== 'full' && (
                    <span className="absolute bottom-0.5 h-1.5 w-1.5 rounded-full bg-orange-400" />
                  )}
                </button>
              );
            })}
          </div>

          {/* 图例 */}
          <div className="mt-4 flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-md bg-green-200" />
              <span>全部完成</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-md bg-amber-200" />
              <span>部分完成</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-md bg-gray-100" />
              <span>未完成</span>
            </div>
          </div>
        </div>
      </div>

      {/* 补打卡弹窗 */}
      <SupplementModal
        open={supplementOpen}
        date={selectedDate}
        beanBalance={profile?.beanBalance ?? 0}
        onClose={() => setSupplementOpen(false)}
        onSuccess={handleSupplementSuccess}
      />

      {/* 任务详情弹窗 */}
      {detailOpen && dayDetail && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 sm:items-center">
          <div className="relative w-full max-w-md rounded-t-3xl bg-white p-6 shadow-xl sm:rounded-3xl">
            <button
              onClick={() => setDetailOpen(false)}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-muted/50 text-muted-foreground transition hover:bg-muted"
              aria-label="关闭"
            >
              <X size={18} />
            </button>

            <h3 className="mb-1 text-xl font-bold text-foreground">
              {dayDetail.date}
            </h3>
            <p className="mb-4 text-sm text-muted-foreground">
              状态：
              <span
                className={`ml-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                  dayDetail.status === 'full'
                    ? 'bg-green-100 text-green-700'
                    : dayDetail.status === 'partial'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-gray-100 text-gray-500'
                }`}
              >
                {dayDetail.status === 'full'
                  ? '全部完成'
                  : dayDetail.status === 'partial'
                    ? '部分完成'
                    : '未完成'}
              </span>
            </p>

            <div className="max-h-80 space-y-2 overflow-y-auto">
              {dayDetail.allTasks.map((task) => (
                <div
                  key={task.id}
                  className={`flex items-center gap-3 rounded-2xl p-3 ${
                    task.completed ? 'bg-green-50' : 'bg-muted/30'
                  }`}
                >
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                      MODULE_COLORS[task.module] || 'bg-gray-200'
                    }`}
                  >
                    {task.completed ? (
                      <Check className="h-5 w-5 text-green-600" />
                    ) : (
                      <span className="text-lg">📚</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{task.name}</p>
                    <p className="text-xs text-muted-foreground">
                      奖励 {task.beanReward} 学习豆
                    </p>
                  </div>
                  {task.completed && (
                    <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                      已完成
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckinPage;
