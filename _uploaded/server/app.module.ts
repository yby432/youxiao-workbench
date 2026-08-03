import { APP_FILTER } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { PlatformModule } from '@lark-apaas/fullstack-nestjs-core';

import { GlobalExceptionFilter } from './common/filters/exception.filter';
import { ViewModule } from './modules/view/view.module';
import { LiteracyModule } from './modules/literacy/literacy.module';
import { PinyinModule } from './modules/pinyin/pinyin.module';
import { PoetryModule } from './modules/poetry/poetry.module';
import { EnglishModule } from './modules/english/english.module';
import { MathModule } from './modules/math/math.module';
import { ScienceModule } from './modules/science/science.module';
import { CheckinModule } from './modules/checkin/checkin.module';
import { ShopModule } from './modules/shop/shop.module';
import { UserModule } from './modules/user/user.module';
import { HomeModule } from './modules/home/home.module';

@Module({
  imports: [
    PlatformModule.forRoot(),
    // ====== @route-section: business-modules START ======
    LiteracyModule,
    PinyinModule,
    PoetryModule,
    EnglishModule,
    MathModule,
    ScienceModule,
    CheckinModule,
    ShopModule,
    UserModule,
    HomeModule,
    // ====== @route-section: business-modules END ======

    // ⚠️ @route-order: last
    // ViewModule is the fallback route module, must be registered last.
    ViewModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
})
export class AppModule {}
