import { useState } from 'react';
import { Volume2, Mic } from 'lucide-react';
import { Button } from '@client/src/components/ui/button';
import type { EnglishItem } from '@shared/api.interface';

interface SentenceListProps {
  items: EnglishItem[];
  onLearned: (itemId: string) => void;
  learnedIds: Set<string>;
}

const SentenceList = ({ items, onLearned, learnedIds }: SentenceListProps) => {
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [readingId, setReadingId] = useState<string | null>(null);

  const handleSpeak = (item: EnglishItem) => {
    setSpeakingId(item.id);
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(item.content);
      utterance.lang = 'en-US';
      utterance.rate = 0.7;
      utterance.onend = () => setSpeakingId(null);
      window.speechSynthesis.speak(utterance);
    } else {
      setTimeout(() => setSpeakingId(null), 1200);
    }
  };

  const handleRead = (itemId: string) => {
    setReadingId(itemId);
    setTimeout(() => {
      setReadingId(null);
      onLearned(itemId);
    }, 1500);
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        暂无短句内容
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item: EnglishItem, index: number) => {
        const isLearned = learnedIds.has(item.id);
        const isSpeaking = speakingId === item.id;
        const isReading = readingId === item.id;
        const colors = [
          'from-[hsl(185_40%_92%)]',
          'from-[hsl(160_40%_92%)]',
          'from-[hsl(200_40%_92%)]',
          'from-[hsl(170_40%_92%)]',
        ];
        const bgColor = colors[index % colors.length];

        return (
          <div
            key={item.id}
            className={`bg-gradient-to-br ${bgColor} to-white rounded-2xl p-5 shadow-sm border-2 border-[hsl(185_20%_88%)] transition-all ${
              isReading ? 'scale-[1.02] ring-4 ring-[hsl(28_90%_62%)]/40' : ''
            }`}
          >
            {/* 序号 + 场景 */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-[hsl(185_40%_40%)] bg-white/70 px-3 py-1 rounded-full">
                第 {index + 1} 句 · {item.subcategory}
              </span>
              {isLearned && (
                <span className="text-xs font-bold text-[hsl(145_50%_35%)] bg-[hsl(145_50%_85%)] px-3 py-1 rounded-full">
                  ✓ 已掌握
                </span>
              )}
            </div>

            {/* 英文句子 */}
            <div
              className="text-2xl font-bold text-[hsl(185_40%_25%)] leading-relaxed cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => handleSpeak(item)}
            >
              {item.content}
            </div>

            {/* 中文翻译 */}
            <div className="text-base text-muted-foreground mt-2">
              {item.meaning}
            </div>

            {/* 场景描述 */}
            {item.imageHint && (
              <div className="text-sm text-[hsl(185_40%_40%)] mt-2 flex items-center gap-2">
                <span className="text-lg">💬</span>
                <span>{item.imageHint}</span>
              </div>
            )}

            {/* 操作按钮 */}
            <div className="flex gap-3 mt-4">
              <Button
                variant="outline"
                onClick={() => handleSpeak(item)}
                className={`flex-1 h-11 rounded-full gap-2 border-2 ${
                  isSpeaking
                    ? 'bg-[hsl(185_40%_80%)] border-[hsl(185_40%_65%)]'
                    : 'border-[hsl(185_40%_70%)] hover:bg-[hsl(185_40%_90%)]'
                } text-[hsl(185_40%_30%)]`}
              >
                <Volume2
                  className={`w-5 h-5 ${isSpeaking ? 'animate-pulse' : ''}`}
                />
                {isSpeaking ? '播放中...' : '听一听'}
              </Button>
              <Button
                onClick={() => handleRead(item.id)}
                disabled={isReading}
                className={`flex-1 h-11 rounded-full gap-2 text-white font-bold shadow-sm ${
                  isReading
                    ? 'bg-[hsl(28_90%_62%)] animate-pulse'
                    : isLearned
                      ? 'bg-[hsl(145_50%_65%)] hover:bg-[hsl(145_50%_60%)]'
                      : 'bg-[hsl(28_90%_62%)] hover:bg-[hsl(28_90%_58%)]'
                }`}
              >
                <Mic className="w-5 h-5" />
                {isReading ? '跟读中...' : isLearned ? '再读一遍' : '跟我读'}
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default SentenceList;
