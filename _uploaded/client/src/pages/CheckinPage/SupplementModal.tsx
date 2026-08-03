import { useState } from 'react';
import { X, Sparkles } from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { supplementCheckin } from '@client/src/api/checkin';
import type { SupplementResponse } from '@client/src/api/checkin';

interface SupplementModalProps {
  open: boolean;
  date: string;
  beanBalance: number;
  onClose: () => void;
  onSuccess: (result: SupplementResponse) => void;
}

const SupplementModal = ({
  open,
  date,
  beanBalance,
  onClose,
  onSuccess,
}: SupplementModalProps) => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!open) return null;

  const canAfford = beanBalance >= 20;

  const handleConfirm = async () => {
    if (!canAfford || loading) return;
    setLoading(true);
    try {
      const result = await supplementCheckin(date);
      setSuccess(true);
      onSuccess(result);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1500);
    } catch (err) {
      logger.error('补打卡失败', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    setSuccess(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
      <div className="relative w-full max-w-sm rounded-3xl bg-white p-6 shadow-xl">
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-muted/50 text-muted-foreground transition hover:bg-muted"
          aria-label="关闭"
        >
          <X size={18} />
        </button>

        {success ? (
          <div className="flex flex-col items-center py-6">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
              <Sparkles className="h-10 w-10 text-green-500" />
            </div>
            <h3 className="mb-2 text-xl font-bold text-foreground">补签成功！</h3>
            <p className="text-muted-foreground">已消耗 20 学习豆</p>
          </div>
        ) : (
          <>
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100">
                <Sparkles className="h-6 w-6 text-amber-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">补打卡</h3>
                <p className="text-sm text-muted-foreground">{date}</p>
              </div>
            </div>

            <div className="mb-6 rounded-2xl bg-amber-50 p-4">
              <p className="mb-2 text-sm text-amber-800">
                补签需要消耗 <span className="font-bold">20 学习豆</span>
              </p>
              <p className="text-sm text-amber-700">
                当前学习豆：<span className="font-bold">{beanBalance}</span>
              </p>
              {!canAfford && (
                <p className="mt-2 text-sm text-red-500">学习豆不足，无法补签</p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleClose}
                disabled={loading}
                className="flex-1 rounded-full bg-muted py-3 font-semibold text-muted-foreground transition hover:bg-muted/80"
              >
                取消
              </button>
              <button
                onClick={handleConfirm}
                disabled={!canAfford || loading}
                className="flex-1 rounded-full bg-primary py-3 font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
              >
                {loading ? '补签中...' : '确认补签'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SupplementModal;
