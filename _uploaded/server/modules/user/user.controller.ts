import { Controller, Get, Req, Query } from '@nestjs/common';
import { NeedLogin } from '@lark-apaas/fullstack-nestjs-core';
import { UserService } from './user.service';
import type {
  UserLearningProfile,
  ExchangeOrder,
  PaginatedResponse,
  LearningReport,
  BeanTransaction,
} from '@shared/api.interface';

@Controller('api/user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @NeedLogin()
  @Get('profile')
  async getProfile(@Req() req: { userContext: { userId: string } }): Promise<UserLearningProfile> {
    const { userId } = req.userContext;
    return this.userService.getProfile(userId);
  }

  @NeedLogin()
  @Get('exchange-orders')
  async getExchangeOrders(
    @Req() req: { userContext: { userId: string } },
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20',
  ): Promise<PaginatedResponse<ExchangeOrder>> {
    const { userId } = req.userContext;
    const p = parseInt(page, 10) || 1;
    const ps = parseInt(pageSize, 10) || 20;
    return this.userService.getExchangeOrders(userId, p, ps);
  }

  @NeedLogin()
  @Get('learning-report')
  async getLearningReport(
    @Req() req: { userContext: { userId: string } },
  ): Promise<LearningReport> {
    const { userId } = req.userContext;
    return this.userService.getLearningReport(userId);
  }

  @NeedLogin()
  @Get('bean-transactions')
  async getBeanTransactions(
    @Req() req: { userContext: { userId: string } },
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20',
  ): Promise<PaginatedResponse<BeanTransaction>> {
    const { userId } = req.userContext;
    const p = parseInt(page, 10) || 1;
    const ps = parseInt(pageSize, 10) || 20;
    return this.userService.getBeanTransactions(userId, p, ps);
  }
}
