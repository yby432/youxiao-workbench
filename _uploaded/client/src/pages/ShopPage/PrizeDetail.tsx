import { Coins, Package, X, Sparkles } from 'lucide-react';
import { Button } from '@client/src/components/ui/button';
import { Badge } from '@client/src/components/ui/badge';
import type { Prize, PrizeTier } from '@shared/api.interface';

interface PrizeDetailProps {
  prize: Prize;
  beanBalance: number;
  onExchange: () => void;
  onClose: () => void;
}

const TIER_BG: Record<PrizeTier, string> = {
  low: 'from-[hsl(145_45%_88%)] to-[hsl(145_40%_78%)]',
  medium: 'from-[hsl(270_45%_90%)] to-[hsl(270_40%_80%)]',
  high: 'from-[hsl(25_55%_88%)] to-[hsl(25_50%_78%)]',
};

const TIER_ICON: Record<PrizeTier, string> = {
  low: '🎀',
  medium: '📚',
  high: '🎁',
};

const TIER_LABEL: Record<PrizeTier, string> = {
  low: '低价小件',
  medium: '中端文具',
  high: '高阶实物',
};

const PrizeDetail = ({ prize, beanBalance, onExchange, onClose }: PrizeDetailProps) => {
  const isSoldOut = prize.stock === 0;
  const notEnoughBeans = beanBalance < prize.price;
  const canExchange = !isSoldOut && !notEnoughBeans;

  return (
    <div className="flex flex-col">
      {/* 大图展示 */}
      <div className={`relative aspect-square bg-gradient-to-br ${TIER_BG[prize.tier]} flex items-center justify-center`}>
        <div className="absolute inset-0 bg-gradient-to-br from-white/50 via-transparent to-transparent pointer-events-none" />
        <div className="text-8xl drop-shadow-md">{TIER_ICON[prize.tier]}</div>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-[hsl(220_10%_45%)] hover:bg-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        <Badge className="absolute top-4 left-4 bg-white/90 text-[hsl(220_15%_25%)] backdrop-blur-sm">
          {TIER_LABEL[prize.tier]}
        </Badge>
      </div>

      {/* 详情内容 */}
      <div className="p-5">
        <h2
          className="text-xl font-bold text-[hsl(220_15%_25%)]"
          style={{ fontFamily: '"ZCOOL KuaiLe", "PingFang SC", sans-serif' }}
        >
          {prize.name}
        </h2>

        <p className="text-sm text-[hsl(220_10%_50%)] mt-2 leading-relaxed">
          {prize.description}
        </p>

        {/* 价格与库存 */}
        <div className="flex items-center justify-between mt-5 py-4 px-4 bg-[hsl(40_30%_97%)] rounded-2xl">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[hsl(45_90%_75%)] to-[hsl(28_90%_60%)] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-xs text-[hsl(220_10%_50%)]">所需学习豆</div>
              <div
                className="text-2xl font-bold text-[hsl(28_90%_50%)]"
                style={{ fontFamily: '"Nunito", monospace' }}
              >
                {prize.price}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-[hsl(220_10%_50%)] flex items-center gap-1 justify-end">
              <Package className="w-3 h-3" />
              库存
            </div>
            <div className="text-lg font-semibold text-[hsl(220_15%_25%)]">
              {prize.stock}
            </div>
          </div>
        </div>

        {/* 余额提示 */}
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-[hsl(220_10%_50%)]">当前余额</span>
          <span className="flex items-center gap-1 font-semibold text-[hsl(28_90%_50%)]">
            <Coins className="w-4 h-4" />
            <span style={{ fontFamily: '"Nunito", monospace' }}>{beanBalance}</span>
          </span>
        </div>

        {/* 兑换按钮 */}
        <Button
          onClick={onExchange}
          disabled={!canExchange}
          className={`w-full mt-5 h-14 rounded-full text-base font-bold transition-all ${
            canExchange
              ? 'bg-gradient-to-r from-[hsl(340_70%_75%)] via-[hsl(20_85%_70%)] to-[hsl(45_90%_65%)] text-white shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-95'
              : 'bg-[hsl(220_10%_85%)] text-[hsl(220_10%_50%)] cursor-not-allowed'
          }`}
        >
          {isSoldOut
            ? '已兑完'
            : notEnoughBeans
            ? `还差 ${prize.price - beanBalance} 豆`
            : '立即兑换'}
        </Button>

        {notEnoughBeans && !isSoldOut && (
          <p className="text-center text-xs text-[hsl(220_10%_50%)] mt-2">
            继续学习赚取更多学习豆吧～
          </p>
        )}
      </div>
    </div>
  );
};

export default PrizeDetail;
