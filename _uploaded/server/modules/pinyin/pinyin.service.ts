import { Injectable, Logger } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { eq, and, sql } from 'drizzle-orm';
import { pinyinItem, pinyinProgress } from '@server/database/schema';
import type { PinyinCategory, PinyinItem, PinyinProgress, PinyinQuestion } from '@shared/api.interface';

@Injectable()
export class PinyinService {
  private readonly logger = new Logger(PinyinService.name);

  constructor(@Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase) {}

  async getItemsByCategory(category: PinyinCategory): Promise<{ category: PinyinCategory; items: PinyinItem[] }> {
    this.logger.log(`获取拼音列表: category=${category}`);
    const items = await this.db.select().from(pinyinItem).where(eq(pinyinItem.category, category));
    return {
      category,
      items: items.map((item) => ({
        id: item.id,
        category: item.category as PinyinCategory,
        content: item.content,
        example: item.example,
        audioHint: item.audioHint,
      })),
    };
  }

  async getProgress(userId: string): Promise<{ categories: PinyinProgress[] }> {
    this.logger.log(`获取拼音学习进度: userId=${userId}`);
    const rows = await this.db
      .select()
      .from(pinyinProgress)
      .where(sql`(${pinyinProgress.userId}).user_id = ${userId}`);

    const categories: PinyinCategory[] = ['initial', 'final', 'whole', 'tone', 'spelling'];
    const progressMap = new Map<string, { correctCount: number; totalCount: number }>();
    for (const row of rows) {
      progressMap.set(row.category, {
        correctCount: row.correctCount,
        totalCount: row.totalCount,
      });
    }

    const result: PinyinProgress[] = categories.map((cat: PinyinCategory) => {
      const p = progressMap.get(cat);
      const correctCount = p?.correctCount ?? 0;
      const totalCount = p?.totalCount ?? 0;
      const accuracy = totalCount > 0 ? correctCount / totalCount : 0;
      return { category: cat, correctCount, totalCount, accuracy };
    });

    return { categories: result };
  }

  async getPracticeQuestions(
    type: 'write' | 'match' | 'tone',
    count: number,
  ): Promise<{ questions: PinyinQuestion[] }> {
    this.logger.log(`生成练习题: type=${type}, count=${count}`);

    // 从所有分类中抽取题目素材
    const allItems = await this.db.select().from(pinyinItem);
    if (allItems.length === 0) {
      return { questions: [] };
    }

    const shuffled = [...allItems].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(count, shuffled.length));

    const questions: PinyinQuestion[] = selected.map((item, index: number) => {
      const id = `q_${item.id}_${index}`;

      if (type === 'write') {
        // 给出示例汉字，让用户写拼音
        return {
          id,
          type: 'write',
          question: item.example,
          imageHint: item.audioHint,
          answer: item.content,
        };
      }

      if (type === 'match') {
        // 给出拼音，选对应的示例汉字
        const wrongOptions = allItems
          .filter((other) => other.id !== item.id)
          .sort(() => Math.random() - 0.5)
          .slice(0, 3)
          .map((other) => other.example);
        const options = [...wrongOptions, item.example].sort(() => Math.random() - 0.5);
        return {
          id,
          type: 'match',
          question: item.content,
          imageHint: item.audioHint,
          options,
          answer: item.example,
        };
      }

      // tone 类型：给出拼音（无声调或带声调），选择正确声调
      const toneMarks = ['ā', 'á', 'ǎ', 'à', 'a'];
      const toneLabels = ['第一声', '第二声', '第三声', '第四声', '轻声'];
      // 从 content 中提取声调信息
      const contentLower = item.content;
      let correctTone = 0;
      // 简单判断：检查拼音中的声调标记
      if (/[āēīōūǖ]/.test(contentLower)) {
        correctTone = 0;
      } else if (/[áéíóúǘ]/.test(contentLower)) {
        correctTone = 1;
      } else if (/[ǎěǐǒǔǚ]/.test(contentLower)) {
        correctTone = 2;
      } else if (/[àèìòùǜ]/.test(contentLower)) {
        correctTone = 3;
      } else {
        correctTone = 4;
      }
      // 去掉声调的拼音作为题干
      const plainPinyin = this.stripTone(item.content);
      return {
        id,
        type: 'tone',
        question: plainPinyin,
        imageHint: item.audioHint,
        options: toneLabels,
        answer: toneLabels[correctTone],
      };
    });

    return { questions };
  }

  private stripTone(pinyin: string): string {
    const toneMap: Record<string, string> = {
      ā: 'a', á: 'a', ǎ: 'a', à: 'a',
      ē: 'e', é: 'e', ě: 'e', è: 'e',
      ī: 'i', í: 'i', ǐ: 'i', ì: 'i',
      ō: 'o', ó: 'o', ǒ: 'o', ò: 'o',
      ū: 'u', ú: 'u', ǔ: 'u', ù: 'u',
      ǖ: 'ü', ǘ: 'ü', ǚ: 'ü', ǜ: 'ü',
    };
    return pinyin.split('').map((ch: string) => toneMap[ch] ?? ch).join('');
  }

  async submitPractice(
    userId: string,
    category: string,
    results: Array<{ questionId: string; correct: boolean }>,
  ): Promise<{ success: boolean; correctCount: number; totalCount: number }> {
    this.logger.log(`提交练习结果: userId=${userId}, category=${category}, count=${results.length}`);

    const correctCount = results.filter((r) => r.correct).length;
    const totalCount = results.length;

    // 检查是否已有记录
    const existing = await this.db
      .select()
      .from(pinyinProgress)
      .where(
        and(
          sql`(${pinyinProgress.userId}).user_id = ${userId}`,
          eq(pinyinProgress.category, category),
        ),
      )
      .limit(1);

    if (existing.length > 0) {
      const updated = await this.db
        .update(pinyinProgress)
        .set({
          correctCount: existing[0].correctCount + correctCount,
          totalCount: existing[0].totalCount + totalCount,
          lastPracticeAt: new Date(),
        })
        .where(eq(pinyinProgress.id, existing[0].id))
        .returning({ id: pinyinProgress.id });

      if (updated.length === 0) {
        this.logger.error('更新拼音进度失败');
        return { success: false, correctCount: 0, totalCount: 0 };
      }

      return {
        success: true,
        correctCount: existing[0].correctCount + correctCount,
        totalCount: existing[0].totalCount + totalCount,
      };
    }

    // 插入新记录
    const inserted = await this.db
      .insert(pinyinProgress)
      .values({
        userId,
        category,
        correctCount,
        totalCount,
        lastPracticeAt: new Date(),
      })
      .returning({ id: pinyinProgress.id });

    if (inserted.length === 0) {
      this.logger.error('插入拼音进度失败');
      return { success: false, correctCount: 0, totalCount: 0 };
    }

    return { success: true, correctCount, totalCount };
  }
}
