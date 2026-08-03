import { Inject, Injectable, Logger } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { eq, and, inArray, sql } from 'drizzle-orm';
import type { MathCategory, MathCategoryProgress, MathQuestion, MathStats } from '@shared/api.interface';
import { mathProgress, mathQuestion } from '@server/database/schema';

interface PracticeResultItem {
  questionId: string;
  correct: boolean;
  timeSpent: number;
}

interface PracticeResult {
  category: MathCategory;
  results: PracticeResultItem[];
}

const CATEGORY_NAMES: Record<MathCategory, string> = {
  addition_subtraction_10: '10以内加减',
  addition_subtraction_20: '20以内加减',
  number_sense: '数感认知',
  comparison: '比大小',
  clock: '钟表认识',
  shape: '图形认知',
  pattern: '找规律',
};

const ALL_CATEGORIES: MathCategory[] = [
  'addition_subtraction_10',
  'addition_subtraction_20',
  'number_sense',
  'comparison',
  'clock',
  'shape',
  'pattern',
];

@Injectable()
export class MathService {
  private readonly logger = new Logger(MathService.name);

  constructor(@Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase) {}

  async getCategories(userId: string): Promise<{ categories: MathCategoryProgress[] }> {
    const rows = await this.db.select().from(mathProgress).where(eq(mathProgress.userId, userId));

    const progressMap = new Map<string, { correctCount: number; totalCount: number }>();
    for (const row of rows) {
      progressMap.set(row.category, {
        correctCount: row.correctCount,
        totalCount: row.totalCount,
      });
    }

    const categories: MathCategoryProgress[] = ALL_CATEGORIES.map((key: MathCategory) => {
      const p = progressMap.get(key);
      const correctCount = p?.correctCount ?? 0;
      const totalCount = p?.totalCount ?? 0;
      const accuracy = totalCount > 0 ? correctCount / totalCount : 0;
      return {
        key,
        name: CATEGORY_NAMES[key],
        correctCount,
        totalCount,
        accuracy,
      };
    });

    return { categories };
  }

  async getQuestions(
    category: MathCategory,
    count: number,
    type?: string,
  ): Promise<{ questions: MathQuestion[] }> {
    const conditions = [eq(mathQuestion.category, category)];
    if (type) {
      conditions.push(eq(mathQuestion.questionType, type));
    }

    const rows = await this.db
      .select()
      .from(mathQuestion)
      .where(and(...conditions))
      .orderBy(sql`RANDOM()`)
      .limit(count);

    const questions: MathQuestion[] = rows.map((row) => {
      let options: string[] = [];
      try {
        options = JSON.parse(row.options) as string[];
      } catch {
        options = [];
      }
      return {
        id: row.id,
        category: row.category as MathCategory,
        questionType: row.questionType as MathQuestion['questionType'],
        questionText: row.questionText,
        options: options.length > 0 ? options : undefined,
        answer: row.answer,
        explanation: row.explanation,
        difficulty: row.difficulty,
      };
    });

    return { questions };
  }

  async submitPractice(
    userId: string,
    body: PracticeResult,
  ): Promise<{ success: boolean; correctCount: number; totalCount: number; accuracy: number }> {
    const { category, results } = body;
    const correctCount = results.filter((r: PracticeResultItem) => r.correct).length;
    const totalCount = results.length;
    const totalTime = results.reduce((sum: number, r: PracticeResultItem) => sum + (r.timeSpent || 0), 0);

    this.logger.log(
      `用户 ${userId} 提交 ${category} 练习: 正确 ${correctCount}/${totalCount}, 耗时 ${totalTime}s`,
    );

    // Upsert: 先查是否存在
    const existing = await this.db
      .select()
      .from(mathProgress)
      .where(and(eq(mathProgress.userId, userId), eq(mathProgress.category, category)));

    if (existing.length > 0) {
      await this.db
        .update(mathProgress)
        .set({
          correctCount: existing[0].correctCount + correctCount,
          totalCount: existing[0].totalCount + totalCount,
          todayPracticeTime: existing[0].todayPracticeTime + totalTime,
        })
        .where(and(eq(mathProgress.userId, userId), eq(mathProgress.category, category)));
    } else {
      await this.db.insert(mathProgress).values({
        userId,
        category,
        correctCount,
        totalCount,
        todayPracticeTime: totalTime,
      });
    }

    const newCorrect = (existing[0]?.correctCount ?? 0) + correctCount;
    const newTotal = (existing[0]?.totalCount ?? 0) + totalCount;
    const accuracy = newTotal > 0 ? newCorrect / newTotal : 0;

    return {
      success: true,
      correctCount: newCorrect,
      totalCount: newTotal,
      accuracy,
    };
  }

  async getStats(userId: string): Promise<MathStats> {
    const rows = await this.db.select().from(mathProgress).where(eq(mathProgress.userId, userId));

    let totalPractice = 0;
    let totalCorrect = 0;
    let todayPracticeTime = 0;

    for (const row of rows) {
      totalPractice += row.totalCount;
      totalCorrect += row.correctCount;
      todayPracticeTime += row.todayPracticeTime;
    }

    const overallAccuracy = totalPractice > 0 ? totalCorrect / totalPractice : 0;

    return {
      totalPractice,
      overallAccuracy,
      todayPracticeTime,
    };
  }
}
