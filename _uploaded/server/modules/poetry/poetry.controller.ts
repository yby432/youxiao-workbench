import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Req,
  Logger,
} from '@nestjs/common';
import { NeedLogin } from '@lark-apaas/fullstack-nestjs-core';
import { PoetryService } from './poetry.service';
import type { Request } from 'express';

@Controller('api/poetry')
export class PoetryController {
  private readonly logger = new Logger(PoetryController.name);

  constructor(private readonly poetryService: PoetryService) {}

  @Get('list')
  async getPoetryList(@Req() req: Request) {
    const { userId } = req.userContext;
    return this.poetryService.getPoetryList(userId);
  }

  @Get('fill-blank/:poemId')
  async getFillBlank(@Param('poemId') poemId: string) {
    return this.poetryService.getFillBlankQuestions(poemId);
  }

  @Get(':id')
  async getPoemDetail(@Param('id') id: string) {
    return this.poetryService.getPoemDetail(id);
  }

  @NeedLogin()
  @Post('recite')
  async recitePoem(
    @Req() req: Request,
    @Body() body: { poemId: string },
  ) {
    const { userId } = req.userContext;
    return this.poetryService.recitePoem(userId, body.poemId);
  }
}
