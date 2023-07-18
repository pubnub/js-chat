import { Chat } from "./entities/chat"
import {
  ChatEventDependantPayload,
  ChatEventNames,
  MessageType,
  UserMentionMessageContent,
} from "./types"

export const USER_CHANNEL_ID_PREFIX = "pnc_UserTechnicalChannel_"

export class ChatEvents {
  private chat: Chat

  constructor(chat: Chat) {
    this.chat = chat
  }

  async emitUserRelatedEvent<K extends ChatEventNames>(
    eventName: K,
    targetUserId: string,
    params: ChatEventDependantPayload[K]
  ) {
    const userChannelId = `${USER_CHANNEL_ID_PREFIX}${targetUserId}`

    const channel =
      (await this.chat.getChannel(userChannelId)) ||
      (await this.chat.createChannel(userChannelId, { description: "user mention channel" }))

    if (eventName === MessageType.USER_MENTION) {
      const typedParams = params as ChatEventDependantPayload[MessageType.USER_MENTION]

      const message: UserMentionMessageContent = {
        type: MessageType.USER_MENTION,
        mentionedAtChannelId: typedParams.mentionedAtChannelId,
      }

      this.chat.sdk.publish({
        channel: channel.id,
        message,
      })
    }
  }
}
