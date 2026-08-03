import { Inject, Injectable, Logger } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { eq, and, sql, count } from 'drizzle-orm';
import { englishItem, englishProgress } from '@server/database/schema';
import type {
  EnglishCategory,
  EnglishItem,
  EnglishLevel,
  EnglishProgress,
} from '@shared/api.interface';

@Injectable()
export class EnglishService {
  private readonly logger = new Logger(EnglishService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  async getItems(
    category: EnglishCategory,
    subcategory: string | undefined,
    level: EnglishLevel,
  ): Promise<{ category: EnglishCategory; subcategory?: string; level: EnglishLevel; items: EnglishItem[] }> {
    const conditions = [eq(englishItem.category, category), eq(englishItem.level, level)];
    if (subcategory) {
      conditions.push(eq(englishItem.subcategory, subcategory));
    }

    const rows = await this.db
      .select({
        id: englishItem.id,
        category: englishItem.category,
        subcategory: englishItem.subcategory,
        content: englishItem.content,
        meaning: englishItem.meaning,
        imageHint: englishItem.imageHint,
        level: englishItem.level,
      })
      .from(englishItem)
      .where(and(...conditions))
      .orderBy(englishItem.content);

    this.logger.log(`getItems: category=${category}, level=${level}, count=${rows.length}`);

    return {
      category,
      subcategory,
      level,
      items: rows as EnglishItem[],
    };
  }

  async getProgress(userId: string, level: EnglishLevel): Promise<{ level: EnglishLevel; categories: EnglishProgress[] }> {
    // Get total counts per category
    const totalRows = await this.db
      .select({
        category: englishItem.category,
        totalCount: count(),
      })
      .from(englishItem)
      .where(eq(englishItem.level, level))
      .groupBy(englishItem.category);

    // Get learned counts per category
    const learnedRows = await this.db
      .select({
        category: englishItem.category,
        learnedCount: count(),
      })
      .from(englishProgress)
      .innerJoin(englishItem, eq(englishProgress.itemId, englishItem.id))
      .where(
        and(
          eq(englishProgress.userId, userId),
          eq(englishProgress.level, level),
          eq(englishProgress.isLearned, true),
        ),
      )
      .groupBy(englishItem.category);

    // Get correct count per category
    const correctRows = await this.db
      .select({
        category: englishItem.category,
        totalCorrect: sql<number>`SUM(${englishProgress.correctCount})`,
        totalAttempts: count(),
      })
      .from(englishProgress)
      .innerJoin(englishItem, eq(englishProgress.itemId, englishItem.id))
      .where(
        and(
          eq(englishProgress.userId, userId),
          eq(englishProgress.level, level),
        ),
      )
      .groupBy(englishItem.category);

    const categories: EnglishCategory[] = ['alphabet', 'word', 'sentence'];
    const result: EnglishProgress[] = categories.map((cat: EnglishCategory) => {
      const total = Number(totalRows.find((r: { category: string }) => r.category === cat)?.totalCount ?? 0);
      const learned = Number(learnedRows.find((r: { category: string }) => r.category === cat)?.learnedCount ?? 0);
      const correctRow = correctRows.find((r: { category: string }) => r.category === cat);
      const attempts = correctRow ? Number(correctRow.totalAttempts) : 0;
      const correctCount = correctRow ? Number(correctRow.totalCorrect) : 0;
      const correctRate = attempts > 0 ? Math.round((correctCount / attempts) * 100) : 0;

      return {
        category: cat,
        learnedCount: learned,
        totalCount: total,
        correctRate,
      };
    });

    this.logger.log(`getProgress: userId=${userId}, level=${level}`);

    return { level, categories: result };
  }

  async submitPractice(
    userId: string,
    itemId: string,
    level: EnglishLevel,
    correct: boolean,
  ): Promise<{ success: boolean }> {
    // Check if record exists
    const existing = await this.db
      .select()
      .from(englishProgress)
      .where(
        and(
          eq(englishProgress.userId, userId),
          eq(englishProgress.itemId, itemId),
        ),
      )
      .limit(1);

    if (existing.length > 0) {
      await this.db
        .update(englishProgress)
        .set({
          isLearned: true,
          correctCount: sql`${englishProgress.correctCount} + ${correct ? 1 : 0}`,
        })
        .where(eq(englishProgress.id, existing[0].id));
    } else {
      await this.db.insert(englishProgress).values({
        userId,
        itemId,
        level,
        isLearned: true,
        correctCount: correct ? 1 : 0,
      });
    }

    this.logger.log(
      `submitPractice: userId=${userId}, itemId=${itemId}, level=${level}, correct=${correct}`,
    );

    return { success: true };
  }
}
