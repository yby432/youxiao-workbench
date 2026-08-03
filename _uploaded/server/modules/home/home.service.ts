import { Inject, Injectable, Logger } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from "@lark-apaas/fullstack-nestjs-core";
import { eq, and, sql, count } from 'drizzle-orm';
import {
  userLearningProfile,
  checkinRecord,
  chineseCharacter,
  literacyProgress,
  pinyinProgress,
  poetryProgress,
  poem,
  englishProgress,
  englishItem,
  mathProgress,
  mathQuestion,
  scienceProgress,
  scienceArticle,
} from '@server/database/schema';
import type {
  HomeSummary,
  ModuleSummary,
  UserLearningProfile,
  DailyTask,
} from '@shared/api.interface';

interface ModuleMeta {
  key: string;
  name: string;
  color: string;
  icon: string;
}

const MODULE_META: ModuleMeta[] = [
  { key: 'literacy', name: '识字', color: '#A8E6C8', icon: 'BookOpen' },
  { key: 'pinyin', name: '拼音', color: '#D4C5F0', icon: 'Music' },
  { key: 'poetry', name: '古诗', color: '#F5C9A0', icon: 'Feather' },
  { key: 'english', name: '英语', color: '#A8DDE6', icon: 'Globe' },
  { key: 'math', name: '数学', color: '#A8C8E6', icon: 'Calculator' },
  { key: 'science', name: '科普', color: '#F5E6A0', icon: 'Lightbulb' },
];

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

@Injectable()
export class HomeService {
  private readonly logger = new Logger(HomeService.name);

  constructor(@Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase) {}

  /**
   * 获取首页聚合数据
   */
  async getHomeSummary(userId: string): Promise<HomeSummary> {
    const [profile, modules, dailyTasks] = await Promise.all([
      this.getProfile(userId),
      this.getModulesSummary(userId),
      this.getDailyTasks(userId),
    ]);

    return {
      profile: {
        beanBalance: profile.beanBalance,
        currentStreak: profile.currentStreak,
        totalCheckinDays: profile.totalCheckinDays,
      },
      modules,
      dailyTasks,
    };
  }

