import { CheckCircle, Sparkles, Coins } from 'lucide-react';
import { Button } from '@client/src/components/ui/button';

interface ExchangeSuccessProps {
  orderId: string;
  beanCost: number;
  prizeName: string;
  onClose: () => void;
}

const ExchangeSuccess = ({ orderId, beanCost, prizeName, onClose }: ExchangeSuccessProps) => {
  return (
    <div className="text-center py-4">
      {/* 成功动画图标 */}
      <div className="relative w-24 h-24 mx-auto mb-4">
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(145_50%_75%)] to-[hsl(145_45%_60%)] rounded-full animate-pulse opacity-30 scale-125" />
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(145_50%_75%)] to-[hsl(145_45%_60%)] rounded-full flex items-center justify-center shadow-lg">
          <CheckCircle className="w-12 h-12 text-white" />
        </div>
        {/* 装饰星星 */}
        <Sparkles className="absolute -top-1 -right-1 w-6 h-6 text-[hsl(45_90%_60%)] animate-bounce" />
        <Sparkles className="absolute -bottom-1 -left-2 w-5 h-5 text-[hsl(340_70%_70%)] animate-bounce" style={{ animationDelay: '0.2s' }} />
      </div>

      <h2
        className="text-2xl font-bold text-[hsl(220_15%_25%)]"
        style={{ fontFamily: '"ZCOOL KuaiLe", "PingFang SC", sans-serif' }}
      >
        兑换成功！
      </h2>

      <p className="text-sm text-[hsl(220_10%_50%)] mt-2">
        恭喜你获得 <span className="font-semibold text-[hsl(220_15%_25%)]">{prizeName}</span>
      </p>

      {/* 消耗豆数 */}
      <div className="mt-5 py-4 px-6 bg-gradient-to-r from-[hsl(340_70%_95%)] to-[hsl(45_80%_95%)] rounded-2xl inline-flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[hsl(45_90%_75%)] to-[hsl(28_90%_60%)] flex items-center justify-center">
          <Coins className="w-5 h-5 text-white" />
        </div>
        <div className="text-left">
          <div className="text-xs text-[hsl(220_10%_50%)]">消耗学习豆</div>
          <div
            className="text-xl font-bold text-[hsl(28_90%_50%)]"
            style={{ fontFamily: '"Nunito", monospace' }}
          >
            -{beanCost}
          </div>
        </div>
      </div>

      {/* 订单号 */}
      <div className="mt-4 text-xs text-[hsl(220_10%_50%)]">
        订单号：<span className="font-mono">{orderId.slice(0, 8)}...</span>
      </div>

      <p className="text-xs text-[hsl(220_10%_50%)] mt-2">
        奖品将在3-5个工作日内寄出，请耐心等待～
      </p>

      <Button
        onClick={onClose}
        className="w-full mt-6 h-12 rounded-full bg-gradient-to-r from-[hsl(145_50%_65%)] to-[hsl(145_45%_55%)] text-white font-bold shadow-md hover:shadow-lg active:scale-95 transition-all"
      >
        太棒了！
      </Button>
    </div>
  );
};

export default ExchangeSuccess;
