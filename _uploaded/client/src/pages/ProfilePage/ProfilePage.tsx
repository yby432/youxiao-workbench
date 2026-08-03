import { useState, useEffect } from 'react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import {
  Flame,
  Coins,
  BookOpen,
  Sparkles,
  AlertTriangle,
  Settings,
  Info,
  ChevronRight,
  Package,
  Clock,
} from 'lucide-react';
import type { LearningReport, ExchangeOrder } from '@shared/api.interface';
import { getLearningReport } from '@client/src/api/user';
import { getExchangeOrders } from '@client/src/api/shop';
import { ModulePieChart, WeeklyTrendChart } from './ProfileCharts';

const STATUS_LABELS: Record<ExchangeOrder['status'], string> = {
  pending: '待发货',
  shipped: '已发货',
  completed: '已完成',
  cancelled: '已取消',
};

const STATUS_COLORS: Record<ExchangeOrder['status'], string> = {
  pending: 'bg-amber-100 text-amber-700',
  shipped: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-gray-100 text-gray-500',
};

const ProfilePage = () => {
  const [report, setReport] = useState<LearningReport | null>(null);
  const [orders, setOrders] = useState<ExchangeOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [reportData, ordersData] = await Promise.all([
          getLearningReport(),
          getExchangeOrders(1, 5),
        ]);
        setReport(reportData);
        setOrders(ordersData.items);
      } catch (error) {
        logger.error('加载个人中心数据失败', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[hsl(40_30%_98%)] flex items-center justify-center">
        <div className="text-[hsl(220_10%_55%)]">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[hsl(40_30%_98%)] pb-24">
      {/* 用户信息区 */}
      <div className="relative bg-gradient-to-b from-[#B8E0FF] to-[#D4EEFF] px-5 pt-10 pb-16 rounded-b-[32px]">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-white p-1 shadow-lg">
              <div className="w-full h-full rounded-full bg-gradient-to-br from-[#FFD6A5] to-[#FFADAD] flex items-center justify-center text-3xl">
                🦁
              </div>
            </div>
            <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#FFB347] flex items-center justify-center text-white text-xs font-bold shadow-md">
              5
            </div>
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-[hsl(220_15%_25%)] mb-1">
              小朋友
            </h1>
            <p className="text-sm text-[hsl(220_10%_55%)]">
              学习小达人 · 继续加油哦~
            </p>
          </div>
        </div>

        {/* 学习豆 & 连续打卡 */}
        <div className="flex gap-3 mt-5">
          <div className="flex-1 bg-white/70 backdrop-blur-sm rounded-2xl py-3 px-4 flex items-center gap-3 shadow-sm">
            <div className="w-10 h-10 rounded-full bg-[#FFF3CD] flex items-center justify-center">
              <Coins className="w-5 h-5 text-[#F59E0B]" />
            </div>
            <div>
              <div className="text-xs text-[hsl(220_10%_55%)]">学习豆</div>
              <div className="text-lg font-bold text-[hsl(220_15%_25%)]">
                {report?.totalBeans ?? 0}
              </div>
            </div>
          </div>
          <div className="flex-1 bg-white/70 backdrop-blur-sm rounded-2xl py-3 px-4 flex items-center gap-3 shadow-sm">
            <div className="w-10 h-10 rounded-full bg-[#FFE0CC] flex items-center justify-center">
              <Flame className="w-5 h-5 text-[#FF7A45]" />
            </div>
            <div>
              <div className="text-xs text-[hsl(220_10%_55%)]">连续打卡</div>
              <div className="text-lg font-bold text-[hsl(220_15%_25%)]">
                {report?.streakDays ?? 0}天
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-8 space-y-4">
        {/* 识字核心数据卡片 */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h2 className="text-base font-bold text-[hsl(220_15%_25%)] mb-3 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#7BC47F]" />
            识字小达人
          </h2>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-[#E8F5E9] rounded-xl py-3 px-2 text-center">
              <div className="text-2xl font-bold text-[#4CAF50]">
                {report?.literacy.total ?? 0}
              </div>
              <div className="text-xs text-[hsl(220_10%_55%)] mt-1">总字数</div>
            </div>
            <div className="bg-[#E3F2FD] rounded-xl py-3 px-2 text-center">
              <div className="text-2xl font-bold text-[#42A5F5]">
                {report?.literacy.mastered ?? 0}
              </div>
              <div className="text-xs text-[hsl(220_10%_55%)] mt-1">已掌握</div>
            </div>
            <div className="bg-[#FFF3E0] rounded-xl py-3 px-2 text-center">
              <div className="text-2xl font-bold text-[#FF9800]">
                {report?.literacy.weakCount ?? 0}
              </div>
              <div className="text-xs text-[hsl(220_10%_55%)] mt-1">薄弱字</div>
            </div>
          </div>
        </div>

        {/* 学习时长饼图 */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h2 className="text-base font-bold text-[hsl(220_15%_25%)] mb-2 flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#B4D8FF]" />
            学习时长分布
          </h2>
          {report && report.moduleTime.some((m) => m.minutes > 0) ? (
            <ModulePieChart
              data={report.moduleTime.map((m) => ({
                name: m.name,
                value: m.minutes,
              }))}
            />
          ) : (
            <div className="h-64 flex items-center justify-center text-[hsl(220_10%_55%)] text-sm">
              还没有学习数据哦，快去学习吧~
            </div>
          )}
        </div>

        {/* 周学习趋势折线图 */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h2 className="text-base font-bold text-[hsl(220_15%_25%)] mb-2 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#7CB7FF]" />
            本周学习趋势
          </h2>
          {report && report.weeklyTrend.length > 0 ? (
            <WeeklyTrendChart
              dates={report.weeklyTrend.map((d) => d.date)}
              minutes={report.weeklyTrend.map((d) => d.minutes)}
            />
          ) : (
            <div className="h-56 flex items-center justify-center text-[hsl(220_10%_55%)] text-sm">
              暂无数据
            </div>
          )}
        </div>

        {/* 薄弱项智能提示 */}
        {report && report.weakPoints.length > 0 && (
          <div className="bg-gradient-to-br from-[#FFF4D6] to-[#FFE8B3] rounded-2xl p-4 shadow-sm">
            <h2 className="text-base font-bold text-[#8B6914] mb-3 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-[#F59E0B]" />
              小建议
            </h2>
            <div className="space-y-2">
              {report.weakPoints.map((point) => (
                <div
                  key={point.module}
                  className="bg-white/60 rounded-xl p-3 flex items-start gap-3"
                >
                  <div className="w-8 h-8 rounded-full bg-[#FFD699] flex items-center justify-center text-sm shrink-0">
                    💡
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-[#8B6914] mb-0.5">
                      {point.name}
                    </div>
                    <div className="text-xs text-[#A0822C] leading-relaxed">
                      {point.suggestion}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 兑换记录 */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h2 className="text-base font-bold text-[hsl(220_15%_25%)] mb-3 flex items-center gap-2">
            <Package className="w-5 h-5 text-[#D5AAFF]" />
            兑换记录
            {report && (
              <span className="text-xs font-normal text-[hsl(220_10%_55%)] ml-auto">
                共 {report.exchangeCount} 单
              </span>
            )}
          </h2>
          {orders.length > 0 ? (
            <div className="space-y-3">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center gap-3 py-2 border-b border-[hsl(40_20%_90%)] last:border-b-0"
                >
                  <div className="w-12 h-12 rounded-xl bg-[#F5F0FF] flex items-center justify-center text-xl shrink-0">
                    🎁
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-[hsl(220_15%_25%)] truncate">
                      {order.prizeName}
                    </div>
                    <div className="text-xs text-[hsl(220_10%_55%)] mt-0.5">
                      {new Date(order.createdAt).toLocaleDateString('zh-CN')}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-[#F59E0B]">
                      -{order.beanCost} 🫘
                    </div>
                    <span
                      className={`inline-block text-xs px-2 py-0.5 rounded-full mt-1 ${STATUS_COLORS[order.status]}`}
                    >
                      {STATUS_LABELS[order.status]}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-[hsl(220_10%_55%)] text-sm">
              还没有兑换记录哦~
            </div>
          )}
        </div>

        {/* 功能列表 */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <button
            className="w-full flex items-center gap-3 px-4 py-4 hover:bg-[hsl(40_30%_98%)] transition-colors border-b border-[hsl(40_20%_90%)]"
            onClick={() => logger.info({ level: 'info', args: ['点击设置'] })}
          >
            <Settings className="w-5 h-5 text-[hsl(220_10%_55%)]" />
            <span className="flex-1 text-left text-sm text-[hsl(220_15%_25%)]">
              设置
            </span>
            <ChevronRight className="w-4 h-4 text-[hsl(220_10%_55%)]" />
          </button>
          <button
            className="w-full flex items-center gap-3 px-4 py-4 hover:bg-[hsl(40_30%_98%)] transition-colors"
            onClick={() => logger.info({ level: 'info', args: ['点击关于'] })}
          >
            <Info className="w-5 h-5 text-[hsl(220_10%_55%)]" />
            <span className="flex-1 text-left text-sm text-[hsl(220_15%_25%)]">
              关于
            </span>
            <ChevronRight className="w-4 h-4 text-[hsl(220_10%_55%)]" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
