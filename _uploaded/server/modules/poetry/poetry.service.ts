import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import {
  DRIZZLE_DATABASE,
  type PostgresJsDatabase,
} from '@lark-apaas/fullstack-nestjs-core';
import { eq, and, asc, sql, count } from 'drizzle-orm';
import { poem, poetryProgress } from '@server/database/schema';
import type {
  Poem,
  FillBlankQuestion,
  PoetryProgress,
} from '@shared/api.interface';

export interface PoemWithProgress {
  id: string;
  title: string;
  author: string;
  difficulty: number;
  isRecited: boolean;
  recitedCount: number;
}

export interface PoetryListResponse {
  poems: PoemWithProgress[];
  total: number;
  recitedCount: number;
}

export interface ReciteResult {
  success: boolean;
  isRecited: boolean;
  recitedCount: number;
}

@Injectable()
export class PoetryService {
  private readonly logger = new Logger(PoetryService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  async getPoetryList(userId: string): Promise<PoetryListResponse> {
    this.logger.log(`获取古诗列表, userId=${userId}`);

    const poems = await this.db
      .select({
        id: poem.id,
        title: poem.title,
        author: poem.author,
        difficulty: poem.difficulty,
        isRecited: poetryProgress.isRecited,
        recitedCount: poetryProgress.recitedCount,
      })
      .from(poem)
      .leftJoin(
        poetryProgress,
        and(
          eq(poem.id, poetryProgress.poemId),
          eq(poetryProgress.userId, userId),
        ),
      )
      .orderBy(asc(poem.difficulty), asc(poem.title));

    const total = poems.length;
    const recitedCount = poems.filter(
      (p: { isRecited: boolean | null }) => p.isRecited === true,
    ).length;

    const result: PoemWithProgress[] = poems.map(
      (p: {
        id: string;
        title: string;
        author: string;
        difficulty: number;
        isRecited: boolean | null;
        recitedCount: number | null;
      }) => ({
        id: p.id,
        title: p.title,
        author: p.author,
        difficulty: p.difficulty,
        isRecited: p.isRecited ?? false,
        recitedCount: p.recitedCount ?? 0,
      }),
    );

    return { poems: result, total, recitedCount };
  }

  async getPoemDetail(id: string): Promise<Poem> {
    this.logger.log(`获取古诗详情, id=${id}`);

    const result = await this.db.select().from(poem).where(eq(poem.id, id));

    if (result.length === 0) {
      throw new NotFoundException('古诗不存在');
    }

    const row = result[0];
    return {
      id: row.id,
      title: row.title,
      author: row.author,
      content: row.content.split('\n').filter((line: string) => line.trim()),
      pinyinContent: row.pinyinContent
        .split('\n')
        .filter((line: string) => line.trim()),
      translation: row.translation,
      illustration: row.illustration,
      difficulty: row.difficulty,
    };
  }

  async getFillBlankQuestions(poemId: string): Promise<{
    questions: FillBlankQuestion[];
  }> {
    this.logger.log(`生成填空题, poemId=${poemId}`);

    const poemData = await this.getPoemDetail(poemId);
    const lines = poemData.content;
    const questions: FillBlankQuestion[] = [];

    // 随机选择2-3句
    const lineCount = Math.min(
      lines.length,
      Math.floor(Math.random() * 2) + 2,
    );
    const lineIndices = this.shuffleArray(
      lines.map((_: string, i: number) => i),
    ).slice(0, lineCount);

    for (const lineIndex of lineIndices) {
      const line = lines[lineIndex];
      const chars = Array.from(line);
      // 每句挖空1-2个字（跳过标点符号）
      const validIndices: number[] = [];
      for (let i = 0; i < chars.length; i++) {
        if (/[\u4e00-\u9fa5]/.test(chars[i])) {
          validIndices.push(i);
        }
      }
      if (validIndices.length === 0) continue;

      const blankCount = Math.min(
        validIndices.length,
        Math.floor(Math.random() * 2) + 1,
      );
      const chosen = this.shuffleArray(validIndices).slice(0, blankCount);

      for (const blankIndex of chosen) {
        const answer = chars[blankIndex];
        // hint: 显示整句，挖空位置用□代替
        const hintChars = [...chars];
        hintChars[blankIndex] = '□';
        const hint = hintChars.join('');

        questions.push({
          lineIndex,
          blankIndex,
          answer,
          hint,
        });
      }
    }

    return { questions };
  }

  async recitePoem(userId: string, poemId: string): Promise<ReciteResult> {
    this.logger.log(`背诵打卡, userId=${userId}, poemId=${poemId}`);

    // 检查诗是否存在
    const poemExists = await this.db
      .select({ count: count() })
      .from(poem)
      .where(eq(poem.id, poemId));

    if (Number(poemExists[0].count) === 0) {
      throw new NotFoundException('古诗不存在');
    }

    // 查找现有进度
    const existing = await this.db
      .select()
      .from(poetryProgress)
      .where(
        and(
          eq(poetryProgress.userId, userId),
          eq(poetryProgress.poemId, poemId),
        ),
      );

    let result: { isRecited: boolean; recitedCount: number };

    if (existing.length > 0) {
      const updated = await this.db
        .update(poetryProgress)
        .set({
          isRecited: true,
          recitedCount: sql`${poetryProgress.recitedCount} + 1`,
          lastRecitedAt: sql`CURRENT_TIMESTAMP`,
        })
        .where(
          and(
            eq(poetryProgress.userId, userId),
            eq(poetryProgress.poemId, poemId),
          ),
        )
        .returning({
          isRecited: poetryProgress.isRecited,
          recitedCount: poetryProgress.recitedCount,
        });
      result = updated[0];
    } else {
      const inserted = await this.db
        .insert(poetryProgress)
        .values({
          userId,
          poemId,
          isRecited: true,
          recitedCount: 1,
          lastRecitedAt: sql`CURRENT_TIMESTAMP`,
        })
        .returning({
          isRecited: poetryProgress.isRecited,
          recitedCount: poetryProgress.recitedCount,
        });
      result = inserted[0];
    }

    return {
      success: true,
      isRecited: result.isRecited,
      recitedCount: result.recitedCount,
    };
  }

  private shuffleArray<T>(arr: T[]): T[] {
    const result = [...arr];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
}
