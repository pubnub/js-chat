import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ChatSdkService } from './chatsdk.service';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService, ChatSdkService],
})
export class AppModule {}
