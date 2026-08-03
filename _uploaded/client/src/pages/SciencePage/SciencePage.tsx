import { useState, useEffect, useMemo } from 'react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import {
  BookOpen,
  CheckCircle2,
  Star,
  Sparkles,
  Globe,
  Leaf,
  Home,
  CloudSun,
  ShieldAlert,
} from 'lucide-react';
import ArticleDetail from './ArticleDetail';
import { getScienceArticles } from '@client/src/api/science';
import type { ArticleListItem, CategoryGroup } from '@client/src/api/science';

const CATEGORIES: Array<{
  key: string;
  name: string;
  icon: typeof Globe;
  color: string;
  bgColor: string;
}> = [
  {
    key: 'all',
    name: '全部',
    icon: Sparkles,
    color: 'text-[hsl(28_90%_55%)]',
    bgColor: 'bg-[hsl(28_60%_92%)]',
  },
  {
    key: 'astronomy',
    name: '天文',
    icon: Globe,
    color: 'text-[hsl(210_50%_55%)]',
    bgColor: 'bg-[hsl(210_45%_90%)]',
  },
  {
    key: 'animals_plants',
    name: '动植物',
    icon: Leaf,
    color: 'text-[hsl(145_50%_45%)]',
    bgColor: 'bg-[hsl(145_45%_88%)]',
  },
  {
    key: 'life',
    name: '生活常识',
    icon: Home,
    color: 'text-[hsl(28_80%_55%)]',
    bgColor: 'bg-[hsl(28_60%_90%)]',
  },
  {
    key: 'nature',
    name: '自然现象',
    icon: CloudSun,
    color: 'text-[hsl(200_60%_50%)]',
    bgColor: 'bg-[hsl(200_45%_90%)]',
  },
  {
    key: 'safety',
    name: '安全常识',
    icon: ShieldAlert,
    color: 'text-[hsl(0_60%_55%)]',
    bgColor: 'bg-[hsl(0_50%_92%)]',
  },
];

const SciencePage = () => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [allGroups, setAllGroups] = useState<CategoryGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const data = await getScienceArticles();
        if (!cancelled) setAllGroups(data);
      } catch (e) {
        logger.error('加载科普文章失败', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const displayArticles = useMemo(() => {
    if (activeCategory === 'all') {
      return allGroups.flatMap((g) => g.articles);
    }
    const group = allGroups.find((g) => g.category === activeCategory);
    return group?.articles ?? [];
  }, [allGroups, activeCategory]);

  const totalRead = useMemo(() => {
    return allGroups.reduce(
      (sum: number, g: CategoryGroup) =>
        sum + g.articles.filter((a: ArticleListItem) => a.isRead).length,
      0,
    );
  }, [allGroups]);

  const totalCount = useMemo(() => {
    return allGroups.reduce(
      (sum: number, g: CategoryGroup) => sum + g.articles.length,
      0,
    );
  }, [allGroups]);

  if (selectedArticleId) {
    return (
      <div className="min-h-screen bg-background px-4 pt-4 pb-24 max-w-lg mx-auto">
        <ArticleDetail
          articleId={selectedArticleId}
          onBack={() => setSelectedArticleId(null)}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 pt-4 pb-24 max-w-lg mx-auto">
      <div className="mb-5">
        <h1
          className="text-2xl font-bold text-foreground mb-1"
          style={{ fontFamily: '"ZCOOL KuaiLe", "PingFang SC", sans-serif' }}
        >
          科普小百科 🌟
        </h1>
        <p className="text-sm text-muted-foreground">
          探索世界，发现奥秘
        </p>
      </div>

      <div className="bg-gradient-to-r from-[hsl(50_45%_88%)] to-[hsl(145_45%_88%)] rounded-2xl p-4 mb-5 flex items-center gap-4 shadow-sm">
        <div className="w-14 h-14 rounded-full bg-white/70 flex items-center justify-center">
          <BookOpen size={28} className="text-[hsl(28_90%_62%)]" />
        </div>
        <div className="flex-1">
          <p className="text-sm text-muted-foreground">已读文章</p>
          <p className="text-xl font-bold text-foreground">
            {totalRead} <span className="text-sm font-normal text-muted-foreground">/ {totalCount} 篇</span>
          </p>
        </div>
        <div className="flex gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              size={18}
              fill={i < Math.min(5, Math.floor(totalRead / 3)) ? 'hsl(48 80% 60%)' : 'none'}
              stroke={i < Math.min(5, Math.floor(totalRead / 3)) ? 'hsl(48 80% 60%)' : 'hsl(220 10% 75%)'}
            />
          ))}
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-3 mb-4 -mx-4 px-4 scrollbar-hide">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.key;
          return (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-medium transition-all ${
                isActive
                  ? `${cat.bgColor} ${cat.color} shadow-sm scale-105`
                  : 'bg-white text-muted-foreground border border-border'
              }`}
            >
              <Icon size={16} />
              {cat.name}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          加载中...
        </div>
      ) : displayArticles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <BookOpen size={48} className="mb-3 opacity-30" />
          <p>暂无文章</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {displayArticles.map((article: ArticleListItem, idx: number) => {
            const catInfo =
              CATEGORIES.find(
                (c) =>
                  allGroups.find((g) =>
                    g.articles.some((a) => a.id === article.id),
                  )?.category === c.key,
              ) ?? CATEGORIES[0];
            const Icon = catInfo.icon;
            const cardBg =
              idx % 3 === 0
                ? 'from-[hsl(145_45%_90%)] to-[hsl(145_35%_95%)]'
                : idx % 3 === 1
                  ? 'from-[hsl(50_45%_88%)] to-[hsl(50_35%_95%)]'
                  : 'from-[hsl(28_50%_90%)] to-[hsl(28_40%_96%)]';

            return (
              <button
                key={article.id}
                onClick={() => setSelectedArticleId(article.id)}
                className={`bg-gradient-to-br ${cardBg} rounded-2xl p-4 text-left shadow-sm hover:shadow-md transition-all active:scale-[0.97] relative`}
              >
                {article.isRead && (
                  <div className="absolute top-2 right-2">
                    <CheckCircle2
                      size={20}
                      className="text-[hsl(145_50%_55%)]"
                      fill="white"
                    />
                  </div>
                )}
                <div
                  className={`w-12 h-12 rounded-xl ${catInfo.bgColor} flex items-center justify-center mb-3`}
                >
                  <Icon size={24} className={catInfo.color} />
                </div>
                <h3 className="font-bold text-foreground text-sm leading-snug line-clamp-2 mb-1">
                  {article.title}
                </h3>
                <p className="text-xs text-muted-foreground line-clamp-1">
                  {article.imageHint}
                </p>
                {article.quizCorrect && (
                  <div className="mt-2 flex items-center gap-1">
                    <Star size={12} fill="hsl(48 80% 60%)" stroke="hsl(48 80% 60%)" />
                    <span className="text-xs text-[hsl(48_70%_45%)]">已通关</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SciencePage;