  /**
   * 获取或创建用户学习档案
   */
  private async getProfile(userId: string): Promise<UserLearningProfile> {
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
   * 获取6大模块学习概览
   */
  async getModulesSummary(userId: string): Promise<ModuleSummary[]> {
    const [literacyResult, pinyinResult, poetryResult, englishResult, mathResult, scienceResult, todayCompleted] =
      await Promise.all([
        this.getLiteracyProgress(userId),
        this.getPinyinProgress(userId),
        this.getPoetryProgress(userId),
        this.getEnglishProgress(userId),
        this.getMathProgress(userId),
        this.getScienceProgress(userId),
        this.getTodayCompletedTasks(userId),
      ]);

    const progressMap: Record<string, number> = {
      literacy: literacyResult,
      pinyin: pinyinResult,
      poetry: poetryResult,
      english: englishResult,
      math: mathResult,
      science: scienceResult,
    };

    return MODULE_META.map((meta: ModuleMeta) => ({
      key: meta.key,
      name: meta.name,
      progress: progressMap[meta.key] ?? 0,
      todayDone: todayCompleted.includes(meta.key),
      color: meta.color,
      icon: meta.icon,
    }));
  }

  /**
   * 识字进度：已掌握字数 / 总字数
   */
  private async getLiteracyProgress(userId: string): Promise<number> {
    const [totalResult, masteredResult] = await Promise.all([
      this.db.select({ count: count() }).from(chineseCharacter),
      this.db
        .select({ count: count() })
        .from(literacyProgress)
        .where(and(eq(literacyProgress.userId, userId), eq(literacyProgress.status, 'mastered'))),
    ]);
    const total = Number(totalResult[0].count);
    const mastered = Number(masteredResult[0].count);
    if (total === 0) return 0;
    return Math.round((mastered / total) * 100);
  }

  /**
   * 拼音进度：总正确数 / 总练习数
   */
  private async getPinyinProgress(userId: string): Promise<number> {
    const result = await this.db
      .select({
        correctCount: sql<number>`COALESCE(SUM(${pinyinProgress.correctCount}), 0)`,
        totalCount: sql<number>`COALESCE(SUM(${pinyinProgress.totalCount}), 0)`,
      })
      .from(pinyinProgress)
      .where(eq(pinyinProgress.userId, userId));

    const correct = Number(result[0].correctCount) || 0;
    const total = Number(result[0].totalCount) || 0;
    if (total === 0) return 0;
    return Math.round((correct / total) * 100);
  }

  /**
   * 古诗进度：已背诵数 / 总古诗数
   */
  private async getPoetryProgress(userId: string): Promise<number> {
    const [totalResult, recitedResult] = await Promise.all([
      this.db.select({ count: count() }).from(poem),
      this.db
        .select({ count: count() })
        .from(poetryProgress)
        .where(and(eq(poetryProgress.userId, userId), eq(poetryProgress.isRecited, true))),
    ]);
    const total = Number(totalResult[0].count);
    const recited = Number(recitedResult[0].count);
    if (total === 0) return 0;
    return Math.round((recited / total) * 100);
  }

  /**
   * 英语进度：已学数 / 总数
   */
  private async getEnglishProgress(userId: string): Promise<number> {
    const [totalResult, learnedResult] = await Promise.all([
      this.db.select({ count: count() }).from(englishItem),
      this.db
        .select({ count: count() })
        .from(englishProgress)
        .where(and(eq(englishProgress.userId, userId), eq(englishProgress.isLearned, true))),
    ]);
    const total = Number(totalResult[0].count);
    const learned = Number(learnedResult[0].count);
    if (total === 0) return 0;
    return Math.round((learned / total) * 100);
  }

  /**
   * 数学进度：总正确数 / 总题数
   */
  private async getMathProgress(userId: string): Promise<number> {
    const [totalResult, progressResult] = await Promise.all([
      this.db.select({ count: count() }).from(mathQuestion),
      this.db
        .select({
          correctCount: sql<number>`COALESCE(SUM(${mathProgress.correctCount}), 0)`,
          totalCount: sql<number>`COALESCE(SUM(${mathProgress.totalCount}), 0)`,
        })
        .from(mathProgress)
        .where(eq(mathProgress.userId, userId)),
    ]);
    const total = Number(totalResult[0].count);
    const correct = Number(progressResult[0].correctCount) || 0;
    const practiced = Number(progressResult[0].totalCount) || 0;
    if (total === 0) return 0;
    // 用已练习正确率 * 已练习比例 作为综合进度
    const practiceRatio = Math.min(practiced / total, 1);
    const accuracy = practiced > 0 ? correct / practiced : 0;
    return Math.round(practiceRatio * accuracy * 100);
  }

  /**
   * 科普进度：已读数 / 总文章数
   */
  private async getScienceProgress(userId: string): Promise<number> {
    const [totalResult, readResult] = await Promise.all([
      this.db.select({ count: count() }).from(scienceArticle),
      this.db
        .select({ count: count() })
        .from(scienceProgress)
        .where(and(eq(scienceProgress.userId, userId), eq(scienceProgress.isRead, true))),
    ]);
    const total = Number(totalResult[0].count);
    const read = Number(readResult[0].count);
    if (total === 0) return 0;
    return Math.round((read / total) * 100);
  }

  /**
   * 获取今日已完成的任务模块
   */
  private async getTodayCompletedTasks(userId: string): Promise<string[]> {
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

    if (records.length === 0) return [];
    try {
      return JSON.parse(records[0].completedTasks || '[]') as string[];
    } catch {
      return [];
    }
  }

  /**
   * 获取今日任务列表
   */
  private async getDailyTasks(userId: string): Promise<DailyTask[]> {
    const completed = await this.getTodayCompletedTasks(userId);
    return DAILY_TASKS.map((task: DailyTaskDef) => ({
      id: task.id,
      module: task.module,
      name: task.name,
      beanReward: task.beanReward,
      completed: completed.includes(task.id),
    }));
  }

  private getTodayString(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
