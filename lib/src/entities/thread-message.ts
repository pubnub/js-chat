import { Message, MessageFields } from "./message"
import { Chat } from "./chat"
import { ThreadMessageDTOParams } from "../types"
import { Channel } from "./channel"

export class ThreadMessage extends Message {
  readonly parentChannelId: string

  /** @internal */
  constructor(chat: Chat, params: MessageFields & { parentChannelId: string }) {
    super(chat, params)
    this.parentChannelId = params.parentChannelId
  }

  /** @internal */
  static fromDTO(chat: Chat, params: ThreadMessageDTOParams) {
    const data = {
      timetoken: String(params.timetoken),
      parentChannelId: params.parentChannelId,
      content: params.message,
      channelId: params.channel,
      userId: "publisher" in params ? params.publisher : params.uuid,
      actions: "actions" in params ? params.actions : undefined,
      meta:
        "meta" in params ? params.meta : "userMetadata" in params ? params.userMetadata : undefined,
    }

    return new ThreadMessage(chat, data)
  }

  async pinToParentChannel() {
    const parentChannel = await this.chat.getChannel(this.parentChannelId)
    if (!parentChannel) {
      throw "Parent channel doesn't exist"
    }
    const response = await this.chat.pinMessageToChannel(this, parentChannel)
    return Channel.fromDTO(this.chat, response.data)
  }

  async unpinFromParentChannel() {
    const parentChannel = await this.chat.getChannel(this.parentChannelId)
    if (!parentChannel) {
      throw "Parent channel doesn't exist"
    }
    const response = await this.chat.pinMessageToChannel(null, parentChannel)
    return Channel.fromDTO(this.chat, response.data)
  }
}
