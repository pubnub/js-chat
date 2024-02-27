import { ObjectCustom, SetChannelMetadataResponse } from "pubnub"
import { Channel, ChannelFields } from "./channel"
import { Chat } from "./chat"
import { ChannelType, DeleteParameters, ThreadChannelDTOParams } from "../types"
import { ThreadMessage } from "./thread-message"
import { getErrorProxiedEntity } from "../error-logging"
import { Message } from "./message"

export class ThreadChannel extends Channel {
  readonly parentChannelId: string
  /** @internal */
  readonly parentMessage: Message

  /** @internal */
  constructor(
    chat: Chat,
    params: ChannelFields & { parentChannelId: string; parentMessage: Message }
  ) {
    super(chat, params)
    this.parentChannelId = params.parentChannelId
    this.parentMessage = params.parentMessage
  }

  /** @internal */
  static override fromDTO(chat: Chat, params: ThreadChannelDTOParams): ThreadChannel {
    const data = {
      id: params.id,
      parentChannelId: params.parentChannelId,
      parentMessage: params.parentMessage,
      name: params.name || undefined,
      custom: params.custom || undefined,
      description: params.description || undefined,
      updated: params.updated || undefined,
      status: params.status || undefined,
      type:
        params.type && ["direct", "group", "public"].includes(params.type)
          ? (params.type as ChannelType)
          : "unknown",
    }

    return getErrorProxiedEntity(new ThreadChannel(chat, data), chat.errorLogger)
  }

  override async pinMessage(message: ThreadMessage) {
    const response = (await this.chat.pinMessageToChannel(
      message,
      this
    )) as SetChannelMetadataResponse<ObjectCustom>
    return ThreadChannel.fromDTO(this.chat, {
      ...response.data,
      parentMessage: this.parentMessage,
      parentChannelId: this.parentChannelId,
    })
  }

  override async unpinMessage() {
    const response = await this.chat.pinMessageToChannel(null, this)
    return ThreadChannel.fromDTO(this.chat, {
      ...response.data,
      parentMessage: this.parentMessage,
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

  override async delete(options: DeleteParameters = {}) {
    const data = await this.chat.removeThreadChannel(this.parentMessage, options)

    return data[1]
  }

  /** @internal */
  protected emitUserMention({
    userId,
    timetoken,
    text,
  }: {
    userId: string
    timetoken: number
    text: string
  }) {
    const payload = {
      messageTimetoken: String(timetoken),
      channel: this.id,
      parentChannel: this.parentChannelId,
      ...this.getPushPayload(text),
    }
    this.chat.emitEvent({
      user: userId,
      type: "mention",
      payload,
    })
  }
}
