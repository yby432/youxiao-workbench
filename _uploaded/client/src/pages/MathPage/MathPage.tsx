import { useState, useEffect, useCallback } from 'react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import {
  Calculator,
  Plus,
  Hash,
  ArrowUpDown,
  Clock,
  Shapes,
  Wand2,
  BookOpen,
  Target,
  Timer,
} from 'lucide-react';
import type {
  MathCategory,
  MathCategoryProgress,
  MathStats,
} from '@shared/api.interface';
import { getMathCategories, getMathStats } from '@client/src/api/math';
import MathPractice from './MathPractice';

const CATEGORY_META: Record<
  MathCategory,
  { name: string; icon: typeof Calculator; color: string }
> = {
  addition_subtraction_10: {
    name: '10以内加减',
    icon: Plus,
    color: 'bg-blue-100 text-blue-600',
  },
  addition_subtraction_20: {
    name: '20以内加减',
    icon: Calculator,
    color: 'bg-sky-100 text-sky-600',
  },
  number_sense: {
    name: '数感认知',
    icon: Hash,
    color: 'bg-indigo-100 text-indigo-600',
  },
  comparison: {
    name: '比大小',
    icon: ArrowUpDown,
    color: 'bg-cyan-100 text-cyan-600',
  },
  clock: {
    name: '钟表认识',
    icon: Clock,
    color: 'bg-teal-100 text-teal-600',
  },
  shape: {
    name: '图形认知',
    icon: Shapes,
    color: 'bg-violet-100 text-violet-600',
  },
  pattern: {
    name: '找规律',
    icon: Wand2,
    color: 'bg-purple-100 text-purple-600',
  },
};

const MathPage = () => {
  const [categories, setCategories] = useState<MathCategoryProgress[]>([]);
  const [stats, setStats] = useState<MathStats | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<MathCategory | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [catsData, statsData] = await Promise.all([
        getMathCategories(),
        getMathStats(),
      ]);
      setCategories(catsData.categories);
      setStats(statsData);
    } catch (error) {
      logger.error('加载数学数据失败', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    if (m === 0) return `${s}秒`;
    return `${m}分${s}秒`;
  };

  const handleStartPractice = (category: MathCategory) => {
    setSelectedCategory(category);
  };

  const handleBackFromPractice = () => {
    setSelectedCategory(null);
    loadData();
  };

  const handlePracticeComplete = () => {
    // 练习完成后刷新数据
    loadData();
  };

  if (selectedCategory) {
    return (
      <div className="px-4 pt-4 pb-8 safe-bottom">
        <MathPractice
          category={selectedCategory}
          categoryName={CATEGORY_META[selectedCategory].name}
          onBack={handleBackFromPractice}
          onComplete={handlePracticeComplete}
        />
      </div>
    );
  }

  return (
    <div className="px-4 pt-4 pb-8 safe-bottom">
      {/* 页面标题 */}
      <div className="mb-6">
        <h1 className="text-2xl font-heading text-foreground flex items-center gap-2">
          <Calculator className="w-7 h-7 text-module-math-foreground" />
          数学乐园
        </h1>
        <p className="text-sm text-muted-foreground mt-1">动动脑筋，一起学数学吧！</p>
      </div>

      {/* 统计卡片 */}
      <div className="bg-gradient-to-br from-module-math/50 to-module-math/20 rounded-2xl p-5 mb-6 border border-module-math/30">
        <div className="flex items-center gap-2 mb-3">
          <BookOpen className="w-5 h-5 text-module-math-foreground" />
          <span className="font-heading text-lg text-module-math-foreground">学习统计</span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/70 rounded-xl p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Target className="w-4 h-4 text-success" />
            </div>
            <div className="text-2xl font-bold text-foreground font-mono">
              {loading ? '--' : stats?.totalPractice ?? 0}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">总练习</div>
          </div>
          <div className="bg-white/70 rounded-xl p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <span className="text-success text-sm">✓</span>
            </div>
            <div className="text-2xl font-bold text-foreground font-mono">
              {loading
                ? '--'
                : stats
                  ? `${(stats.overallAccuracy * 100).toFixed(0)}%`
                  : '0%'}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">正确率</div>
          </div>
          <div className="bg-white/70 rounded-xl p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Timer className="w-4 h-4 text-accent-foreground" />
            </div>
            <div className="text-lg font-bold text-foreground font-mono leading-tight pt-1">
              {loading ? '--' : formatTime(stats?.todayPracticeTime ?? 0)}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">今日时长</div>
          </div>
        </div>
      </div>

      {/* 知识点选择 */}
      <div className="mb-4">
        <h2 className="text-lg font-heading text-foreground mb-3">选择练习</h2>
      </div>

      <div className="grid grid-cols-2 gap-3" data-ai-section-type="card-menu">
        {loading
          ? // 加载占位
            Array.from({ length: 6 }).map((_, i: number) => (
              <div
                key={i}
                className="bg-card rounded-2xl p-4 shadow-sm border border-border h-32 animate-pulse"
              />
            ))
          : categories.map((cat: MathCategoryProgress) => {
              const meta = CATEGORY_META[cat.key];
              const IconComp = meta.icon;
              const accuracyPercent = Math.round(cat.accuracy * 100);
              return (
                <button
                  key={cat.key}
                  onClick={() => handleStartPractice(cat.key)}
                  className="bg-card rounded-2xl p-4 shadow-sm border border-border text-left hover:shadow-md hover:scale-[1.02] transition-all active:scale-95"
                >
                  <div
                    className={`w-12 h-12 rounded-xl ${meta.color} flex items-center justify-center mb-3`}
                  >
                    <IconComp className="w-6 h-6" />
                  </div>
                  <div className="font-heading text-base text-foreground mb-2">
                    {meta.name}
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-1">
                    <div
                      className="h-full bg-module-math rounded-full transition-all"
                      style={{ width: `${accuracyPercent}%` }}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {cat.totalCount > 0
                      ? `正确率 ${accuracyPercent}%`
                      : '还没练习过哦'}
                  </div>
                </button>
              );
            })}
      </div>

      {/* 底部提示 */}
      <div className="mt-8 text-center">
        <p className="text-xs text-muted-foreground">
          每天坚持练习，数学小达人就是你！
        </p>
      </div>
    </div>
  );
};

export default MathPage;
