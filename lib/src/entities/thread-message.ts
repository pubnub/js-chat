import { Message, MessageFields } from "./message"
import { Chat } from "./chat"
import { ThreadMessageDTOParams } from "../types"
import { Channel } from "./channel"
import { getErrorProxiedEntity } from "../error-logging"
import PubNub from "pubnub"

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
      userId: "publisher" in params ? params.publisher : params.uuid || "unknown-user",
      actions: "actions" in params ? params.actions : undefined,
      meta:
        "meta" in params ? params.meta : "userMetadata" in params ? params.userMetadata : undefined,
    }

    return getErrorProxiedEntity(new ThreadMessage(chat, data), chat.errorLogger)
  }

  /** @internal */
  protected clone(params: Partial<MessageFields>) {
    const { timetoken, content, channelId, userId, actions, meta, parentChannelId } = this
    const data = Object.assign(
      {},
      { parentChannelId, timetoken, content, channelId, userId, actions, meta },
      params
    )
    return new ThreadMessage(this.chat, data)
  }

  static streamUpdatesOn(
    threadMessages: ThreadMessage[],
    callback: (threadMessages: ThreadMessage[]) => unknown
  ) {
    if (!threadMessages.length) throw "Cannot stream message updates on an empty list"
    const listener = {
      messageAction: (event: PubNub.MessageActionEvent) => {
        const threadMessage = threadMessages.find(
          (msg) => msg.timetoken === event.data.messageTimetoken
        )
        if (!threadMessage) return
        if (threadMessage.channelId !== event.channel) return
        let actions
        if (event.event === "added") actions = threadMessage.assignAction(event.data)
        if (event.event === "removed") actions = threadMessage.filterAction(event.data)
        const newMessage = threadMessage.clone({ actions })
        const newMessages = threadMessages.map((msg) =>
          msg.timetoken === newMessage.timetoken ? newMessage : msg
        )
        callback(newMessages)
      },
    }
    const { chat } = threadMessages[0]
    const removeListener = chat.addListener(listener)
    const subscriptions = threadMessages
      .filter((m1, i) => threadMessages.findIndex((m2) => m1.channelId === m2.channelId) === i)
      .map((message) => chat.subscribe(message.channelId))

    return () => {
      removeListener()
      subscriptions.map((unsub) => unsub())
    }
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
