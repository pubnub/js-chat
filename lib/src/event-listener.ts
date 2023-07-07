import { Chat } from "./entities/chat";
import {Message} from "./entities/message";

export class EventListener {
  private chat: Chat

  constructor(chat: Chat) {
    this.chat = chat
  }

  async listenForCurrentUserMentions(func: (message: Message) => void) {
    const currentUser = this.chat.currentUser

    const channelId = `pnc_UserTechnicalChannel_${currentUser.id}`

    const channel = (await this.chat.getChannel(channelId)) || (await this.chat.createChannel(channelId, { description: "user mention channel" }))

    return channel.connect(func)
  }
}
