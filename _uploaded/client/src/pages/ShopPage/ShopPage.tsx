import { useState, useEffect } from 'react';
import { Sparkles, Gift, Coins, Package } from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { Button } from '@client/src/components/ui/button';
import { Badge } from '@client/src/components/ui/badge';
import { Image } from '@client/src/components/ui/image';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@client/src/components/ui/dialog';
import {
  getPrizes,
  getUserProfile,
  exchangePrize,
} from '@client/src/api/shop';
import type { Prize, PrizeTier, UserLearningProfile } from '@shared/api.interface';
import PrizeDetail from './PrizeDetail';
import ExchangeForm from './ExchangeForm';
import ExchangeSuccess from './ExchangeSuccess';

const TIER_TABS: Array<{ key: PrizeTier | 'all'; label: string; range: string }> = [
  { key: 'all', label: '全部', range: '' },
  { key: 'low', label: '低价小件', range: '50-200豆' },
  { key: 'medium', label: '中端文具', range: '200-600豆' },
  { key: 'high', label: '高阶实物', range: '600豆以上' },
];

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

const ShopPage = () => {
  const [activeTier, setActiveTier] = useState<PrizeTier | 'all'>('all');
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [profile, setProfile] = useState<UserLearningProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPrize, setSelectedPrize] = useState<Prize | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showExchangeForm, setShowExchangeForm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successData, setSuccessData] = useState<{ orderId: string; beanCost: number; prizeName: string } | null>(null);

  useEffect(() => {
    void loadData();
  }, [activeTier]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [prizesData, profileData] = await Promise.all([
        getPrizes(activeTier === 'all' ? undefined : activeTier),
        getUserProfile(),
      ]);
      setPrizes(prizesData);
      setProfile(profileData);
    } catch (error) {
      logger.error('加载商城数据失败', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrizeClick = (prize: Prize) => {
    setSelectedPrize(prize);
    setShowDetail(true);
  };

  const handleExchange = () => {
    if (!selectedPrize) return;
    if (!profile || profile.beanBalance < selectedPrize.price) return;
    setShowDetail(false);
    setShowExchangeForm(true);
  };

  const handleSubmitExchange = async (form: { receiverName: string; receiverPhone: string; address: string }) => {
    if (!selectedPrize) return;
    try {
      const result = await exchangePrize({
        prizeId: selectedPrize.id,
        ...form,
      });
      setShowExchangeForm(false);
      setSuccessData({
        orderId: result.orderId,
        beanCost: result.beanCost,
        prizeName: selectedPrize.name,
      });
      setShowSuccess(true);
      // 更新余额
      setProfile((prev) => prev ? { ...prev, beanBalance: result.newBalance } : prev);
      // 刷新奖品列表（库存变化）
      const updatedPrizes = await getPrizes(activeTier === 'all' ? undefined : activeTier);
      setPrizes(updatedPrizes);
    } catch (error) {
      logger.error('兑换失败', error);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
    setSuccessData(null);
    setSelectedPrize(null);
  };

  return (
    <div className="min-h-screen bg-[hsl(40_30%_98%)] pb-20">
      {/* 顶部余额栏 */}
      <div className="bg-gradient-to-br from-[hsl(340_70%_92%)] via-[hsl(20_80%_94%)] to-[hsl(45_80%_92%)] px-5 pt-8 pb-10 rounded-b-[32px] shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[hsl(220_15%_25%)]" style={{ fontFamily: '"ZCOOL KuaiLe", "PingFang SC", sans-serif' }}>
              积分商城
            </h1>
            <p className="text-sm text-[hsl(220_10%_45%)] mt-1">用学习豆兑换喜欢的礼物～</p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl px-4 py-2 shadow-sm flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[hsl(45_90%_70%)] to-[hsl(28_90%_60%)] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div className="text-right">
              <div className="text-xs text-[hsl(220_10%_50%)]">学习豆</div>
              <div className="text-lg font-bold text-[hsl(28_90%_50%)]" style={{ fontFamily: '"Nunito", monospace' }}>
                {profile?.beanBalance ?? 0}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 分类标签 */}
      <div className="px-5 -mt-5">
        <div className="bg-white rounded-2xl p-2 shadow-sm flex gap-1 overflow-x-auto">
          {TIER_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTier(tab.key)}
              className={`flex-1 min-w-[70px] py-2 px-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                activeTier === tab.key
                  ? 'bg-gradient-to-br from-[hsl(340_70%_85%)] to-[hsl(20_80%_85%)] text-[hsl(220_15%_25%)] shadow-sm scale-105'
                  : 'text-[hsl(220_10%_50%)] hover:bg-[hsl(40_20%_95%)]'
              }`}
            >
              <div className="text-xs opacity-80">{tab.range}</div>
              <div>{tab.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 奖品网格 */}
      <div className="px-5 mt-6">
        {loading ? (
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-2xl h-48 animate-pulse" />
            ))}
          </div>
        ) : prizes.length === 0 ? (
          <div className="text-center py-16 text-[hsl(220_10%_50%)]">
            <Gift className="w-16 h-16 mx-auto mb-3 opacity-30" />
            <p>暂无奖品</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {prizes.map((prize) => (
              <PrizeCard key={prize.id} prize={prize} onClick={() => handlePrizeClick(prize)} />
            ))}
          </div>
        )}
      </div>

      {/* 奖品详情弹窗 */}
      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="rounded-3xl max-w-sm mx-4 p-0 overflow-hidden">
          {selectedPrize && (
            <PrizeDetail
              prize={selectedPrize}
              beanBalance={profile?.beanBalance ?? 0}
              onExchange={handleExchange}
              onClose={() => setShowDetail(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* 兑换表单弹窗 */}
      <Dialog open={showExchangeForm} onOpenChange={setShowExchangeForm}>
        <DialogContent className="rounded-3xl max-w-sm mx-4">
          <DialogHeader>
            <DialogTitle className="text-center text-xl" style={{ fontFamily: '"ZCOOL KuaiLe", sans-serif' }}>
              填写收货信息
            </DialogTitle>
            <DialogDescription className="text-center text-[hsl(220_10%_50%)]">
              奖品将在3-5个工作日内寄出
            </DialogDescription>
          </DialogHeader>
          {selectedPrize && (
            <ExchangeForm
              prizeName={selectedPrize.name}
              beanCost={selectedPrize.price}
              onSubmit={handleSubmitExchange}
              onCancel={() => setShowExchangeForm(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* 兑换成功弹窗 */}
      <Dialog open={showSuccess} onOpenChange={handleSuccessClose}>
        <DialogContent className="rounded-3xl max-w-sm mx-4">
          {successData && (
            <ExchangeSuccess
              orderId={successData.orderId}
              beanCost={successData.beanCost}
              prizeName={successData.prizeName}
              onClose={handleSuccessClose}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

interface PrizeCardProps {
  prize: Prize;
  onClick: () => void;
}

const PrizeCard = ({ prize, onClick }: PrizeCardProps) => {
  const isSoldOut = prize.stock === 0;
  return (
    <button
      onClick={onClick}
      disabled={isSoldOut}
      className={`bg-white rounded-2xl overflow-hidden shadow-sm text-left transition-all duration-200 active:scale-95 ${
        isSoldOut ? 'opacity-60' : 'hover:shadow-md'
      }`}
    >
      {/* 奖品图片区 */}
      <div className={`relative aspect-square bg-gradient-to-br ${TIER_BG[prize.tier]} flex items-center justify-center overflow-hidden`}>
        {/* 光泽效果 */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent pointer-events-none" />
        <div className="text-5xl drop-shadow-sm">{TIER_ICON[prize.tier]}</div>
        {isSoldOut && (
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
            <Badge variant="destructive" className="text-xs px-3 py-1">
              已兑完
            </Badge>
          </div>
        )}
        {prize.stock > 0 && prize.stock <= 5 && (
          <div className="absolute top-2 right-2">
            <Badge className="bg-[hsl(28_90%_62%)] text-white text-xs">
              仅剩{prize.stock}件
            </Badge>
          </div>
        )}
      </div>
      {/* 奖品信息 */}
      <div className="p-3">
        <h3 className="text-sm font-semibold text-[hsl(220_15%_25%)] truncate">{prize.name}</h3>
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-1">
            <Coins className="w-4 h-4 text-[hsl(45_90%_55%)]" />
            <span className="text-base font-bold text-[hsl(28_90%_50%)]" style={{ fontFamily: '"Nunito", monospace' }}>
              {prize.price}
            </span>
          </div>
          <div className="text-xs text-[hsl(220_10%_50%)] flex items-center gap-1">
            <Package className="w-3 h-3" />
            {prize.stock}
          </div>
        </div>
      </div>
    </button>
  );
};

export default ShopPage;
