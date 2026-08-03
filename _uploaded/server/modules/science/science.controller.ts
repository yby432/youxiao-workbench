import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { NeedLogin } from '@lark-apaas/fullstack-nestjs-core';
import { ScienceService } from './science.service';

@Controller('api/science')
export class ScienceController {
  constructor(private readonly scienceService: ScienceService) {}

  @Get('articles')
  async getArticles(@Req() req: Request, @Query('category') category?: string) {
    const { userId } = req.userContext;
    return this.scienceService.getArticles(userId, category);
  }

  @Get('articles/:id')
  async getArticleDetail(@Param('id') id: string) {
    return this.scienceService.getArticleDetail(id);
  }

  @NeedLogin()
  @Post('quiz')
  async submitQuiz(
    @Req() req: Request,
    @Body() body: { articleId: string; correct: boolean },
  ) {
    const { userId } = req.userContext;
    return this.scienceService.submitQuiz(userId, body.articleId, body.correct);
  }

  @Get('progress')
  async getProgress(@Req() req: Request) {
    const { userId } = req.userContext;
    return this.scienceService.getProgressStats(userId);
  }
}
