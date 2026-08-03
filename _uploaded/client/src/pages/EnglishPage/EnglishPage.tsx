import { useState, useEffect, useCallback } from 'react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import {
  BookOpen,
  Type,
  MessageCircle,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';
import { Button } from '@client/src/components/ui/button';
import { Progress } from '@client/src/components/ui/progress';
import AlphabetDetail from './AlphabetDetail';
import WordLearning from './WordLearning';
import SentenceList from './SentenceList';
import {
  getEnglishItems,
  getEnglishProgress,
  submitEnglishPractice,
} from '@client/src/api/english';
import type {
  EnglishCategory,
  EnglishLevel,
  EnglishItem,
  EnglishProgress,
} from '@shared/api.interface';

type ViewMode = 'home' | 'alphabet' | 'word' | 'sentence';

const LEVEL_LABELS: Record<EnglishLevel, string> = {
  beginner: '入门',
  basic: '基础',
};

const CATEGORY_LABELS: Record<EnglishCategory, string> = {
  alphabet: '26字母',
  word: '高频单词',
  sentence: '情景短句',
};

const CATEGORY_DESCRIPTIONS: Record<EnglishCategory, string> = {
  alphabet: '认识26个英文字母，开启英语大门',
  word: '生活常用单词，看图记单词',
  sentence: '日常情景对话，开口说英语',
};

const CATEGORY_ICONS: Record<EnglishCategory, typeof Type> = {
  alphabet: Type,
  word: BookOpen,
  sentence: MessageCircle,
};

const CATEGORY_COLORS: Record<EnglishCategory, string> = {
  alphabet: 'from-[hsl(185_50%_85%)] to-[hsl(185_40%_75%)]',
  word: 'from-[hsl(160_50%_85%)] to-[hsl(160_40%_75%)]',
  sentence: 'from-[hsl(200_50%_85%)] to-[hsl(200_40%_75%)]',
};

