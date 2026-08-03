import { useState, useEffect, useCallback } from 'react';
import { BookOpen, Star, Sparkles, RefreshCw } from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import {
  getPoetryList,
  type PoetryListResponse,
  type PoemListItem,
  type ReciteResponse,
} from '@client/src/api/poetry';
import PoemDetail from './PoemDetail';

const PoetryPage = () => {
  const [data, setData] = useState<PoetryListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPoemId, setSelectedPoemId] = useState<string | null>(null);

  const loadList = useCallback(async () => {
    try {
      setLoading(true);
      const result = await getPoetryList();
      setData(result);
    } catch (error) {
      logger.error('加载古诗列表失败', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadList();
  }, [loadList]);

  const handleRecited = useCallback(
    (result: ReciteResponse) => {
      setData((prev: PoetryListResponse | null) => {
        if (!prev || !selectedPoemId) return prev;
        const updatedPoems = prev.poems.map((p: PoemListItem) =>
          p.id === selectedPoemId
            ? { ...p, isRecited: result.isRecited, recitedCount: result.recitedCount }
            : p,
        );
        const newRecitedCount = updatedPoems.filter(
          (p: PoemListItem) => p.isRecited,
        ).length;
        return { ...prev, poems: updatedPoems, recitedCount: newRecitedCount };
      });
    },
    [selectedPoemId],
  );

  // 详情页
  if (selectedPoemId) {
    return (
      <PoemDetail
        poemId={selectedPoemId}
        onBack={() => setSelectedPoemId(null)}
        onRecited={handleRecited}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* 顶部标题区 */}
      <div className="bg-gradient-to-b from-module-poetry/40 to-background px-5 pt-8 pb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-module-poetry flex items-center justify-center shadow-sm">
            <BookOpen className="w-6 h-6 text-module-poetry-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-heading text-foreground">古诗乐园</h1>
            <p className="text-sm text-muted-foreground">精选20首必背古诗</p>
          </div>
        </div>

        {/* 进度统计卡 */}
        <div className="bg-card rounded-2xl p-4 shadow-sm flex items-center justify-around">
          <div className="text-center">
            <div className="text-3xl font-heading text-primary">
              {data?.total ?? 0}
            </div>
            <div className="text-xs text-muted-foreground mt-1">总首数</div>
          </div>
          <div className="w-px h-10 bg-border" />
          <div className="text-center">
            <div className="text-3xl font-heading text-success">
              {data?.recitedCount ?? 0}
            </div>
            <div className="text-xs text-muted-foreground mt-1">已背诵</div>
          </div>
          <div className="w-px h-10 bg-border" />
          <div className="text-center">
            <div className="text-3xl font-heading text-module-poetry-foreground">
              {data && data.total > 0
                ? Math.round((data.recitedCount / data.total) * 100)
                : 0}
              <span className="text-lg">%</span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">完成度</div>
          </div>
        </div>
      </div>

      {/* 古诗列表 */}
      <div className="px-5 pb-8 safe-bottom">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading text-foreground text-lg">古诗列表</h2>
          <button
            onClick={loadList}
            className="p-2 -mr-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {loading && !data ? (
          <div className="flex items-center justify-center h-48">
            <div className="text-muted-foreground">加载中...</div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {data?.poems.map((poem: PoemListItem) => (
              <PoemCard
                key={poem.id}
                poem={poem}
                onClick={() => setSelectedPoemId(poem.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

interface PoemCardProps {
  poem: PoemListItem;
  onClick: () => void;
}

const PoemCard = ({ poem, onClick }: PoemCardProps) => {
  return (
    <button
      onClick={onClick}
      className="relative bg-card rounded-2xl p-4 shadow-sm text-left active:scale-[0.97] transition-transform hover:shadow-md"
    >
      {/* 已背诵印章 */}
      {poem.isRecited && (
        <div className="absolute -top-1 -right-1 z-10">
          <div className="w-12 h-12 rounded-full border-2 border-destructive/80 bg-card/95 flex items-center justify-center rotate-12 shadow-sm">
            <span className="text-[10px] font-heading text-destructive leading-tight text-center">
              已背
            </span>
          </div>
        </div>
      )}

      {/* 难度星星 */}
      <div className="flex items-center gap-0.5 mb-3">
        {Array.from({ length: 3 }).map((_, i: number) => (
          <Star
            key={i}
            className={`w-3.5 h-3.5 ${
              i < poem.difficulty
                ? 'text-warning fill-warning'
                : 'text-muted-foreground/30'
            }`}
          />
        ))}
      </div>

      {/* 标题 */}
      <h3 className="font-heading text-foreground text-lg mb-1 truncate">
        {poem.title}
      </h3>

      {/* 作者 */}
      <p className="text-xs text-muted-foreground mb-3">{poem.author}</p>

      {/* 底部装饰 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Sparkles className="w-3 h-3 text-module-poetry-foreground/60" />
          <span>第{poem.difficulty}级</span>
        </div>
        {poem.recitedCount > 0 && (
          <span className="text-xs text-success font-heading">
            ×{poem.recitedCount}
          </span>
        )}
      </div>
    </button>
  );
};

export default PoetryPage;
