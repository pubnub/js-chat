import { ObjectCustom, SetChannelMetadataResponse } from "pubnub"
import { Channel, ChannelFields } from "./channel"
import { Chat } from "./chat"
import { ThreadChannelDTOParams } from "../types"
import { ThreadMessage } from "./thread-message"

export class ThreadChannel extends Channel {
  readonly parentChannelId: string

  /** @internal */
  constructor(chat: Chat, params: ChannelFields & { parentChannelId: string }) {
    super(chat, params)
    this.parentChannelId = params.parentChannelId
  }

  /** @internal */
  static override fromDTO(chat: Chat, params: ThreadChannelDTOParams) {
    const data = {
      id: params.id,
      parentChannelId: params.parentChannelId,
      name: params.name || undefined,
      custom: params.custom || undefined,
      description: params.description || undefined,
      updated: params.updated || undefined,
      status: params.status || undefined,
      type: params.type || undefined,
    }

    return new ThreadChannel(chat, data)
  }

  override async pinMessage(message: ThreadMessage) {
    const response = (await this.chat.pinMessageToChannel(
      message,
      this
    )) as SetChannelMetadataResponse<ObjectCustom>
    return ThreadChannel.fromDTO(this.chat, {
      ...response.data,
      parentChannelId: this.parentChannelId,
    })
  }

  override async unpinMessage() {
    const response = await this.chat.pinMessageToChannel(null, this)
    return ThreadChannel.fromDTO(this.chat, {
      ...response.data,
      parentChannelId: this.parentChannelId,
    })
  }

  async pinMessageToParentChannel(message: ThreadMessage) {
    const parentChannel = await this.chat.getChannel(this.parentChannelId)
    if (!parentChannel) {
      throw "Parent channel doesn't exist"
    }
    const response = await this.chat.pinMessageToChannel(message, parentChannel)
    return Channel.fromDTO(this.chat, response.data)
  }

  async unpinMessageFromParentChannel() {
    const parentChannel = await this.chat.getChannel(this.parentChannelId)
    if (!parentChannel) {
      throw "Parent channel doesn't exist"
    }
    const response = await this.chat.pinMessageToChannel(null, parentChannel)
    return Channel.fromDTO(this.chat, response.data)
  }

  async getHistory(
    params: { startTimetoken?: string; endTimetoken?: string; count?: number } = {}
  ) {
    const messagesResponse = await super.getHistory(params)

    return {
      messages: messagesResponse.messages.map(
        (m) =>
          new ThreadMessage(this.chat, {
            timetoken: m.timetoken,
            parentChannelId: this.parentChannelId,
            content: m.content,
            channelId: m.channelId,
            userId: m.userId,
            actions: m.actions,
            meta: m.meta,
          })
      ),
      isMore: messagesResponse.isMore,
    }
  }
}
