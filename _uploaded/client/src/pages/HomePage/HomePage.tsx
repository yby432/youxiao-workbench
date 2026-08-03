import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Music,
  Feather,
  Globe,
  Calculator,
  Lightbulb,
  Sparkles,
  Check,
  Flame,
  Coins,
} from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { getHomeSummary } from '@client/src/api/home';
import type { HomeSummary, ModuleSummary, DailyTask } from '@shared/api.interface';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  BookOpen,
  Music,
  Feather,
  Globe,
  Calculator,
  Lightbulb,
};

const moduleRoutes: Record<string, string> = {
  literacy: '/literacy',
  pinyin: '/pinyin',
  poetry: '/poetry',
  english: '/english',
  math: '/math',
  science: '/science',
};

const moduleTaskIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  literacy: BookOpen,
  pinyin: Music,
  poetry: Feather,
  english: Globe,
  math: Calculator,
  science: Lightbulb,
};

const moduleColors: Record<string, string> = {
  literacy: 'from-[#A8E6C8] to-[#C8F0DC]',
  pinyin: 'from-[#D4C5F0] to-[#E8DFF5]',
  poetry: 'from-[#F5C9A0] to-[#FADFC4]',
  english: 'from-[#A8DDE6] to-[#C8E8EE]',
  math: 'from-[#A8C8E6] to-[#C8DCEE]',
  science: 'from-[#F5E6A0] to-[#FAF0C4]',
};

const moduleBgColors: Record<string, string> = {
  literacy: 'bg-[#E8F8EF]',
  pinyin: 'bg-[#F0EAF8]',
  poetry: 'bg-[#FBEFE0]',
  english: 'bg-[#E0F2F5]',
  math: 'bg-[#E0ECF5]',
  science: 'bg-[#FAF3D8]',
};

const moduleTextColors: Record<string, string> = {
  literacy: 'text-[#3A8F6A]',
  pinyin: 'text-[#7B5FB8]',
  poetry: 'text-[#C47A3A]',
  english: 'text-[#3A8F9A]',
  math: 'text-[#3A6A9F]',
  science: 'text-[#9A8A2A]',
};

