import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { BucketModule } from './bucket/bucket.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), BucketModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
