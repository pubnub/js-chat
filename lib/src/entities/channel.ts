import {
  ListenerParameters,
  SignalEvent,
  MessageEvent,
  ObjectCustom,
  ChannelMetadataObject
} from "pubnub"
import { Chat } from "./chat"
import { Message } from "./message"
import { SendTextOptionParams } from "../types";

type ChannelConstructor = {
  id: string
  name?: string
} & ChannelMetadataObject<ObjectCustom>

export interface TypingData {
  userId: string
  name?: string
}

interface TypingDataWithTimer extends TypingData {
  timer: ReturnType<typeof setTimeout>
}

export class Channel {
  private chat: Chat
  readonly id: string
  readonly name?: string
  private listeners: ListenerParameters[] = []
  private subscribed = false
  private typingSent = false
  private typingSentTimer?: ReturnType<typeof setTimeout>
  private typingIndicators: TypingDataWithTimer[] = []

  constructor(chat: Chat, params: ChannelConstructor) {
    this.chat = chat
    this.id = params.id
    this.name = params.name
    Object.assign(this, params)
  }

  static fromDTO(chat: Chat, params: ChannelMetadataObject<ObjectCustom>) {
    const data = {
      id: params.id,
      name: params.name || undefined,
      custom: params.custom || undefined,
      description: params.description || undefined,
      eTag: params.eTag,
      updated: params.updated,
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
        name: this.chat.getChatUser()?.name,
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

  getTyping(callback: (typingIndicators: TypingData[]) => unknown) {
    const typingListener = {
      signal: (event: SignalEvent) => {
        const { channel, message, publisher } = event
        if (channel !== this.id) return
        if (message.type !== "typing") return
        const indicator = this.typingIndicators.find((t) => t.userId === publisher)

        if (!message.value && indicator) {
          this.typingIndicators = this.typingIndicators.filter((t) => t.userId !== publisher)
          clearTimeout(indicator.timer)
        }

        if (message.value && indicator) {
          clearTimeout(indicator.timer)
          indicator.timer = setTimeout(() => {
            this.typingIndicators = this.typingIndicators.filter((t) => t.userId !== publisher)
            callback(this.typingIndicators.map((t) => ({ userId: t.userId, name: t.name })))
          }, this.chat.config.typingTimeout)
        }

        if (message.value && !indicator) {
          this.typingIndicators = [
            ...this.typingIndicators,
            {
              userId: publisher,
              name: message.name,
              timer: setTimeout(() => {
                this.typingIndicators = this.typingIndicators.filter((t) => t.userId !== publisher)
                callback(this.typingIndicators.map((t) => ({ userId: t.userId, name: t.name })))
              }, this.chat.config.typingTimeout),
            },
          ]
        }

        callback(this.typingIndicators.map((t) => ({ userId: t.userId, name: t.name })))
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
        callback(
          new Message({
            sdk: this.chat.sdk,
            timetoken: event.timetoken,
            content: event.message,
          })
        )
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

  // fetchHistory({ start, end, count = 20 }: { start?: string; end?: string; count?: number }) {
  //   // API should allow to differentiate between thread messages and
  //   // root messages
  // }

  // togglePinMessage(messageTimeToken: string) {}

  // getUnreadMessagesCount() {}

  // star() {}

  // getMembers() {}

  // getOnlineMembers() {}

  // search(phrase: string) {}
}
