import PubNub, { ListenerParameters, SignalEvent, MessageEvent } from "pubnub"
import { Message } from "./message"

type ChannelConstructor = {
  sdk: PubNub
  id: string
  name: string
}

export type TypingData<T> = {
  userId: string
  data?: T
}

export class Channel {
  private sdk: PubNub
  readonly id: string
  readonly name: string
  private listeners: ListenerParameters[] = []
  private subscribed = false
  private typingSent = false
  private typingTimeout?: ReturnType<typeof setTimeout>
  private typingData: TypingData<any>[] = []

  constructor(params: ChannelConstructor) {
    this.sdk = params.sdk
    this.id = params.id
    this.name = params.name
  }

  async sendText(text: string) {
    return await this.sdk.publish({
      channel: this.id,
      message: {
        type: "text",
        text,
      },
    })
  }

  async sendTyping<T>(value: boolean, options?: { timeout: number; data: T }) {
    if (this.typingTimeout) clearTimeout(this.typingTimeout)
    if (options?.timeout && value)
      this.typingTimeout = setTimeout(() => this.sendTyping(false), options.timeout)
    if (value === this.typingSent) return
    this.typingSent = !this.typingSent
    return await this.sdk.signal({
      channel: this.id,
      message: {
        type: "typing",
        value,
        ...(options?.data ? { data: options.data } : undefined),
      },
    })
  }

  getTyping<T>(callback: (typingData: TypingData<T>[]) => unknown) {
    const typingListener = {
      signal: (event: SignalEvent) => {
        const { channel, message, publisher } = event
        if (channel !== this.id) return
        if (message.type !== "typing") return
        if (!message.value) this.typingData = this.typingData.filter((d) => d.userId !== publisher)
        else {
          this.typingData = [
            ...this.typingData,
            {
              userId: publisher,
              ...(message.data ? { data: message.data } : undefined),
            },
          ]
        }
        callback(this.typingData)
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
