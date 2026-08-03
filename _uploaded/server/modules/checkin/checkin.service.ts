import { Inject, Injectable, Logger, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from "@lark-apaas/fullstack-nestjs-core";
import { eq, and, gte, lte, sql, inArray } from 'drizzle-orm';
import { checkinRecord, beanTransaction, userLearningProfile } from '@server/database/schema';
import type {
  UserLearningProfile,
  DailyTasksResponse,
  DailyTask,
  CheckinStatus,
  CheckinStats,
} from '@shared/api.interface';

interface DailyTaskDef {
  id: string;
  module: string;
  name: string;
  beanReward: number;
}

const DAILY_TASKS: DailyTaskDef[] = [
  { id: 'literacy', module: 'literacy', name: '识字小达人', beanReward: 10 },
  { id: 'pinyin', module: 'pinyin', name: '拼音小能手', beanReward: 10 },
  { id: 'poetry', module: 'poetry', name: '古诗小博士', beanReward: 10 },
  { id: 'english', module: 'english', name: '英语小明星', beanReward: 10 },
  { id: 'math', module: 'math', name: '数学小天才', beanReward: 10 },
  { id: 'science', module: 'science', name: '科普小探索家', beanReward: 10 },
];

const TASK_DESCRIPTIONS: Record<string, string> = {
  literacy: '学习5个汉字',
  pinyin: '完成10道拼音练习',
  poetry: '背诵1首古诗',
  english: '学习10个单词',
  math: '完成10道数学题',
  science: '阅读1篇科普文章',
};

const STREAK_REWARDS: Record<number, number> = {
  3: 20,
  7: 50,
  30: 200,
};

@Injectable()
export class CheckinService {
  private readonly logger = new Logger(CheckinService.name);

  constructor(@Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase) {}

  /**
   * 获取或创建用户学习档案
   */
  async getOrCreateProfile(userId: string): Promise<UserLearningProfile> {
    const profiles = await this.db
      .select()
      .from(userLearningProfile)
      .where(eq(userLearningProfile.userId, userId))
      .limit(1);

    if (profiles.length > 0) {
      const p = profiles[0];
      return {
        userId: p.userId,
        beanBalance: p.beanBalance,
        currentStreak: p.currentStreak,
        totalCheckinDays: p.totalCheckinDays,
        totalStudyTime: p.totalStudyTime,
      };
    }

    // 自动创建初始记录
    const inserted = await this.db
      .insert(userLearningProfile)
      .values({
        userId,
        beanBalance: 0,
        currentStreak: 0,
        totalCheckinDays: 0,
        totalStudyTime: 0,
      })
      .returning();

    const p = inserted[0];
    this.logger.log(`Created new learning profile for user ${userId}`);
    return {
      userId: p.userId,
      beanBalance: p.beanBalance,
      currentStreak: p.currentStreak,
      totalCheckinDays: p.totalCheckinDays,
      totalStudyTime: p.totalStudyTime,
    };
  }

  /**
   * 获取今日任务列表
   */
  async getDailyTasks(userId: string): Promise<DailyTasksResponse> {
    const today = this.getTodayString();
    const records = await this.db
      .select()
      .from(checkinRecord)
      .where(
        and(
          eq(checkinRecord.userId, userId),
          eq(checkinRecord.checkinDate, sql`${today}::date`),
        ),
      )
      .limit(1);

    let completedTasks: string[] = [];
    let status: CheckinStatus = 'none';

    if (records.length > 0) {
      const record = records[0];
      try {
        completedTasks = JSON.parse(record.completedTasks || '[]') as string[];
      } catch {
        completedTasks = [];
      }
      status = record.status as CheckinStatus;
    }

    const tasks: DailyTask[] = DAILY_TASKS.map((task: DailyTaskDef) => ({
      ...task,
      completed: completedTasks.includes(task.id),
    }));

    return { date: today, tasks, status };
  }

  /**
   * 完成每日任务
   */
  async completeTask(
    userId: string,
    taskId: string,
    module: string,
  ): Promise<{
    success: boolean;
    beanEarned: number;
    newBalance: number;
    streakUpdated: boolean;
  }> {
    const today = this.getTodayString();
    const taskDef = DAILY_TASKS.find((t: DailyTaskDef) => t.id === taskId);
    if (!taskDef) {
      throw new BadRequestException('任务不存在');
    }

    const result = await this.db.transaction(async (tx) => {
      // 1. 获取或创建今日打卡记录
      let records = await tx
        .select()
        .from(checkinRecord)
        .where(
          and(
            eq(checkinRecord.userId, userId),
            eq(checkinRecord.checkinDate, sql`${today}::date`),
          ),
        )
        .limit(1);

      let record = records[0];
      let completedTasks: string[] = [];

      if (record) {
        try {
          completedTasks = JSON.parse(record.completedTasks || '[]') as string[];
        } catch {
          completedTasks = [];
        }
      } else {
        const inserted = await tx
          .insert(checkinRecord)
          .values({
            userId,
            checkinDate: sql`${today}::date`,
            completedTasks: '[]',
            status: 'none',
            streakDays: 0,
          })
          .returning();
        record = inserted[0];
      }

      // 检查是否已完成
      if (completedTasks.includes(taskId)) {
        throw new BadRequestException('该任务今日已完成');
      }

      // 2. 添加任务到已完成列表
      completedTasks.push(taskId);
      const newStatus: CheckinStatus =
        completedTasks.length === DAILY_TASKS.length
          ? 'full'
          : completedTasks.length > 0
            ? 'partial'
            : 'none';

      let streakDays = record.streakDays;
      let streakUpdated = false;
      let streakBonus = 0;
      let totalCheckinIncrement = 0;

      // 3. 如果全部完成，计算连续打卡
      if (newStatus === 'full' && record.status !== 'full') {
        // 检查昨天是否 full
        const yesterday = this.getYesterdayString();
        const yesterdayRecords = await tx
          .select()
          .from(checkinRecord)
          .where(
            and(
              eq(checkinRecord.userId, userId),
              eq(checkinRecord.checkinDate, sql`${yesterday}::date`),
            ),
          )
          .limit(1);

        if (yesterdayRecords.length > 0 && yesterdayRecords[0].status === 'full') {
          streakDays = yesterdayRecords[0].streakDays + 1;
        } else {
          streakDays = 1;
        }
        streakUpdated = true;
        totalCheckinIncrement = 1;

        // 检查连续打卡奖励
        if (STREAK_REWARDS[streakDays]) {
          streakBonus = STREAK_REWARDS[streakDays];
        }
      }

      // 更新打卡记录
      await tx
        .update(checkinRecord)
        .set({
          completedTasks: JSON.stringify(completedTasks),
          status: newStatus,
          streakDays,
        })
        .where(eq(checkinRecord.id, record.id));

      // 4. 获取当前余额并更新
      const profiles = await tx
        .select()
        .from(userLearningProfile)
        .where(eq(userLearningProfile.userId, userId))
        .limit(1);

      let profile = profiles[0];
      if (!profile) {
        const inserted = await tx
          .insert(userLearningProfile)
          .values({
            userId,
            beanBalance: 0,
            currentStreak: 0,
            totalCheckinDays: 0,
            totalStudyTime: 0,
          })
          .returning();
        profile = inserted[0];
      }

      const beanEarned = taskDef.beanReward + streakBonus;
      const newBalance = profile.beanBalance + beanEarned;
      const newStreak = streakUpdated ? streakDays : profile.currentStreak;
      const newTotalCheckin = profile.totalCheckinDays + totalCheckinIncrement;

      await tx
        .update(userLearningProfile)
        .set({
          beanBalance: newBalance,
          currentStreak: newStreak,
          totalCheckinDays: newTotalCheckin,
        })
        .where(eq(userLearningProfile.id, profile.id));

      // 5. 记录学习豆流水 - 任务奖励
      await tx.insert(beanTransaction).values({
        userId,
        amount: taskDef.beanReward,
        reason: `完成${taskDef.name}任务`,
        sourceType: 'task',
        balanceAfter: newBalance - streakBonus,
      });

      // 6. 记录连续打卡奖励流水
      if (streakBonus > 0) {
        await tx.insert(beanTransaction).values({
          userId,
          amount: streakBonus,
          reason: `连续打卡${streakDays}天奖励`,
          sourceType: 'streak',
          balanceAfter: newBalance,
        });
      }

      return {
        success: true,
        beanEarned,
        newBalance,
        streakUpdated,
      };
    });

    this.logger.log(
      `User ${userId} completed task ${taskId}, earned ${result.beanEarned} beans`,
    );
    return result;
  }

  /**
   * 获取打卡统计
   */
  async getCheckinStats(userId: string): Promise<CheckinStats> {
    const profile = await this.getOrCreateProfile(userId);

    // 计算本月完成率
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const firstDay = new Date(year, month, 1);
    const daysPassed = today.getDate();

    const firstDayStr = this.formatDate(firstDay);
    const todayStr = this.getTodayString();

    const fullDays = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(checkinRecord)
      .where(
        and(
          eq(checkinRecord.userId, userId),
          eq(checkinRecord.status, 'full'),
          gte(checkinRecord.checkinDate, sql`${firstDayStr}::date`),
          lte(checkinRecord.checkinDate, sql`${todayStr}::date`),
        ),
      );

    const fullCount = Number(fullDays[0]?.count ?? 0);
    const monthCompleteRate = daysPassed > 0 ? fullCount / daysPassed : 0;

    return {
      currentStreak: profile.currentStreak,
      totalCheckinDays: profile.totalCheckinDays,
      monthCompleteRate: Math.round(monthCompleteRate * 100) / 100,
    };
  }

  /**
   * 获取月历打卡数据
   */
  async getCalendar(
    userId: string,
    year: number,
    month: number,
  ): Promise<{
    year: number;
    month: number;
    days: Array<{ date: string; status: CheckinStatus; canSupplement: boolean }>;
  }> {
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const daysInMonth = lastDay.getDate();

    const firstDayStr = this.formatDate(firstDay);
    const lastDayStr = this.formatDate(lastDay);

    const records = await this.db
      .select()
      .from(checkinRecord)
      .where(
        and(
          eq(checkinRecord.userId, userId),
          gte(checkinRecord.checkinDate, sql`${firstDayStr}::date`),
          lte(checkinRecord.checkinDate, sql`${lastDayStr}::date`),
        ),
      );

    const recordMap = new Map<string, CheckinStatus>();
    for (const record of records) {
      const dateStr = this.formatDate(new Date(record.checkinDate as string));
      recordMap.set(dateStr, record.status as CheckinStatus);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const days: Array<{ date: string; status: CheckinStatus; canSupplement: boolean }> = [];
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month - 1, i);
      const dateStr = this.formatDate(date);
      const status = recordMap.get(dateStr) || 'none';

      // 可补签条件：过去30天内、未完成(full)、不是今天之后
      const isPast = date < today;
      const isWithin30Days = date >= thirtyDaysAgo;
      const isNotFull = status !== 'full';
      const canSupplement = isPast && isWithin30Days && isNotFull;

      days.push({ date: dateStr, status, canSupplement });
    }

    return { year, month, days };
  }

  /**
   * 补打卡
   */
  async supplementCheckin(
    userId: string,
    dateStr: string,
  ): Promise<{
    success: boolean;
    beanCost: number;
    newBalance: number;
    newStatus: CheckinStatus;
  }> {
    const beanCost = 20;
    const targetDate = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    targetDate.setHours(0, 0, 0, 0);

    // 检查日期是否在过去30天内
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    if (targetDate >= today) {
      throw new BadRequestException('不能补签未来或今天的日期');
    }
    if (targetDate < thirtyDaysAgo) {
      throw new BadRequestException('只能补签过去30天内的日期');
    }

    const result = await this.db.transaction(async (tx) => {
      // 1. 获取用户档案
      const profiles = await tx
        .select()
        .from(userLearningProfile)
        .where(eq(userLearningProfile.userId, userId))
        .limit(1);

      if (profiles.length === 0) {
        throw new NotFoundException('用户档案不存在');
      }
      const profile = profiles[0];

      if (profile.beanBalance < beanCost) {
        throw new ConflictException('学习豆不足，无法补签');
      }

      // 2. 检查当日打卡状态
      let records = await tx
        .select()
        .from(checkinRecord)
        .where(
          and(
            eq(checkinRecord.userId, userId),
            eq(checkinRecord.checkinDate, sql`${dateStr}::date`),
          ),
        )
        .limit(1);

      if (records.length > 0 && records[0].status === 'full') {
        throw new BadRequestException('该日期已完成打卡，无需补签');
      }

      // 3. 更新或创建打卡记录为 full
      if (records.length > 0) {
        await tx
          .update(checkinRecord)
          .set({ status: 'full' })
          .where(eq(checkinRecord.id, records[0].id));
      } else {
        await tx.insert(checkinRecord).values({
          userId,
          checkinDate: sql`${dateStr}::date`,
          completedTasks: JSON.stringify(DAILY_TASKS.map((t: DailyTaskDef) => t.id)),
          status: 'full',
          streakDays: 0,
        });
      }

      // 4. 扣除学习豆
      const newBalance = profile.beanBalance - beanCost;
      await tx
        .update(userLearningProfile)
        .set({ beanBalance: newBalance })
        .where(eq(userLearningProfile.id, profile.id));

      // 5. 记录流水
      await tx.insert(beanTransaction).values({
        userId,
        amount: -beanCost,
        reason: `补打卡(${dateStr})`,
        sourceType: 'supplement',
        balanceAfter: newBalance,
      });

      return {
        success: true,
        beanCost,
        newBalance,
        newStatus: 'full' as CheckinStatus,
      };
    });

    this.logger.log(
      `User ${userId} supplemented checkin for ${dateStr}, cost ${beanCost} beans`,
    );
    return result;
  }

  /**
   * 获取某日任务详情
   */
  async getDayDetail(
    userId: string,
    dateStr: string,
  ): Promise<{
    date: string;
    status: CheckinStatus;
    completedTasks: string[];
    allTasks: DailyTask[];
  }> {
    const records = await this.db
      .select()
      .from(checkinRecord)
      .where(
        and(
          eq(checkinRecord.userId, userId),
          eq(checkinRecord.checkinDate, sql`${dateStr}::date`),
        ),
      )
      .limit(1);

    let completedTasks: string[] = [];
    let status: CheckinStatus = 'none';

    if (records.length > 0) {
      const record = records[0];
      try {
        completedTasks = JSON.parse(record.completedTasks || '[]') as string[];
      } catch {
        completedTasks = [];
      }
      status = record.status as CheckinStatus;
    }

    const allTasks: DailyTask[] = DAILY_TASKS.map((task: DailyTaskDef) => ({
      ...task,
      completed: completedTasks.includes(task.id),
    }));

    return { date: dateStr, status, completedTasks, allTasks };
  }

  private getTodayString(): string {
    return this.formatDate(new Date());
  }

  private getYesterdayString(): string {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return this.formatDate(yesterday);
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
