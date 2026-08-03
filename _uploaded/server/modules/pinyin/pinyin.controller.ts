import { Controller, Get, Post, Query, Body, Req } from '@nestjs/common';
import { NeedLogin } from '@lark-apaas/fullstack-nestjs-core';
import { PinyinService } from './pinyin.service';
import type { PinyinCategory } from '@shared/api.interface';

@Controller('api/pinyin')
export class PinyinController {
  constructor(private readonly pinyinService: PinyinService) {}

  @Get('items')
  async getItems(@Query('category') category: PinyinCategory) {
    return this.pinyinService.getItemsByCategory(category);
  }

  @Get('progress')
  @NeedLogin()
  async getProgress(@Req() req: { userContext: { userId: string } }) {
    const { userId } = req.userContext;
    return this.pinyinService.getProgress(userId);
  }

  @Get('practice-questions')
  async getPracticeQuestions(
    @Query('type') type: 'write' | 'match' | 'tone',
    @Query('count') count?: string,
  ) {
    const num = count ? parseInt(count, 10) : 10;
    return this.pinyinService.getPracticeQuestions(type, num);
  }

  @Post('practice')
  @NeedLogin()
  async submitPractice(
    @Req() req: { userContext: { userId: string } },
    @Body() body: { category: string; results: Array<{ questionId: string; correct: boolean }> },
  ) {
    const { userId } = req.userContext;
    return this.pinyinService.submitPractice(userId, body.category, body.results);
  }
}
