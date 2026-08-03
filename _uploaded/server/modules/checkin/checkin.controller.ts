import { Controller, Get, Post, Body, Param, Query, Req } from '@nestjs/common';
import { NeedLogin } from '@lark-apaas/fullstack-nestjs-core';
import type { Request } from 'express';
import { CheckinService } from './checkin.service';

@Controller('api/checkin')
export class CheckinController {
  constructor(private readonly checkinService: CheckinService) {}

  @Get('daily-tasks')
  async getDailyTasks(@Req() req: Request) {
    const { userId } = (req as any).userContext;
    return this.checkinService.getDailyTasks(userId);
  }

  @NeedLogin()
  @Post('daily-tasks/complete')
  async completeTask(
    @Req() req: Request,
    @Body() body: { taskId: string; module: string },
  ) {
    const { userId } = (req as any).userContext;
    return this.checkinService.completeTask(userId, body.taskId, body.module);
  }

  @Get('stats')
  async getStats(@Req() req: Request) {
    const { userId } = (req as any).userContext;
    return this.checkinService.getCheckinStats(userId);
  }

  @Get('calendar')
  async getCalendar(
    @Req() req: Request,
    @Query('year') year: string,
    @Query('month') month: string,
  ) {
    const { userId } = (req as any).userContext;
    const y = parseInt(year, 10) || new Date().getFullYear();
    const m = parseInt(month, 10) || new Date().getMonth() + 1;
    return this.checkinService.getCalendar(userId, y, m);
  }

  @NeedLogin()
  @Post('supplement')
  async supplement(@Req() req: Request, @Body() body: { date: string }) {
    const { userId } = (req as any).userContext;
    return this.checkinService.supplementCheckin(userId, body.date);
  }

  @Get('day/:date')
  async getDayDetail(@Req() req: Request, @Param('date') date: string) {
    const { userId } = (req as any).userContext;
    return this.checkinService.getDayDetail(userId, date);
  }
}