const HomePage = () => {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<HomeSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await getHomeSummary();
        setSummary(data);
      } catch (err) {
        logger.error('加载首页数据失败', err);
        setError('加载失败，请稍后重试');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleModuleClick = (moduleKey: string) => {
    const route = moduleRoutes[moduleKey];
    if (route) {
      navigate(route);
    }
  };

  const handleTaskClick = (task: DailyTask) => {
    if (task.completed) return;
    const route = moduleRoutes[task.module];
    if (route) {
      navigate(route);
    }
  };

  const allTasksDone = summary?.dailyTasks.every((t: DailyTask) => t.completed) ?? false;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">加载中...</div>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">{error || '暂无数据'}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* 顶部渐变背景条 */}
      <div className="bg-gradient-to-br from-[#FFD8A8] via-[#FFE8CC] to-[#FFF5E6] pt-8 pb-16 px-5 relative overflow-hidden">
        {/* 装饰圆点 */}
        <div className="absolute top-4 right-8 w-16 h-16 rounded-full bg-white/30 blur-sm" />
        <div className="absolute top-12 right-24 w-8 h-8 rounded-full bg-white/20 blur-sm" />
        <div className="absolute bottom-4 left-4 w-12 h-12 rounded-full bg-white/20 blur-sm" />

        {/* 用户栏 */}
        <div className="flex items-center justify-between relative z-10">
          <button
            onClick={() => navigate('/profile')}
            className="flex items-center gap-3 active:scale-95 transition-transform"
          >
            <div className="w-12 h-12 rounded-full border-4 border-white shadow-md overflow-hidden bg-gradient-to-br from-[#FFD8A8] to-[#FFB088] flex items-center justify-center">
              <span className="text-2xl">👦</span>
            </div>
            <div className="text-left">
              <div className="text-sm text-foreground/70">你好呀~</div>
              <div className="text-lg font-bold text-foreground">小朋友</div>
            </div>
          </button>

          {/* 学习豆胶囊 */}
          <div className="flex items-center gap-1.5 bg-gradient-to-r from-[#FFD93D] to-[#FFB347] px-4 py-2 rounded-full shadow-md">
            <Coins className="w-5 h-5 text-white fill-white/30" />
            <span className="text-white font-bold text-lg leading-none">
              {summary.profile.beanBalance}
            </span>
          </div>
        </div>

        {/* 连续打卡 */}
        <div className="flex items-center gap-2 mt-4 relative z-10">
          <div className="flex items-center gap-1 bg-white/60 backdrop-blur-sm px-3 py-1.5 rounded-full">
            <Flame className="w-4 h-4 text-[#FF6B35]" />
            <span className="text-sm font-semibold text-foreground">
              连续打卡 {summary.profile.currentStreak} 天
            </span>
          </div>
        </div>
      </div>

      {/* 内容区 */}
      <div className="px-5 -mt-8 relative z-20">
        {/* 6大模块卡片 */}
        <div className="bg-white rounded-3xl shadow-sm p-5 mb-5">
          <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            学习乐园
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {summary.modules.map((mod: ModuleSummary) => {
              const Icon = iconMap[mod.icon] || BookOpen;
              const gradient = moduleColors[mod.key] || moduleColors.literacy;
              return (
                <button
                  key={mod.key}
                  onClick={() => handleModuleClick(mod.key)}
                  className={`bg-gradient-to-br ${gradient} rounded-2xl p-4 flex flex-col items-center gap-2 shadow-sm active:scale-95 transition-all hover:shadow-md`}
                >
                  <div className="w-12 h-12 rounded-full bg-white/40 flex items-center justify-center">
                    <Icon className="w-6 h-6 text-white drop-shadow-sm" />
                  </div>
                  <span className="text-sm font-bold text-white drop-shadow-sm">
                    {mod.name}
                  </span>
                  <div className="w-full h-1.5 bg-white/40 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-white rounded-full transition-all"
                      style={{ width: `${mod.progress}%` }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 今日任务区 */}
        <div className="bg-white rounded-3xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              今日小任务
            </h2>
            {allTasksDone && (
              <span className="text-xs bg-[#E8F8EF] text-[#3A8F6A] px-3 py-1 rounded-full font-semibold">
                🎉 全部完成！
              </span>
            )}
          </div>

          <div className="space-y-3">
            {summary.dailyTasks.map((task: DailyTask) => {
              const Icon = moduleTaskIcons[task.module] || BookOpen;
              const bgColor = moduleBgColors[task.module] || moduleBgColors.literacy;
              const textColor = moduleTextColors[task.module] || moduleTextColors.literacy;
              return (
                <button
                  key={task.id}
                  onClick={() => handleTaskClick(task)}
                  disabled={task.completed}
                  className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all ${
                    task.completed
                      ? 'bg-muted/50 opacity-60'
                      : `${bgColor} active:scale-[0.98] hover:shadow-sm`
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      task.completed ? 'bg-[#E8F8EF]' : 'bg-white/70'
                    }`}
                  >
                    {task.completed ? (
                      <Check className="w-5 h-5 text-[#3A8F6A]" />
                    ) : (
                      <Icon className={`w-5 h-5 ${textColor}`} />
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <div
                      className={`font-semibold ${
                        task.completed ? 'text-muted-foreground line-through' : 'text-foreground'
                      }`}
                    >
                      {task.name}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Coins
                      className={`w-4 h-4 ${
                        task.completed ? 'text-muted-foreground' : 'text-[#FFB347]'
                      }`}
                    />
                    <span
                      className={`text-sm font-bold ${
                        task.completed ? 'text-muted-foreground' : 'text-[#FFB347]'
                      }`}
                    >
                      +{task.beanReward}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {allTasksDone && (
            <div className="mt-5 p-4 bg-gradient-to-r from-[#FFF5E6] to-[#FFE8CC] rounded-2xl text-center">
              <div className="text-3xl mb-2">🌟</div>
              <div className="font-bold text-foreground">太棒啦！今天的任务都完成了</div>
              <div className="text-sm text-muted-foreground mt-1">
                明天也要继续加油哦~
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
