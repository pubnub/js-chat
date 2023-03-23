import PubNub, { ListenerParameters, SignalEvent, MessageEvent } from "pubnub"
import { Message } from "./message"
import { SendTextOptionParams } from "../types";

type ChannelConstructor = {
  sdk: PubNub
  id: string
  name: string
}

export class Channel {
  private sdk: PubNub
  readonly id: string
  readonly name: string
  private listeners: ListenerParameters[] = []
  private subscribed = false

  constructor(params: ChannelConstructor) {
    this.sdk = params.sdk
    this.id = params.id
    this.name = params.name
  }

  async sendText(text: string, options: SendTextOptionParams = {}) {
    return await this.sdk.publish({
      channel: this.id,
      message: {
        type: "text",
        text,
      },
      ...options,
    })
  }

  async sendTyping(value: boolean) {
    return await this.sdk.signal({
      channel: this.id,
      message: {
        type: "typing",
        value,
      },
    })
  }

  getTyping(callback: (value: boolean) => unknown) {
    const typingListener = {
      signal: (event: SignalEvent) => {
        const { message, channel } = event
        if (channel !== this.id) return
        if (message.type !== "typing") return
        callback(message.value)
      },
    }

    this.listeners.push(typingListener)
    this.sdk.addListener(typingListener)
    if (!this.subscribed) this.sdk.subscribe({ channels: [this.id] })
  }

  connect(callback: (message: Message) => void) {
    const messageListener = {
      message: (event: MessageEvent) => {
        const { message, channel } = event
        if (channel !== this.id) return
        if (!["text"].includes(message.type)) return
        callback(
          new Message({
            sdk: this.sdk,
            timetoken: event.timetoken,
            content: event.message,
          })
        )
      },
    }

    this.listeners.push(messageListener)
    this.sdk.addListener(messageListener)
    if (!this.subscribed) this.sdk.subscribe({ channels: [this.id] })
  }

  disconnect() {
    this.listeners.forEach((listener) => this.sdk.removeListener(listener))
    this.listeners = []
    if (this.subscribed) this.sdk.unsubscribe({ channels: [this.id] })
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
