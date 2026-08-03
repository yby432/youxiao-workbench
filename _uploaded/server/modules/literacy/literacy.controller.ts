import { Controller, Get, Put, Param, Body, Req } from '@nestjs/common';
import { NeedLogin } from '@lark-apaas/fullstack-nestjs-core';
import { LiteracyService } from './literacy.service';
import type { CharacterStatus } from '@shared/api.interface';

@Controller('api/literacy')
export class LiteracyController {
  constructor(private readonly literacyService: LiteracyService) {}

  @Get('characters')
  async getCharacters(@Req() req: any) {
    const userId: string = req.userContext.userId;
    return this.literacyService.getCharactersWithProgress(userId);
  }

  @Get('stats')
  async getStats(@Req() req: any) {
    const userId: string = req.userContext.userId;
    return this.literacyService.getStats(userId);
  }

  @Get('weak-words')
  async getWeakWords(@Req() req: any) {
    const userId: string = req.userContext.userId;
    return this.literacyService.getWeakWords(userId);
  }

  @Get('characters/:id')
  async getCharacterDetail(@Param('id') id: string) {
    return this.literacyService.getCharacterById(id);
  }

  @NeedLogin()
  @Put('progress/:characterId')
  async updateProgress(
    @Req() req: any,
    @Param('characterId') characterId: string,
    @Body() body: { status: CharacterStatus; isWeak?: boolean }
  ) {
    const userId: string = req.userContext.userId;
    return this.literacyService.updateProgress(userId, characterId, body.status, body.isWeak);
  }
}
