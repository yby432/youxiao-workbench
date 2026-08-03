import { useState, useEffect } from 'react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { Volume2, PenLine, Link2, Music2, TrendingUp } from 'lucide-react';
import type { PinyinCategory, PinyinItem, PinyinProgress } from '@shared/api.interface';
import { getPinyinItems, getPinyinProgress } from '@client/src/api/pinyin';
import PracticeMode from './PracticeMode';

const categoryTabs: { key: PinyinCategory; label: string }[] = [
  { key: 'initial', label: '声母' },
  { key: 'final', label: '韵母' },
  { key: 'whole', label: '整体认读' },
  { key: 'tone', label: '声调' },
  { key: 'spelling', label: '拼读练习' },
];

const practiceModes = [
  { type: 'write' as const, label: '看图写拼音', icon: PenLine, color: 'bg-pink-200 text-pink-700' },
  { type: 'match' as const, label: '拼音连线', icon: Link2, color: 'bg-blue-200 text-blue-700' },
  { type: 'tone' as const, label: '声调闯关', icon: Music2, color: 'bg-green-200 text-green-700' },
];

const PinyinPage = () => {
  const [activeCategory, setActiveCategory] = useState<PinyinCategory>('initial');
  const [items, setItems] = useState<PinyinItem[]>([]);
  const [progress, setProgress] = useState<PinyinProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [practiceMode, setPracticeMode] = useState<'write' | 'match' | 'tone' | null>(null);
  const [rippleId, setRippleId] = useState<string | null>(null);

  const loadItems = async (category: PinyinCategory) => {
    try {
      setLoading(true);
      const data = await getPinyinItems(category);
      setItems(data.items);
    } catch (error) {
      logger.error('加载拼音列表失败', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProgress = async () => {
    try {
      const data = await getPinyinProgress();
      setProgress(data.categories);
    } catch (error) {
      logger.error('加载学习进度失败', error);
    }
  };

  useEffect(() => {
    loadItems(activeCategory);
  }, [activeCategory]);

  useEffect(() => {
    loadProgress();
  }, []);

  const handleCardClick = (itemId: string) => {
    setRippleId(itemId);
    setTimeout(() => setRippleId(null), 600);
  };

  const handlePracticeComplete = () => {
    loadProgress();
  };

  const currentProgress = progress.find((p) => p.category === activeCategory);

  if (practiceMode) {
    return (
      <div className="min-h-screen bg-background">
        <PracticeMode
          type={practiceMode}
          category={activeCategory}
          onBack={() => setPracticeMode(null)}
          onComplete={handlePracticeComplete}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* 顶部标题区 */}
      <div className="bg-module-pinyin px-5 pt-8 pb-6 rounded-b-[2rem]">
        <h1 className="text-2xl font-bold text-module-pinyin-foreground mb-1 text-heading">
          拼音乐园
        </h1>
        <p className="text-sm text-module-pinyin-foreground/70">
          和拼音宝宝做朋友吧！
        </p>

        {/* 总进度 */}
        <div className="mt-4 bg-white/40 backdrop-blur rounded-2xl p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-module-pinyin-foreground flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              学习进度
            </span>
            <span className="text-sm font-bold text-module-pinyin-foreground">
              {currentProgress ? Math.round(currentProgress.accuracy * 100) : 0}%
            </span>
          </div>
          <div className="h-2 bg-white/50 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-500"
              style={{ width: `${currentProgress ? currentProgress.accuracy * 100 : 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* 分类标签 */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {categoryTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveCategory(tab.key)}
              className={`flex-shrink-0 px-4 py-2 rounded-full font-medium text-sm transition-all active:scale-95 ${
                activeCategory === tab.key
                  ? 'bg-module-pinyin text-module-pinyin-foreground shadow-sm'
                  : 'bg-secondary text-secondary-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 拼音卡片网格 */}
      <div className="px-4 py-3">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="text-muted-foreground">加载中...</div>
          </div>
        ) : items.length === 0 ? (
          <div className="flex items-center justify-center h-40">
            <div className="text-muted-foreground">暂无内容</div>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {items.map((item: PinyinItem) => (
              <button
                key={item.id}
                onClick={() => handleCardClick(item.id)}
                className="relative aspect-square rounded-2xl bg-card shadow-sm flex flex-col items-center justify-center p-2 active:scale-95 transition-transform overflow-hidden"
              >
                {rippleId === item.id && (
                  <span className="absolute inset-0 bg-module-pinyin/40 animate-ping rounded-2xl" />
                )}
                <span className="text-3xl font-bold text-module-pinyin-foreground text-heading z-10">
                  {item.content}
                </span>
                <span className="text-xs text-muted-foreground mt-1 z-10 truncate max-w-full px-1">
                  {item.example}
                </span>
                <Volume2 className="absolute bottom-1 right-1 w-3.5 h-3.5 text-module-pinyin-foreground/40 z-10" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 各分类进度 */}
      <div className="px-4 py-3">
        <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-1">
          <TrendingUp className="w-4 h-4 text-module-pinyin" />
          各分类进度
        </h3>
        <div className="bg-card rounded-2xl p-4 shadow-sm space-y-3">
          {progress.map((p: PinyinProgress) => {
            const tab = categoryTabs.find((t) => t.key === p.category);
            return (
              <div key={p.category} className="flex items-center gap-3">
                <span className="text-sm text-foreground w-16 flex-shrink-0">
                  {tab?.label ?? p.category}
                </span>
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-module-pinyin rounded-full transition-all duration-500"
                    style={{ width: `${p.accuracy * 100}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground w-12 text-right flex-shrink-0">
                  {Math.round(p.accuracy * 100)}%
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 练习模式入口 */}
      <div className="px-4 py-3">
        <h3 className="text-sm font-bold text-foreground mb-3">练习模式</h3>
        <div className="grid grid-cols-3 gap-3">
          {practiceModes.map((mode) => {
            const Icon = mode.icon;
            return (
              <button
                key={mode.type}
                onClick={() => setPracticeMode(mode.type)}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-card shadow-sm active:scale-95 transition-transform"
              >
                <div className={`w-12 h-12 rounded-2xl ${mode.color} flex items-center justify-center`}>
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-xs font-medium text-foreground text-center">
                  {mode.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PinyinPage;
