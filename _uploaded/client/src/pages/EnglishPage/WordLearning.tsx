import { useState } from 'react';
import { ChevronLeft, ChevronRight, Check, Volume2 } from 'lucide-react';
import { Button } from '@client/src/components/ui/button';
import type { EnglishItem } from '@shared/api.interface';

interface WordLearningProps {
  items: EnglishItem[];
  subcategories: string[];
  currentSubcategory: string;
  onSubcategoryChange: (sub: string) => void;
  onLearned: (itemId: string) => void;
  learnedIds: Set<string>;
}

const WordLearning = ({
  items,
  subcategories,
  currentSubcategory,
  onSubcategoryChange,
  onLearned,
  learnedIds,
}: WordLearningProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [speaking, setSpeaking] = useState(false);

  const filteredItems = items.filter(
    (item: EnglishItem) => item.subcategory === currentSubcategory,
  );
  const currentItem = filteredItems[currentIndex] || filteredItems[0];

  const handlePrev = () => {
    setCurrentIndex((prev) =>
      prev > 0 ? prev - 1 : filteredItems.length - 1,
    );
  };

  const handleNext = () => {
    setCurrentIndex((prev) =>
      prev < filteredItems.length - 1 ? prev + 1 : 0,
    );
  };

  const handleSpeak = () => {
    if (!currentItem) return;
    setSpeaking(true);
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(currentItem.content);
      utterance.lang = 'en-US';
      utterance.rate = 0.7;
      utterance.onend = () => setSpeaking(false);
      window.speechSynthesis.speak(utterance);
    } else {
      setTimeout(() => setSpeaking(false), 800);
    }
  };

  if (!currentItem) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        暂无单词内容
      </div>
    );
  }

  const isLearned = learnedIds.has(currentItem.id);

  return (
    <div className="space-y-5">
      {/* 子分类切换 */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
        {subcategories.map((sub: string) => (
          <button
            key={sub}
            onClick={() => {
              onSubcategoryChange(sub);
              setCurrentIndex(0);
            }}
            className={`px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
              currentSubcategory === sub
                ? 'bg-[hsl(185_40%_70%)] text-white shadow-md scale-105'
                : 'bg-white text-[hsl(185_40%_35%)] border-2 border-[hsl(185_30%_80%)]'
            }`}
          >
            {sub}
          </button>
        ))}
      </div>

      {/* 单词卡片 */}
      <div className="relative bg-gradient-to-b from-[hsl(185_40%_92%)] to-white rounded-3xl p-6 shadow-lg border-2 border-[hsl(185_30%_85%)] min-h-[340px] flex flex-col items-center justify-center gap-5">
        {/* 进度指示 */}
        <div className="absolute top-4 right-4 text-sm font-bold text-[hsl(185_40%_40%)] bg-white/80 px-3 py-1 rounded-full">
          {currentIndex + 1} / {filteredItems.length}
        </div>

        {/* 图片提示 */}
        <div className="w-32 h-32 rounded-2xl bg-white shadow-md flex items-center justify-center text-6xl border-4 border-[hsl(185_30%_85%)]">
          {currentItem.imageHint || '📚'}
        </div>

        {/* 单词 */}
        <div className="text-center">
          <div
            className="text-5xl font-black text-[hsl(185_40%_30%)] cursor-pointer hover:scale-105 transition-transform"
            onClick={handleSpeak}
          >
            {currentItem.content}
          </div>
          <div className="text-xl text-muted-foreground mt-2">
            {currentItem.meaning}
          </div>
        </div>

        {/* 发音按钮 */}
        <Button
          variant="outline"
          onClick={handleSpeak}
          className={`rounded-full px-6 h-12 gap-2 border-2 ${
            speaking
              ? 'bg-[hsl(185_40%_80%)] border-[hsl(185_40%_65%)]'
              : 'border-[hsl(185_40%_70%)] hover:bg-[hsl(185_40%_90%)]'
          } text-[hsl(185_40%_30%)]`}
        >
          <Volume2 className={`w-5 h-5 ${speaking ? 'animate-pulse' : ''}`} />
          听发音
        </Button>

        {/* 左右切换按钮 */}
        <button
          onClick={handlePrev}
          className="absolute left-3 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white shadow-md flex items-center justify-center text-[hsl(185_40%_40%)] hover:bg-[hsl(185_40%_90%)] active:scale-95 transition-all"
          aria-label="上一个"
        >
          <ChevronLeft className="w-7 h-7" />
        </button>
        <button
          onClick={handleNext}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white shadow-md flex items-center justify-center text-[hsl(185_40%_40%)] hover:bg-[hsl(185_40%_90%)] active:scale-95 transition-all"
          aria-label="下一个"
        >
          <ChevronRight className="w-7 h-7" />
        </button>
      </div>

      {/* 我认识按钮 */}
      <Button
        onClick={() => onLearned(currentItem.id)}
        className={`w-full h-14 rounded-full text-lg font-bold shadow-md ${
          isLearned
            ? 'bg-[hsl(145_50%_65%)] hover:bg-[hsl(145_50%_60%)]'
            : 'bg-[hsl(28_90%_62%)] hover:bg-[hsl(28_90%_58%)]'
        } text-white`}
      >
        <Check className="w-6 h-6" />
        {isLearned ? '已经认识啦！' : '我认识这个单词'}
      </Button>
    </div>
  );
};

export default WordLearning;
