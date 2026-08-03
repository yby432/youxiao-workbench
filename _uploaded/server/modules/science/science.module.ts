import { Module } from '@nestjs/common';
import { ScienceController } from './science.controller';
import { ScienceService } from './science.service';

@Module({
  controllers: [ScienceController],
  providers: [ScienceService],
  exports: [ScienceService],
})
export class ScienceModule {}
