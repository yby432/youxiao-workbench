import { useState } from 'react';
import { Check, AlertCircle, PenTool, BookOpen } from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@client/src/components/ui/dialog';
import { Button } from '@client/src/components/ui/button';
import { Switch } from '@client/src/components/ui/switch';
import type { ChineseCharacter, CharacterStatus } from '@shared/api.interface';
import { updateProgress } from '@client/src/api/literacy';

interface CharacterDetailProps {
  character: (ChineseCharacter & { status: CharacterStatus; isWeak: boolean }) | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChange?: (characterId: string, status: CharacterStatus, isWeak: boolean) => void;
}

const CharacterDetail = ({
  character,
  open,
  onOpenChange,
  onStatusChange,
}: CharacterDetailProps) => {
  const [localStatus, setLocalStatus] = useState<CharacterStatus>('unlearned');
  const [localIsWeak, setLocalIsWeak] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen && character) {
      setLocalStatus(character.status);
      setLocalIsWeak(character.isWeak);
    }
    onOpenChange(newOpen);
  };

  const handleMastered = async () => {
    if (!character || saving) return;
    setSaving(true);
    try {
      await updateProgress(character.id, 'mastered', localIsWeak);
      setLocalStatus('mastered');
      onStatusChange?.(character.id, 'mastered', localIsWeak);
    } catch (err) {
      logger.error('更新掌握状态失败', err as Error);
    } finally {
      setSaving(false);
    }
  };

  const handleWeakToggle = async (checked: boolean) => {
    if (!character) return;
    setLocalIsWeak(checked);
    try {
      await updateProgress(character.id, localStatus, checked);
      onStatusChange?.(character.id, localStatus, checked);
    } catch (err) {
      logger.error('更新薄弱字状态失败', err as Error);
      setLocalIsWeak(!checked);
    }
  };

  if (!character) return null;

  const statusBgMap: Record<CharacterStatus, string> = {
    unlearned: 'bg-status-unlearned',
    learning: 'bg-status-learning',
    mastered: 'bg-status-mastered',
  };

  const statusTextMap: Record<CharacterStatus, string> = {
    unlearned: '未学习',
    learning: '学习中',
    mastered: '已掌握',
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="rounded-3xl p-6 max-w-[90vw] sm:max-w-md bg-card">
        <DialogHeader>
          <DialogTitle className="text-center text-heading text-xl text-foreground">
            汉字详情
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4">
          {/* 大汉字展示 */}
          <div
            className={`w-36 h-36 rounded-3xl flex items-center justify-center ${statusBgMap[localStatus]} shadow-md`}
          >
            <span
              className="text-7xl text-heading"
              style={{ color: 'hsl(220 15% 25%)' }}
            >
              {character.character}
            </span>
          </div>

          {/* 拼音 */}
          <div className="text-2xl text-foreground font-medium">
            {character.pinyin}
          </div>

          {/* 状态标签 */}
          <div className="flex items-center gap-2">
            {localStatus === 'mastered' && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-status-mastered text-status-mastered-foreground text-sm font-medium">
                <Check className="w-4 h-4" />
                {statusTextMap[localStatus]}
              </span>
            )}
            {localStatus === 'learning' && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-status-learning text-status-learning-foreground text-sm font-medium">
                <BookOpen className="w-4 h-4" />
                {statusTextMap[localStatus]}
              </span>
            )}
            {localStatus === 'unlearned' && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-status-unlearned text-status-unlearned-foreground text-sm font-medium">
                {statusTextMap[localStatus]}
              </span>
            )}
          </div>

          {/* 基本信息 */}
          <div className="w-full grid grid-cols-2 gap-3 mt-2">
            <div className="bg-module-literacy/30 rounded-2xl p-3 text-center">
              <div className="text-xs text-muted-foreground mb-1">部首</div>
              <div className="text-lg font-medium text-foreground">
                {character.radical}
              </div>
            </div>
            <div className="bg-module-literacy/30 rounded-2xl p-3 text-center">
              <div className="text-xs text-muted-foreground mb-1">笔画数</div>
              <div className="text-lg font-medium text-foreground">
                {character.strokeCount} 画
              </div>
            </div>
          </div>

          {/* 组词 */}
          <div className="w-full">
            <div className="text-sm font-medium text-foreground mb-2 flex items-center gap-1">
              <BookOpen className="w-4 h-4 text-module-literacy-foreground" />
              组词
            </div>
            <div className="flex flex-wrap gap-2">
              {character.words.map((word: string, idx: number) => (
                <span
                  key={idx}
                  className="px-3 py-1 rounded-full bg-accent text-accent-foreground text-sm"
                >
                  {word}
                </span>
              ))}
            </div>
          </div>

          {/* 笔顺 */}
          <div className="w-full">
            <div className="text-sm font-medium text-foreground mb-2 flex items-center gap-1">
              <PenTool className="w-4 h-4 text-module-literacy-foreground" />
              笔顺（{character.strokeOrder.length} 笔）
            </div>
            <div className="flex flex-wrap gap-2">
              {character.strokeOrder.map((stroke: string, idx: number) => (
                <span
                  key={idx}
                  className="w-8 h-8 inline-flex items-center justify-center rounded-full bg-muted text-muted-foreground text-xs font-medium"
                >
                  {idx + 1}
                </span>
              ))}
            </div>
            <div className="mt-2 text-xs text-muted-foreground leading-relaxed">
              {character.strokeOrder.join(' → ')}
            </div>
          </div>

          {/* 薄弱字开关 */}
          <div className="w-full flex items-center justify-between py-2 px-1">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-status-weak" />
              <span className="text-sm text-foreground">加入薄弱字本</span>
            </div>
            <Switch checked={localIsWeak} onCheckedChange={handleWeakToggle} />
          </div>

          {/* 学会了按钮 */}
          {localStatus !== 'mastered' ? (
            <Button
              onClick={handleMastered}
              disabled={saving}
              className="w-full h-12 rounded-full text-base font-medium bg-status-mastered text-status-mastered-foreground hover:bg-status-mastered/90 border-0 shadow-md"
            >
              <Check className="w-5 h-5" />
              {saving ? '保存中...' : '我学会啦！'}
            </Button>
          ) : (
            <div className="w-full h-12 rounded-full flex items-center justify-center gap-2 bg-status-mastered/20 text-status-mastered-foreground text-base font-medium">
              <Check className="w-5 h-5" />
              太棒了，已经掌握！
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CharacterDetail;
