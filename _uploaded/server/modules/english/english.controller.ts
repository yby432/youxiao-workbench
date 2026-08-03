import { Controller, Get, Post, Query, Body, Req } from '@nestjs/common';
import { NeedLogin } from '@lark-apaas/fullstack-nestjs-core';
import { EnglishService } from './english.service';
import type {
  EnglishCategory,
  EnglishLevel,
  EnglishItem,
  EnglishProgress,
} from '@shared/api.interface';

interface ItemsResponse {
  category: EnglishCategory;
  subcategory?: string;
  level: EnglishLevel;
  items: EnglishItem[];
}

interface ProgressResponse {
  level: EnglishLevel;
  categories: EnglishProgress[];
}

interface PracticeBody {
  itemId: string;
  level: EnglishLevel;
  correct: boolean;
}

@Controller('api/english')
export class EnglishController {
  constructor(private readonly englishService: EnglishService) {}

  @Get('items')
  async getItems(
    @Query('category') category: EnglishCategory,
    @Query('subcategory') subcategory?: string,
    @Query('level') level: EnglishLevel = 'beginner',
  ): Promise<ItemsResponse> {
    return this.englishService.getItems(category, subcategory, level);
  }

  @Get('progress')
  @NeedLogin()
  async getProgress(
    @Req() req: { userContext: { userId: string } },
    @Query('level') level: EnglishLevel = 'beginner',
  ): Promise<ProgressResponse> {
    const { userId } = req.userContext;
    return this.englishService.getProgress(userId, level);
  }

  @Post('practice')
  @NeedLogin()
  async submitPractice(
    @Req() req: { userContext: { userId: string } },
    @Body() body: PracticeBody,
  ): Promise<{ success: boolean }> {
    const { userId } = req.userContext;
    return this.englishService.submitPractice(userId, body.itemId, body.level, body.correct);
  }
}
