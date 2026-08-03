import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { eq, and, count, sql } from 'drizzle-orm';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { chineseCharacter, literacyProgress } from '@server/database/schema';
import type {
  ChineseCharacter,
  CharacterStatus,
  LiteracyStats,
  LiteracyUnitGroup,
} from '@shared/api.interface';

@Injectable()
export class LiteracyService {
  private readonly logger = new Logger(LiteracyService.name);

  constructor(@Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase) {}

  private mapCharacter(row: typeof chineseCharacter.$inferSelect): ChineseCharacter {
    return {
      id: row.id,
      character: row.character,
      pinyin: row.pinyin,
      radical: row.radical,
      strokeCount: row.strokeCount,
      words: row.words ? row.words.split(',').map((w: string) => w.trim()).filter(Boolean) : [],
      unit: row.unit,
      lesson: row.lesson,
      strokeOrder: row.strokeOrder
        ? row.strokeOrder.split(',').map((s: string) => s.trim()).filter(Boolean)
        : [],
    };
  }

  async getCharacterById(id: string): Promise<ChineseCharacter> {
    const rows = await this.db.select().from(chineseCharacter).where(eq(chineseCharacter.id, id));
    if (rows.length === 0) {
      throw new NotFoundException('汉字不存在');
    }
    return this.mapCharacter(rows[0]);
  }

  async getCharactersWithProgress(userId: string): Promise<LiteracyUnitGroup[]> {
    this.logger.log(`获取字表，用户: ${userId}`);

    const allChars = await this.db
      .select()
      .from(chineseCharacter)
      .orderBy(chineseCharacter.unit, chineseCharacter.lesson, chineseCharacter.id);

    const progressRows = await this.db
      .select({
        characterId: literacyProgress.characterId,
        status: literacyProgress.status,
        isWeak: literacyProgress.isWeak,
      })
      .from(literacyProgress)
      .where(sql`(${literacyProgress.userId}).user_id = ${userId}`);

    const progressMap = new Map<string, { status: string; isWeak: boolean }>();
    for (const p of progressRows) {
      progressMap.set(p.characterId, { status: p.status, isWeak: p.isWeak });
    }

    const unitMap = new Map<number, Map<number, Array<ChineseCharacter & { status: CharacterStatus; isWeak: boolean }>>>();

    for (const row of allChars) {
      const char = this.mapCharacter(row);
      const prog = progressMap.get(row.id);
      const status = (prog?.status as CharacterStatus) || 'unlearned';
      const isWeak = prog?.isWeak ?? false;

      if (!unitMap.has(char.unit)) {
        unitMap.set(char.unit, new Map());
      }
      const lessonMap = unitMap.get(char.unit)!;
      if (!lessonMap.has(char.lesson)) {
        lessonMap.set(char.lesson, []);
      }
      lessonMap.get(char.lesson)!.push({ ...char, status, isWeak });
    }

    const result: LiteracyUnitGroup[] = [];
    const sortedUnits = Array.from(unitMap.keys()).sort((a: number, b: number) => a - b);
    for (const unit of sortedUnits) {
      const lessonMap = unitMap.get(unit)!;
      const sortedLessons = Array.from(lessonMap.keys()).sort((a: number, b: number) => a - b);
      const lessons = sortedLessons.map((lesson: number) => ({
        lesson,
        characters: lessonMap.get(lesson)!,
      }));
      result.push({ unit, lessons });
    }

    return result;
  }

