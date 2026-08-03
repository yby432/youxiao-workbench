import { Module } from '@nestjs/common';
import { LiteracyController } from './literacy.controller';
import { LiteracyService } from './literacy.service';

@Module({
  controllers: [LiteracyController],
  providers: [LiteracyService],
  exports: [LiteracyService],
})
export class LiteracyModule {}
