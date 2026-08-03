import { Controller, Get, Post, Body, Query, Req } from '@nestjs/common';
import { NeedLogin } from '@lark-apaas/fullstack-nestjs-core';
import { MathService } from './math.service';
import type { MathCategory, MathCategoryProgress, MathQuestion, MathStats } from '@shared/api.interface';

interface PracticeResultItem {
  questionId: string;
  correct: boolean;
  timeSpent: number;
}

interface PracticeBody {
  category: MathCategory;
  results: PracticeResultItem[];
}

interface UserContextRequest extends Request {
  userContext: {
    userId: string;
    tenantId: string;
    appId: string;
    env: string;
    userName: string;
    userNameEn: string;
  };
}

@Controller('api/math')
export class MathController {
  constructor(private readonly mathService: MathService) {}

  @Get('categories')
  @NeedLogin()
  async getCategories(@Req() req: UserContextRequest): Promise<{ categories: MathCategoryProgress[] }> {
    const { userId } = req.userContext;
    return this.mathService.getCategories(userId);
  }

  @Get('questions')
  async getQuestions(
    @Query('category') category: MathCategory,
    @Query('count') count: string = '10',
    @Query('type') type?: string,
  ): Promise<{ questions: MathQuestion[] }> {
    const countNum = parseInt(count, 10) || 10;
    return this.mathService.getQuestions(category, countNum, type);
  }

  @Post('practice')
  @NeedLogin()
  async submitPractice(
    @Req() req: UserContextRequest,
    @Body() body: PracticeBody,
  ): Promise<{ success: boolean; correctCount: number; totalCount: number; accuracy: number }> {
    const { userId } = req.userContext;
    return this.mathService.submitPractice(userId, body);
  }

  @Get('stats')
  @NeedLogin()
  async getStats(@Req() req: UserContextRequest): Promise<MathStats> {
    const { userId } = req.userContext;
    return this.mathService.getStats(userId);
  }
}
