import { useState } from 'react';
import { Check, Volume2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@client/src/components/ui/dialog';
import { Button } from '@client/src/components/ui/button';
import type { EnglishItem } from '@shared/api.interface';

interface AlphabetDetailProps {
  item: EnglishItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLearned: (itemId: string) => void;
  learned: boolean;
}

const AlphabetDetail = ({
  item,
  open,
  onOpenChange,
  onLearned,
  learned,
}: AlphabetDetailProps) => {
  const [speaking, setSpeaking] = useState(false);

  const handleSpeak = () => {
    if (!item) return;
    setSpeaking(true);
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(item.content);
      utterance.lang = 'en-US';
      utterance.rate = 0.7;
      utterance.onend = () => setSpeaking(false);
      window.speechSynthesis.speak(utterance);
    } else {
      setTimeout(() => setSpeaking(false), 800);
    }
  };

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl p-8 max-w-sm border-none shadow-xl bg-gradient-to-b from-[hsl(185_40%_95%)] to-white">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold text-[hsl(185_40%_25%)]">
            字母学习
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-6">
          {/* 大小写展示 */}
          <div className="flex items-center gap-6">
            <div className="w-28 h-28 rounded-2xl bg-white shadow-md flex items-center justify-center border-4 border-[hsl(185_40%_80%)]">
              <span className="text-6xl font-black text-[hsl(185_40%_35%)]">
                {item.content.toUpperCase()}
              </span>
            </div>
            <div className="w-28 h-28 rounded-2xl bg-white shadow-md flex items-center justify-center border-4 border-[hsl(185_40%_80%)]">
              <span className="text-6xl font-black text-[hsl(185_40%_35%)]">
                {item.content.toLowerCase()}
              </span>
            </div>
          </div>

          {/* 发音按钮 */}
          <Button
            variant="outline"
            size="lg"
            onClick={handleSpeak}
            className={`rounded-full px-8 h-14 gap-3 text-lg border-2 ${
              speaking
                ? 'bg-[hsl(185_40%_80%)] border-[hsl(185_40%_65%)] text-[hsl(185_40%_25%)]'
                : 'border-[hsl(185_40%_70%)] text-[hsl(185_40%_30%)] hover:bg-[hsl(185_40%_90%)]'
            }`}
          >
            <Volume2 className={`w-6 h-6 ${speaking ? 'animate-pulse' : ''}`} />
            {speaking ? '正在发音...' : '点我听发音'}
          </Button>

          {/* 代表单词和图片 */}
          <div className="w-full bg-white rounded-2xl p-5 shadow-sm border-2 border-[hsl(185_30%_85%)]">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-xl bg-[hsl(185_30%_92%)] flex items-center justify-center text-4xl flex-shrink-0">
                {item.imageHint ? item.imageHint : '🔤'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-2xl font-bold text-[hsl(185_40%_30%)] truncate">
                  {item.meaning || item.content}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {item.subcategory}
                </div>
              </div>
            </div>
          </div>

          {/* 学会了按钮 */}
          <Button
            onClick={() => onLearned(item.id)}
            className={`w-full h-14 rounded-full text-lg font-bold shadow-md ${
              learned
                ? 'bg-[hsl(145_50%_65%)] hover:bg-[hsl(145_50%_60%)]'
                : 'bg-[hsl(28_90%_62%)] hover:bg-[hsl(28_90%_58%)]'
            } text-white`}
          >
            <Check className="w-6 h-6" />
            {learned ? '已经学会啦！' : '我学会了'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AlphabetDetail;
