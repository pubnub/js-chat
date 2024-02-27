import { MessageEvent, FetchMessagesResponse } from "pubnub"
import { Chat } from "./chat"
import { EventPayloads, EventType, TextMessageContent } from "../types"
import { getErrorProxiedEntity } from "../error-logging"

export type EventFields<T extends EventType> = Pick<
  Event<T>,
  "timetoken" | "type" | "payload" | "channelId" | "userId"
>

export class Event<T extends EventType> {
  private chat: Chat
  readonly timetoken: string
  readonly type: T
  readonly payload: EventPayloads[T]
  readonly channelId: string
  readonly userId: string

  /** @internal */
  constructor(chat: Chat, params: EventFields<T>) {
    this.chat = chat
    this.timetoken = params.timetoken
    this.type = params.type
    this.payload = params.payload
    this.channelId = params.channelId
    this.userId = params.userId
    Object.assign(this, params)
  }

  /** @internal */
  static fromDTO<T extends EventType>(
    chat: Chat,
    params:
      | Pick<MessageEvent, "timetoken" | "message" | "channel" | "publisher">
      | Pick<
          FetchMessagesResponse["channels"][string][number],
          "timetoken" | "message" | "channel" | "uuid"
        >
  ): Event<T> {
    const { type, ...payload } = params.message
    const data = {
      timetoken: String(params.timetoken),
      type,
      payload,
      channelId: params.channel,
      userId: "publisher" in params ? (params.publisher as string) : params.uuid || "unknown-user",
    }

    return getErrorProxiedEntity(new Event(chat, data), chat.errorLogger)
  }
}
