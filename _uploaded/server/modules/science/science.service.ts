import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { Inject } from '@nestjs/common';
import { scienceArticle, scienceProgress } from '@server/database/schema';
import type {
  ScienceArticle,
  ScienceCategory,
  ScienceProgressStats,
} from '@shared/api.interface';

export interface ArticleWithProgress {
  id: string;
  title: string;
  imageHint: string;
  isRead: boolean;
  quizCorrect: boolean | null;
}

export interface CategoryGroup {
  category: ScienceCategory;
  articles: ArticleWithProgress[];
}

@Injectable()
export class ScienceService {
  private readonly logger = new Logger(ScienceService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  async getArticles(
    userId: string,
    category?: string,
  ): Promise<CategoryGroup[]> {
    this.logger.log(`获取科普文章列表, userId=${userId}, category=${category ?? 'all'}`);

    const articles = category
      ? await this.db
          .select()
          .from(scienceArticle)
          .where(eq(scienceArticle.category, category))
      : await this.db.select().from(scienceArticle);

    const progresses = await this.db
      .select()
      .from(scienceProgress)
      .where(eq(scienceProgress.userId, userId));

    const progressMap = new Map<string, { isRead: boolean; quizCorrect: boolean | null }>();
    for (const p of progresses) {
      progressMap.set(p.articleId, {
        isRead: p.isRead,
        quizCorrect: p.quizCorrect ?? null,
      });
    }

    const byCategory = new Map<string, ArticleWithProgress[]>();
    for (const a of articles) {
      const cat = a.category as ScienceCategory;
      const prog = progressMap.get(a.id) ?? { isRead: false, quizCorrect: null };
      const item: ArticleWithProgress = {
        id: a.id,
        title: a.title,
        imageHint: a.imageHint,
        isRead: prog.isRead,
        quizCorrect: prog.quizCorrect,
      };
      if (!byCategory.has(cat)) {
        byCategory.set(cat, []);
      }
      byCategory.get(cat)!.push(item);
    }

    const result: CategoryGroup[] = [];
    for (const [cat, list] of byCategory) {
      result.push({ category: cat as ScienceCategory, articles: list });
    }
    return result;
  }

  async getArticleDetail(id: string): Promise<ScienceArticle> {
    this.logger.log(`获取文章详情, id=${id}`);
    const rows = await this.db
      .select()
      .from(scienceArticle)
      .where(eq(scienceArticle.id, id));

    if (rows.length === 0) {
      throw new NotFoundException('文章不存在');
    }

    const row = rows[0];
    let parsedQuestions: Array<{ question: string; options: string[]; answer: number }> = [];
    try {
      parsedQuestions = JSON.parse(row.questions);
    } catch (e) {
      this.logger.error(`解析 questions 失败, id=${id}, error=${JSON.stringify(e)}`);
    }

    return {
      id: row.id,
      category: row.category as ScienceCategory,
      title: row.title,
      content: row.content,
      imageHint: row.imageHint,
      questions: parsedQuestions,
    };
  }

  async submitQuiz(
    userId: string,
    articleId: string,
    correct: boolean,
  ): Promise<{ success: boolean }> {
    this.logger.log(
      `提交问答结果, userId=${userId}, articleId=${articleId}, correct=${correct}`,
    );

    const existing = await this.db
      .select()
      .from(scienceProgress)
      .where(
        and(
          eq(scienceProgress.userId, userId),
          eq(scienceProgress.articleId, articleId),
        ),
      );

    if (existing.length > 0) {
      await this.db
        .update(scienceProgress)
        .set({ isRead: true, quizCorrect: correct })
        .where(
          and(
            eq(scienceProgress.userId, userId),
            eq(scienceProgress.articleId, articleId),
          ),
        );
    } else {
      await this.db.insert(scienceProgress).values({
        userId,
        articleId,
        isRead: true,
        quizCorrect: correct,
      });
    }

    return { success: true };
  }

  async getProgressStats(userId: string): Promise<ScienceProgressStats> {
    this.logger.log(`获取阅读进度统计, userId=${userId}`);

    const allArticles = await this.db.select().from(scienceArticle);
    const progresses = await this.db
      .select()
      .from(scienceProgress)
      .where(eq(scienceProgress.userId, userId));

    const progressMap = new Map<string, boolean>();
    for (const p of progresses) {
      if (p.isRead) progressMap.set(p.articleId, true);
    }

    const totalArticles = allArticles.length;
    const totalRead = allArticles.filter((a) => progressMap.has(a.id)).length;

    const categoryTotals = new Map<string, number>();
    const categoryReads = new Map<string, number>();
    for (const a of allArticles) {
      const cat = a.category;
      categoryTotals.set(cat, (categoryTotals.get(cat) ?? 0) + 1);
      if (progressMap.has(a.id)) {
        categoryReads.set(cat, (categoryReads.get(cat) ?? 0) + 1);
      }
    }

    const byCategory: Array<{
      category: ScienceCategory;
      readCount: number;
      totalCount: number;
    }> = [];
    for (const [cat, total] of categoryTotals) {
      byCategory.push({
        category: cat as ScienceCategory,
        readCount: categoryReads.get(cat) ?? 0,
        totalCount: total,
      });
    }

    return {
      totalRead,
      totalArticles,
      byCategory,
    };
  }
}
