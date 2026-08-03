import { Module } from '@nestjs/common';
import { PoetryController } from './poetry.controller';
import { PoetryService } from './poetry.service';

@Module({
  controllers: [PoetryController],
  providers: [PoetryService],
  exports: [PoetryService],
})
export class PoetryModule {}