const EnglishPage = () => {
  const [level, setLevel] = useState<EnglishLevel>('beginner');
  const [view, setView] = useState<ViewMode>('home');
  const [items, setItems] = useState<EnglishItem[]>([]);
  const [progress, setProgress] = useState<EnglishProgress[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedLetter, setSelectedLetter] = useState<EnglishItem | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [learnedIds, setLearnedIds] = useState<Set<string>>(new Set());
  const [wordSubcategory, setWordSubcategory] = useState<string>('');

  // 加载进度
  const loadProgress = useCallback(async (currentLevel: EnglishLevel) => {
    try {
      const data = await getEnglishProgress(currentLevel);
      setProgress(data.categories);
    } catch (error) {
      logger.error('加载英语进度失败', error);
    }
  }, []);

  // 加载内容
  const loadItems = useCallback(
    async (category: EnglishCategory, currentLevel: EnglishLevel) => {
      setLoading(true);
      try {
        const data = await getEnglishItems(category, currentLevel);
        setItems(data.items);
        // 设置单词子分类默认值
        if (category === 'word' && data.items.length > 0) {
          const subs = Array.from(
            new Set(data.items.map((item: EnglishItem) => item.subcategory)),
          );
          if (subs.length > 0) {
            setWordSubcategory((prev) =>
              subs.includes(prev) ? prev : subs[0],
            );
          }
        }
      } catch (error) {
        logger.error('加载英语内容失败', error);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // 初始化加载进度
  useEffect(() => {
    loadProgress(level);
  }, [level, loadProgress]);

  // 切换视图时加载对应内容
  useEffect(() => {
    if (view === 'home') return;
    loadItems(view as EnglishCategory, level);
  }, [view, level, loadItems]);

  // 切换难度时重置视图
  const handleLevelChange = (newLevel: EnglishLevel) => {
    setLevel(newLevel);
    setView('home');
    setLearnedIds(new Set());
  };

  // 进入板块
  const handleEnterCategory = (category: EnglishCategory) => {
    setView(category as ViewMode);
  };

  // 返回首页
  const handleBack = () => {
    setView('home');
    setDetailOpen(false);
    setSelectedLetter(null);
  };

  // 提交学习
  const handleLearned = async (itemId: string) => {
    if (learnedIds.has(itemId)) return;
    try {
      await submitEnglishPractice(itemId, level, true);
      setLearnedIds((prev) => new Set(prev).add(itemId));
      // 刷新进度
      loadProgress(level);
    } catch (error) {
      logger.error('提交学习进度失败', error);
    }
  };

  // 点击字母
  const handleLetterClick = (item: EnglishItem) => {
    setSelectedLetter(item);
    setDetailOpen(true);
  };

  // 获取进度
  const getCategoryProgress = (category: EnglishCategory): number => {
    const cat = progress.find((p: EnglishProgress) => p.category === category);
    if (!cat || cat.totalCount === 0) return 0;
    return Math.round((cat.learnedCount / cat.totalCount) * 100);
  };

  // 获取已学数量
  const getCategoryLearned = (category: EnglishCategory): [number, number] => {
    const cat = progress.find((p: EnglishProgress) => p.category === category);
    if (!cat) return [0, 0];
    return [cat.learnedCount, cat.totalCount];
  };

  // 单词子分类列表
  const wordSubcategories = Array.from(
    new Set(items.map((item: EnglishItem) => item.subcategory)),
  ).filter(Boolean);

  // 渲染首页
  const renderHome = () => (
    <div className="space-y-6">
      {/* 欢迎语 */}
      <div className="text-center py-2">
        <h1 className="text-3xl font-black text-[hsl(185_40%_25%)] flex items-center justify-center gap-2">
          <Sparkles className="w-7 h-7 text-[hsl(48_70%_60%)]" />
          英语乐园
          <Sparkles className="w-7 h-7 text-[hsl(48_70%_60%)]" />
        </h1>
        <p className="text-muted-foreground mt-2">
          快乐学英语，每天进步一点点！
        </p>
      </div>

      {/* 难度切换 */}
      <div className="bg-white rounded-2xl p-2 shadow-sm border border-[hsl(40_20%_90%)] flex gap-2">
        {(['beginner', 'basic'] as EnglishLevel[]).map((lv: EnglishLevel) => (
          <button
            key={lv}
            onClick={() => handleLevelChange(lv)}
            className={`flex-1 h-14 rounded-xl font-bold text-lg transition-all ${
              level === lv
                ? 'bg-gradient-to-r from-[hsl(185_50%_75%)] to-[hsl(185_40%_65%)] text-white shadow-md scale-[1.02]'
                : 'text-muted-foreground hover:bg-[hsl(185_30%_95%)]'
            }`}
          >
            {LEVEL_LABELS[lv]}
          </button>
        ))}
      </div>

      {/* 三大板块入口 */}
      <div className="space-y-4">
        {(['alphabet', 'word', 'sentence'] as EnglishCategory[]).map(
          (cat: EnglishCategory) => {
            const Icon = CATEGORY_ICONS[cat];
            const [learned, total] = getCategoryLearned(cat);
            const prog = getCategoryProgress(cat);

            return (
              <button
                key={cat}
                onClick={() => handleEnterCategory(cat)}
                className={`w-full bg-gradient-to-r ${CATEGORY_COLORS[cat]} rounded-3xl p-6 shadow-md text-left hover:shadow-lg active:scale-[0.98] transition-all border-2 border-white/50`}
              >
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-white/80 flex items-center justify-center shadow-sm flex-shrink-0">
                    <Icon className="w-9 h-9 text-[hsl(185_40%_30%)]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-black text-[hsl(185_40%_20%)]">
                      {CATEGORY_LABELS[cat]}
                    </h3>
                    <p className="text-sm text-[hsl(185_40%_35%)] mt-1">
                      {CATEGORY_DESCRIPTIONS[cat]}
                    </p>
                    <div className="mt-3">
                      <Progress
                        value={prog}
                        className="h-3 bg-white/60"
                      />
                      <div className="flex justify-between text-xs font-bold text-[hsl(185_40%_30%)] mt-1.5">
                        <span>已学 {learned} 个</span>
                        <span>共 {total} 个</span>
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            );
          },
        )}
      </div>
    </div>
  );

  // 渲染字母学习
  const renderAlphabet = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-6 gap-2.5">
        {items.map((item: EnglishItem) => {
          const isLearned = learnedIds.has(item.id);
          return (
            <button
              key={item.id}
              onClick={() => handleLetterClick(item)}
              className={`aspect-square rounded-2xl font-black text-2xl shadow-sm transition-all active:scale-95 flex items-center justify-center relative ${
                isLearned
                  ? 'bg-gradient-to-br from-[hsl(145_50%_85%)] to-[hsl(145_45%_75%)] text-[hsl(145_50%_25%)] border-2 border-[hsl(145_50%_70%)]'
                  : 'bg-gradient-to-br from-[hsl(185_40%_95%)] to-[hsl(185_40%_85%)] text-[hsl(185_40%_30%)] border-2 border-[hsl(185_30%_80%)] hover:from-[hsl(185_40%_90%)]'
              }`}
            >
              {item.content}
              {isLearned && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-[hsl(48_70%_60%)] rounded-full flex items-center justify-center text-xs text-white shadow-sm">
                  ✓
                </span>
              )}
            </button>
          );
        })}
      </div>

      <AlphabetDetail
        item={selectedLetter}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onLearned={handleLearned}
        learned={selectedLetter ? learnedIds.has(selectedLetter.id) : false}
      />
    </div>
  );

  // 渲染单词学习
  const renderWord = () => (
    <WordLearning
      items={items}
      subcategories={wordSubcategories}
      currentSubcategory={wordSubcategory}
      onSubcategoryChange={setWordSubcategory}
      onLearned={handleLearned}
      learnedIds={learnedIds}
    />
  );

  // 渲染短句学习
  const renderSentence = () => (
    <SentenceList items={items} onLearned={handleLearned} learnedIds={learnedIds} />
  );

  // 当前视图标题
  const viewTitle =
    view === 'home' ? '' : CATEGORY_LABELS[view as EnglishCategory];

  return (
    <div className="min-h-screen bg-[hsl(40_30%_98%)] pb-24">
      {/* 顶部导航 */}
      {view !== 'home' && (
        <div className="sticky top-0 z-10 bg-[hsl(40_30%_98%)]/95 backdrop-blur-sm border-b border-[hsl(40_20%_90%)] px-4 py-3 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            className="w-11 h-11 rounded-full hover:bg-[hsl(185_30%_90%)]"
          >
            <ArrowLeft className="w-6 h-6 text-[hsl(185_40%_30%)]" />
          </Button>
          <h2 className="text-xl font-black text-[hsl(185_40%_25%)]">
            {viewTitle}
          </h2>
          <span className="text-sm font-bold text-[hsl(185_40%_45%)] bg-[hsl(185_30%_90%)] px-3 py-1 rounded-full ml-auto">
            {LEVEL_LABELS[level]}
          </span>
        </div>
      )}

      {/* 内容区 */}
      <div className="px-4 py-5 max-w-lg mx-auto">
        {loading && view !== 'home' ? (
          <div className="text-center py-20 text-muted-foreground">
            加载中...
          </div>
        ) : (
          <>
            {view === 'home' && renderHome()}
            {view === 'alphabet' && renderAlphabet()}
            {view === 'word' && renderWord()}
            {view === 'sentence' && renderSentence()}
          </>
        )}
      </div>
    </div>
  );
};

export default EnglishPage;
