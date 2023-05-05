import {
  ListenerParameters,
  SignalEvent,
  MessageEvent,
  ObjectCustom,
  ChannelMetadataObject,
} from "pubnub"
import { Chat } from "./chat"
import { Message } from "./message"
import { SendTextOptionParams, StatusTypeFields, DeleteParameters } from "../types"

export type ChannelFields = Pick<
  Channel,
  "id" | "name" | "custom" | "description" | "updated" | "status" | "type"
>

export class Channel {
  private chat: Chat
  readonly id: string
  readonly name?: string
  readonly custom?: ObjectCustom
  readonly description?: string
  readonly updated?: string
  readonly status?: string
  readonly type?: string
  private listeners: ListenerParameters[] = []
  private subscribed = false
  private typingSent = false
  private typingSentTimer?: ReturnType<typeof setTimeout>
  private typingIndicators: Map<string, ReturnType<typeof setTimeout>> = new Map()

  constructor(chat: Chat, params: ChannelFields) {
    this.chat = chat
    this.id = params.id
    Object.assign(this, params)
  }

  static fromDTO(chat: Chat, params: ChannelMetadataObject<ObjectCustom> & StatusTypeFields) {
    const data = {
      id: params.id,
      name: params.name || undefined,
      custom: params.custom || undefined,
      description: params.description || undefined,
      updated: params.updated || undefined,
      status: params.status || undefined,
      type: params.type || undefined,
    }

    return new Channel(chat, data)
  }

  async sendText(text: string, options: SendTextOptionParams = {}) {
    return await this.chat.sdk.publish({
      channel: this.id,
      message: {
        type: "text",
        text,
      },
      ...options,
    })
  }

  private async sendTypingSignal(value: boolean) {
    return await this.chat.sdk.signal({
      channel: this.id,
      message: {
        type: "typing",
        value,
      },
    })
  }

  async startTyping() {
    if (this.typingSent) return
    this.typingSent = true
    this.typingSentTimer = setTimeout(
      () => (this.typingSent = false),
      this.chat.config.typingTimeout - 1000
    )
    return await this.sendTypingSignal(true)
  }

  async stopTyping() {
    clearTimeout(this.typingSentTimer)
    if (!this.typingSent) return
    this.typingSent = false
    return await this.sendTypingSignal(false)
  }

  getTyping(callback: (typingUserIds: string[]) => unknown) {
    const typingListener = {
      signal: (event: SignalEvent) => {
        const { channel, message, publisher } = event
        if (channel !== this.id) return
        if (message.type !== "typing") return
        const timer = this.typingIndicators.get(publisher)

        if (!message.value && timer) {
          clearTimeout(timer)
          this.typingIndicators.delete(publisher)
        }

        if (message.value && timer) {
          clearTimeout(timer)
          const newTimer = setTimeout(() => {
            this.typingIndicators.delete(publisher)
            callback(Array.from(this.typingIndicators.keys()))
          }, this.chat.config.typingTimeout)
          this.typingIndicators.set(publisher, newTimer)
        }

        if (message.value && !timer) {
          const newTimer = setTimeout(() => {
            this.typingIndicators.delete(publisher)
            callback(Array.from(this.typingIndicators.keys()))
          }, this.chat.config.typingTimeout)
          this.typingIndicators.set(publisher, newTimer)
        }

        callback(Array.from(this.typingIndicators.keys()))
      },
    }

    this.listeners.push(typingListener)
    this.chat.sdk.addListener(typingListener)
    if (!this.subscribed) this.chat.sdk.subscribe({ channels: [this.id] })
  }

  connect(callback: (message: Message) => void) {
    const messageListener = {
      message: (event: MessageEvent) => {
        const { message, channel } = event
        if (channel !== this.id) return
        if (!["text"].includes(message.type)) return
        callback(Message.fromDTO(this.chat, event))
      },
    }

    this.listeners.push(messageListener)
    this.chat.sdk.addListener(messageListener)
    if (!this.subscribed) this.chat.sdk.subscribe({ channels: [this.id] })
  }

  disconnect() {
    this.listeners.forEach((listener) => this.chat.sdk.removeListener(listener))
    this.listeners = []
    if (this.subscribed) this.chat.sdk.unsubscribe({ channels: [this.id] })
  }

  async update(data: Omit<ChannelFields, "id">) {
    return this.chat.updateChannel(this.id, data)
  }

  async delete(options: DeleteParameters = {}) {
    return this.chat.deleteChannel(this.id, options)
  }

  async whoIsPresent() {
    return this.chat.whoIsPresent(this.id)
  }

  async isPresent(userId: string) {
    return this.chat.isPresent(userId, this.id)
  }

  async getHistory(
    params: { startTimetoken?: string; endTimetoken?: string; count?: number } = {}
  ) {
    try {
      const options = {
        channels: [this.id],
        count: params.count || 25,
        start: params.startTimetoken,
        end: params.endTimetoken,
        includeMessageActions: true,
        includeMeta: true,
      }

      const response = await this.chat.sdk.fetchMessages(options)

      return {
        messages:
          response.channels[this.id]?.map((messageObject) =>
            Message.fromDTO(this.chat, messageObject)
          ) || [],
        isMore: response.channels[this.id]?.length === (params.count || 25),
      }
    } catch (error) {
      throw error
    }
  }

  // togglePinMessage(messageTimeToken: string) {}

  // getUnreadMessagesCount() {}

  // star() {}

  // getMembers() {}

  // getOnlineMembers() {}

  // search(phrase: string) {}
}
