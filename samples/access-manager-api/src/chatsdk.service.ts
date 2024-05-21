import { Injectable } from '@nestjs/common';
import { Chat } from '@pubnub/chat';

@Injectable()
export class ChatSdkService {
  constructor() {}

  async getChatSdkInstance() {
    return Chat.init({
      publishKey: 'YOUR_PUB_KEY',
      subscribeKey: 'YOUR_SUB_KEY',
      secretKey: 'YOUR_SECRET_KEY',
      userId: 'secret-user',
    });
  }
}