  async getStats(userId: string): Promise<LiteracyStats> {
    this.logger.log(`获取识字统计，用户: ${userId}`);

    const totalResult = await this.db.select({ count: count() }).from(chineseCharacter);
    const total = Number(totalResult[0].count);

    const learnedResult = await this.db
      .select({ count: count() })
      .from(literacyProgress)
      .where(
        and(
          sql`(${literacyProgress.userId}).user_id = ${userId}`,
          sql`${literacyProgress.status} != 'unlearned'`
        )
      );
    const learned = Number(learnedResult[0].count);

    const masteredResult = await this.db
      .select({ count: count() })
      .from(literacyProgress)
      .where(
        and(
          sql`(${literacyProgress.userId}).user_id = ${userId}`,
          eq(literacyProgress.status, 'mastered')
        )
      );
    const mastered = Number(masteredResult[0].count);

    const weakResult = await this.db
      .select({ count: count() })
      .from(literacyProgress)
      .where(
        and(
          sql`(${literacyProgress.userId}).user_id = ${userId}`,
          eq(literacyProgress.isWeak, true)
        )
      );
    const weakCount = Number(weakResult[0].count);

    const unitCountsResult = await this.db
      .select({ unit: chineseCharacter.unit, count: count() })
      .from(chineseCharacter)
      .groupBy(chineseCharacter.unit)
      .orderBy(chineseCharacter.unit);

    const unitMasteredResult = await this.db
      .select({
        unit: chineseCharacter.unit,
        count: count(),
      })
      .from(literacyProgress)
      .innerJoin(chineseCharacter, eq(literacyProgress.characterId, chineseCharacter.id))
      .where(
        and(
          sql`(${literacyProgress.userId}).user_id = ${userId}`,
          eq(literacyProgress.status, 'mastered')
        )
      )
      .groupBy(chineseCharacter.unit)
      .orderBy(chineseCharacter.unit);

    const unitMasteredMap = new Map<number, number>();
    for (const row of unitMasteredResult) {
      unitMasteredMap.set(row.unit, Number(row.count));
    }

    const unitMasteryRate = unitCountsResult.map((row) => {
      const total = Number(row.count);
      return {
        unit: row.unit,
        rate: total > 0 ? (unitMasteredMap.get(row.unit) || 0) / total : 0,
      };
    });

    return { total, learned, mastered, weakCount, unitMasteryRate };
  }

  async updateProgress(
    userId: string,
    characterId: string,
    status: CharacterStatus,
    isWeak?: boolean
  ): Promise<{ success: boolean; status: string }> {
    this.logger.log(`更新进度: 用户=${userId}, 汉字=${characterId}, 状态=${status}`);

    const existing = await this.db
      .select({ id: literacyProgress.id })
      .from(literacyProgress)
      .where(
        and(
          sql`(${literacyProgress.userId}).user_id = ${userId}`,
          eq(literacyProgress.characterId, characterId)
        )
      );

    if (existing.length > 0) {
      const updateData: Record<string, string | boolean> = { status };
      if (typeof isWeak === 'boolean') {
        updateData.isWeak = isWeak;
      }
      await this.db
        .update(literacyProgress)
        .set(updateData)
        .where(eq(literacyProgress.id, existing[0].id));
    } else {
      await this.db.insert(literacyProgress).values({
        userId,
        characterId,
        status,
        isWeak: isWeak ?? false,
        reviewCount: 0,
      });
    }

    return { success: true, status };
  }

  async getWeakWords(userId: string): Promise<{ items: ChineseCharacter[]; total: number }> {
    this.logger.log(`获取薄弱字本，用户: ${userId}`);

    const charIdsResult = await this.db
      .select({ characterId: literacyProgress.characterId })
      .from(literacyProgress)
      .where(
        and(
          sql`(${literacyProgress.userId}).user_id = ${userId}`,
          eq(literacyProgress.isWeak, true)
        )
      );

    const charIds: string[] = charIdsResult.map((r: { characterId: string }) => r.characterId);
    if (charIds.length === 0) {
      return { items: [], total: 0 };
    }

    const chars = await this.db
      .select()
      .from(chineseCharacter)
      .where(sql`${chineseCharacter.id} = ANY(ARRAY[${sql.join(charIds.map((id: string) => sql`${id}`), sql`, `)}]::uuid[])`)
      .orderBy(chineseCharacter.unit, chineseCharacter.lesson);

    const items: ChineseCharacter[] = chars.map((row: typeof chineseCharacter.$inferSelect) =>
      this.mapCharacter(row)
    );

    return { items, total: items.length };
  }
}
