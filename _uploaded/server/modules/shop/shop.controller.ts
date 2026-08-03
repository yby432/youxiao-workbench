import { Controller, Get, Post, Param, Query, Body, Req } from '@nestjs/common';
import { NeedLogin } from '@lark-apaas/fullstack-nestjs-core';
import { ShopService } from './shop.service';
import type { Prize, PrizeTier, ExchangeResult } from '@shared/api.interface';

@Controller('api/shop')
export class ShopController {
  constructor(private readonly shopService: ShopService) {}

  @Get('prizes')
  async getPrizes(@Query('tier') tier?: PrizeTier): Promise<Prize[]> {
    return this.shopService.getPrizes(tier);
  }

  @Get('prizes/:id')
  async getPrizeDetail(@Param('id') id: string): Promise<Prize> {
    return this.shopService.getPrizeById(id);
  }

  @NeedLogin()
  @Post('exchange')
  async exchange(
    @Req() req: { userContext: { userId: string } },
    @Body() body: { prizeId: string; receiverName: string; receiverPhone: string; address: string },
  ): Promise<ExchangeResult> {
    const { userId } = req.userContext;
    const { prizeId, receiverName, receiverPhone, address } = body;
    return this.shopService.exchange(userId, prizeId, receiverName, receiverPhone, address);
  }

}
