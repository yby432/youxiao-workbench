import { Module } from '@nestjs/common';
import { EnglishController } from './english.controller';
import { EnglishService } from './english.service';

@Module({
  controllers: [EnglishController],
  providers: [EnglishService],
  exports: [EnglishService],
})
export class EnglishModule {}
