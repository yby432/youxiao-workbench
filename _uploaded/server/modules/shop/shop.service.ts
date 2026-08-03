import { Inject, Injectable, BadRequestException, Logger } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { eq, and, gt, sql } from 'drizzle-orm';
import type { Prize, PrizeTier, ExchangeResult } from '@shared/api.interface';
import { prize, exchangeOrder, beanTransaction, userLearningProfile } from '@server/database/schema';

@Injectable()
export class ShopService {
  private readonly logger = new Logger(ShopService.name);

  constructor(@Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase) {}

  async getPrizes(tier?: PrizeTier): Promise<Prize[]> {
    const conditions = [];
    if (tier) {
      conditions.push(eq(prize.tier, tier));
    }
    const query = conditions.length > 0
      ? this.db.select().from(prize).where(and(...conditions)).orderBy(prize.price)
      : this.db.select().from(prize).orderBy(prize.price);
    const rows = await query;
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      imageHint: row.imageHint,
      price: row.price,
      tier: row.tier as PrizeTier,
      stock: row.stock,
    }));
  }

  async getPrizeById(id: string): Promise<Prize> {
    const rows = await this.db.select().from(prize).where(eq(prize.id, id)).limit(1);
    if (rows.length === 0) {
      throw new BadRequestException('奖品不存在');
    }
    const row = rows[0];
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      imageHint: row.imageHint,
      price: row.price,
      tier: row.tier as PrizeTier,
      stock: row.stock,
    };
  }

  async exchange(
    userId: string,
    prizeId: string,
    receiverName: string,
    receiverPhone: string,
    address: string,
  ): Promise<ExchangeResult> {
    this.logger.log(`用户 ${userId} 开始兑换奖品 ${prizeId}`);

    return this.db.transaction(async (tx) => {
      // 1. 原子扣减库存
      const updatedPrizes = await tx
        .update(prize)
        .set({ stock: sql<number>`${prize.stock} - 1` })
        .where(and(eq(prize.id, prizeId), gt(prize.stock, 0)))
        .returning({ id: prize.id, price: prize.price, name: prize.name });

      if (updatedPrizes.length === 0) {
        throw new BadRequestException('库存不足，无法兑换');
      }

      const beanCost = updatedPrizes[0].price;
      const prizeName = updatedPrizes[0].name;

      // 2. 原子扣减学习豆
      const updatedProfiles = await tx
        .update(userLearningProfile)
        .set({ beanBalance: sql<number>`${userLearningProfile.beanBalance} - ${beanCost}` })
        .where(and(eq(userLearningProfile.userId, userId), sql`${userLearningProfile.beanBalance} >= ${beanCost}`))
        .returning({ beanBalance: userLearningProfile.beanBalance });

      if (updatedProfiles.length === 0) {
        throw new BadRequestException('学习豆余额不足');
      }

      const newBalance = updatedProfiles[0].beanBalance;

      // 3. 插入豆交易记录
      await tx.insert(beanTransaction).values({
        userId,
        amount: -beanCost,
        reason: `兑换${prizeName}`,
        sourceType: 'exchange',
        balanceAfter: newBalance,
      });

      // 4. 创建兑换订单
      const orders = await tx
        .insert(exchangeOrder)
        .values({
          userId,
          prizeId,
          beanCost,
          receiverName,
          receiverPhone,
          address,
          status: 'pending',
        })
        .returning({ id: exchangeOrder.id });

      this.logger.log(`兑换成功：订单 ${orders[0].id}，消耗 ${beanCost} 豆`);

      return {
        success: true,
        orderId: orders[0].id,
        beanCost,
        newBalance,
      };
    });
  }

}
