import { useState, useEffect, useCallback } from 'react';
import {
  BookOpen,
  Check,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Target,
} from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import type {
  LiteracyStats,
  LiteracyUnitGroup,
  ChineseCharacter,
  CharacterStatus,
} from '@shared/api.interface';
import { getCharacters, getStats, getWeakWords } from '@client/src/api/literacy';
import CharacterDetail from './CharacterDetail';

type CharacterWithStatus = ChineseCharacter & { status: CharacterStatus; isWeak: boolean };

const LiteracyPage = () => {
  const [stats, setStats] = useState<LiteracyStats | null>(null);
  const [unitGroups, setUnitGroups] = useState<LiteracyUnitGroup[]>([]);
  const [weakWords, setWeakWords] = useState<ChineseCharacter[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedUnits, setExpandedUnits] = useState<Set<number>>(new Set([1]));
  const [expandedLessons, setExpandedLessons] = useState<Set<string>>(new Set());
  const [selectedChar, setSelectedChar] = useState<CharacterWithStatus | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [showWeakPanel, setShowWeakPanel] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsData, charsData, weakData] = await Promise.all([
        getStats(),
        getCharacters(),
        getWeakWords(),
      ]);
      setStats(statsData);
      setUnitGroups(charsData);
      setWeakWords(weakData.items);

      // 默认展开第一单元第一课
      if (charsData.length > 0) {
        const firstUnit = charsData[0].unit;
        setExpandedUnits(new Set([firstUnit]));
        if (charsData[0].lessons.length > 0) {
          setExpandedLessons(new Set([`${firstUnit}-${charsData[0].lessons[0].lesson}`]));
        }
      }
    } catch (err) {
      logger.error('加载识字数据失败', err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const toggleUnit = (unit: number) => {
    setExpandedUnits((prev) => {
      const next = new Set(prev);
      if (next.has(unit)) {
        next.delete(unit);
      } else {
        next.add(unit);
      }
      return next;
    });
  };

  const toggleLesson = (unit: number, lesson: number) => {
    const key = `${unit}-${lesson}`;
    setExpandedLessons((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const handleCharClick = (char: CharacterWithStatus) => {
    setSelectedChar(char);
    setDetailOpen(true);
  };

  const handleStatusChange = (
    characterId: string,
    status: CharacterStatus,
    isWeak: boolean
  ) => {
    // 更新本地字表状态
    setUnitGroups((prev) =>
      prev.map((unitGroup) => ({
        ...unitGroup,
        lessons: unitGroup.lessons.map((lessonGroup) => ({
          ...lessonGroup,
          characters: lessonGroup.characters.map((c) =>
            c.id === characterId ? { ...c, status, isWeak } : c
          ),
        })),
      }))
    );

    // 更新选中的字
    setSelectedChar((prev) =>
      prev && prev.id === characterId ? { ...prev, status, isWeak } : prev
    );

    // 更新统计
    setStats((prev) => {
      if (!prev) return prev;
      let { learned, mastered, weakCount } = prev;
      // 简化处理：重新加载统计更准确，但为了即时反馈做近似更新
      // 实际以刷新为准
      return { ...prev, learned, mastered, weakCount };
    });

    // 更新薄弱字列表
    if (isWeak) {
      setWeakWords((prev) => {
        if (prev.some((w) => w.id === characterId)) return prev;
        const char = findCharById(characterId);
        return char ? [...prev, char] : prev;
      });
    } else {
      setWeakWords((prev) => prev.filter((w) => w.id !== characterId));
    }
  };

  const findCharById = (id: string): ChineseCharacter | null => {
    for (const unit of unitGroups) {
      for (const lesson of unit.lessons) {
        const found = lesson.characters.find((c) => c.id === id);
        if (found) return found;
      }
    }
    return null;
  };

  const getStatusClass = (status: CharacterStatus): string => {
    switch (status) {
      case 'mastered':
        return 'bg-status-mastered text-status-mastered-foreground';
      case 'learning':
        return 'bg-status-learning text-status-learning-foreground';
      default:
        return 'bg-status-unlearned text-status-unlearned-foreground';
    }
  };

  const getLessonProgress = (characters: CharacterWithStatus[]) => {
    const total = characters.length;
    const mastered = characters.filter((c) => c.status === 'mastered').length;
    const learned = characters.filter(
      (c) => c.status !== 'unlearned'
    ).length;
    return { total, mastered, learned };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground text-lg">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* 顶部标题区 */}
      <div className="bg-module-literacy/40 pt-8 pb-6 px-5 rounded-b-[2rem]">
        <div className="max-w-lg mx-auto">
          <h1 className="text-3xl text-heading text-foreground mb-1">
            识字乐园
          </h1>
          <p className="text-sm text-muted-foreground">
            人教版一年级上册 · 一起学汉字吧！
          </p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 -mt-4">
        {/* 识字量看板 */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-card rounded-2xl p-4 shadow-sm">
            <div className="text-xs text-muted-foreground mb-1">总生字数</div>
            <div className="text-3xl font-bold text-foreground font-mono">
              {stats?.total ?? 0}
            </div>
            <div className="text-xs text-muted-foreground mt-1">个汉字</div>
          </div>
          <div className="bg-card rounded-2xl p-4 shadow-sm">
            <div className="text-xs text-muted-foreground mb-1">已学字数</div>
            <div className="text-3xl font-bold text-status-learning-foreground font-mono">
              {stats?.learned ?? 0}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {stats ? Math.round((stats.learned / stats.total) * 100) : 0}%
            </div>
          </div>
          <div className="bg-card rounded-2xl p-4 shadow-sm">
            <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
              <Check className="w-3 h-3 text-status-mastered" />
              已掌握
            </div>
            <div className="text-3xl font-bold text-status-mastered-foreground font-mono">
              {stats?.mastered ?? 0}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {stats && stats.total > 0
                ? Math.round((stats.mastered / stats.total) * 100)
                : 0}
              % 掌握率
            </div>
          </div>
          <div className="bg-card rounded-2xl p-4 shadow-sm">
            <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 text-status-weak" />
              薄弱字
            </div>
            <div className="text-3xl font-bold text-status-weak font-mono">
              {stats?.weakCount ?? 0}
            </div>
            <div className="text-xs text-muted-foreground mt-1">需要加强</div>
          </div>
        </div>

        {/* 单元掌握率概览 */}
        {stats && stats.unitMasteryRate.length > 0 && (
          <div className="bg-card rounded-2xl p-4 shadow-sm mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-4 h-4 text-module-literacy-foreground" />
              <span className="font-medium text-foreground">单元掌握进度</span>
            </div>
            <div className="space-y-2">
              {stats.unitMasteryRate.map((item) => (
                <div key={item.unit} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-14 shrink-0">
                    第{item.unit}单元
                  </span>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-status-mastered rounded-full transition-all duration-500"
                      style={{ width: `${Math.round(item.rate * 100)}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground w-10 text-right shrink-0">
                    {Math.round(item.rate * 100)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 字表浏览区 */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <BookOpen className="w-5 h-5 text-module-literacy-foreground" />
            <h2 className="text-lg font-medium text-foreground text-heading">
              生字表
            </h2>
          </div>

          {unitGroups.map((unitGroup) => {
            const unitExpanded = expandedUnits.has(unitGroup.unit);
            const unitChars = unitGroup.lessons.flatMap(
              (l) => l.characters
            );
            const { mastered, total } = getLessonProgress(unitChars);

            return (
              <div
                key={unitGroup.unit}
                className="bg-card rounded-2xl shadow-sm overflow-hidden"
              >
                <button
                  onClick={() => toggleUnit(unitGroup.unit)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-module-literacy/50 flex items-center justify-center">
                      <span className="text-sm font-bold text-module-literacy-foreground">
                        {unitGroup.unit}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium text-foreground">
                        第 {unitGroup.unit} 单元
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {mastered}/{total} 已掌握
                      </div>
                    </div>
                  </div>
                  {unitExpanded ? (
                    <ChevronUp className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  )}
                </button>

                {unitExpanded && (
                  <div className="px-4 pb-4 space-y-3">
                    {unitGroup.lessons.map((lessonGroup) => {
                      const lessonKey = `${unitGroup.unit}-${lessonGroup.lesson}`;
                      const lessonExpanded =
                        expandedLessons.has(lessonKey);
                      const {
                        mastered: lMastered,
                        total: lTotal,
                      } = getLessonProgress(lessonGroup.characters);

                      return (
                        <div
                          key={lessonGroup.lesson}
                          className="bg-muted/30 rounded-xl overflow-hidden"
                        >
                          <button
                            onClick={() =>
                              toggleLesson(unitGroup.unit, lessonGroup.lesson)
                            }
                            className="w-full flex items-center justify-between p-3 text-left hover:bg-muted/50 transition-colors"
                          >
                            <span className="text-sm font-medium text-foreground">
                              第 {lessonGroup.lesson} 课
                              <span className="text-xs text-muted-foreground ml-2 font-normal">
                                {lMastered}/{lTotal}
                              </span>
                            </span>
                            {lessonExpanded ? (
                              <ChevronUp className="w-4 h-4 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-muted-foreground" />
                            )}
                          </button>

                          {lessonExpanded && (
                            <div className="px-3 pb-3">
                              <div className="grid grid-cols-5 gap-2">
                                {lessonGroup.characters.map((char) => (
                                  <button
                                    key={char.id}
                                    onClick={() => handleCharClick(char)}
                                    className={`aspect-square rounded-xl flex flex-col items-center justify-center ${getStatusClass(
                                      char.status
                                    )} transition-transform active:scale-95 relative shadow-sm`}
                                  >
                                    <span className="text-xl font-medium text-heading leading-none">
                                      {char.character}
                                    </span>
                                    <span className="text-[10px] mt-1 opacity-80 truncate w-full text-center px-1">
                                      {char.pinyin}
                                    </span>
                                    {char.status === 'mastered' && (
                                      <Check className="absolute top-0.5 right-0.5 w-3 h-3" />
                                    )}
                                    {char.isWeak && (
                                      <AlertTriangle className="absolute top-0.5 left-0.5 w-3 h-3 text-status-weak" />
                                    )}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 底部浮动薄弱字本入口 */}
      <div className="fixed bottom-20 left-0 right-0 px-4 z-40 pointer-events-none">
        <div className="max-w-lg mx-auto pointer-events-auto">
          <button
            onClick={() => setShowWeakPanel(true)}
            className="w-full bg-status-weak text-white rounded-2xl p-4 shadow-lg flex items-center justify-between hover:shadow-xl transition-shadow active:scale-[0.98]"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="font-medium">薄弱字本</div>
                <div className="text-xs opacity-90">
                  {weakWords.length} 个字需要加强
                </div>
              </div>
            </div>
            <Sparkles className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 薄弱字本面板 */}
      {showWeakPanel && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-end"
          onClick={() => setShowWeakPanel(false)}
        >
          <div
            className="w-full bg-card rounded-t-3xl max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-card p-5 pb-3 border-b border-border">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-medium text-heading text-foreground flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-status-weak" />
                  薄弱字本
                </h3>
                <button
                  onClick={() => setShowWeakPanel(false)}
                  className="text-muted-foreground text-sm"
                >
                  关闭
                </button>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                共 {weakWords.length} 个薄弱字，多复习几次就能掌握啦！
              </p>
            </div>

            <div className="p-5">
              {weakWords.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Sparkles className="w-12 h-12 mx-auto mb-3 text-status-mastered opacity-50" />
                  <p>太棒了！还没有薄弱字</p>
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-3">
                  {weakWords.map((char) => {
                    // 查找当前状态
                    let status: CharacterStatus = 'unlearned';
                    let isWeak = true;
                    for (const unit of unitGroups) {
                      for (const lesson of unit.lessons) {
                        const found = lesson.characters.find(
                          (c) => c.id === char.id
                        );
                        if (found) {
                          status = found.status;
                          isWeak = found.isWeak;
                          break;
                        }
                      }
                    }
                    return (
                      <button
                        key={char.id}
                        onClick={() => {
                          setSelectedChar({ ...char, status, isWeak });
                          setDetailOpen(true);
                          setShowWeakPanel(false);
                        }}
                        className={`aspect-square rounded-xl flex flex-col items-center justify-center ${getStatusClass(
                          status
                        )} transition-transform active:scale-95 shadow-sm`}
                      >
                        <span className="text-xl font-medium text-heading">
                          {char.character}
                        </span>
                        <span className="text-[10px] mt-1 opacity-80">
                          {char.pinyin}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 汉字详情弹窗 */}
      <CharacterDetail
        character={selectedChar}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
};

export default LiteracyPage;
