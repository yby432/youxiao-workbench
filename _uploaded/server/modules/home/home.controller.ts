import { Controller, Get, Req } from '@nestjs/common';
import { NeedLogin } from '@lark-apaas/fullstack-nestjs-core';
import type { Request } from 'express';
import { HomeService } from './home.service';

@Controller('api')
export class HomeController {
  constructor(private readonly homeService: HomeService) {}

  @NeedLogin()
  @Get('home/summary')
  async getHomeSummary(@Req() req: Request) {
    const { userId } = (req as any).userContext;
    return this.homeService.getHomeSummary(userId);
  }

  @NeedLogin()
  @Get('modules/summary')
  async getModulesSummary(@Req() req: Request) {
    const { userId } = (req as any).userContext;
    return this.homeService.getModulesSummary(userId);
  }
}
