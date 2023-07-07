import { Chat } from "./entities/chat";

type EmitUserMentionParams = {
  targetUserId: string
  mentionedAtChannelId: string
}

export class EventEmitter {
  private chat: Chat

  constructor(chat: Chat) {
    this.chat = chat
  }

  async emitUserMention({ targetUserId, mentionedAtChannelId }: EmitUserMentionParams) {
    const channelId = `pnc_UserTechnicalChannel_${targetUserId}`

    const channel = (await this.chat.getChannel(channelId)) || (await this.chat.createChannel(channelId, { description: "user mention channel" }))

    channel.sendText("pnc_UserMention", { meta: {
      mentionedBy: this.chat.currentUser.id,
        mentionedAt: mentionedAtChannelId,
      } });
  }
}
