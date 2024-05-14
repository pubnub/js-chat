import { Controller, Get, Param } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('/auth-key/:userId')
  getAccessToken(@Param() params: { userId: string }) {
    return this.appService.getAuthKey(params.userId);
  }
}
