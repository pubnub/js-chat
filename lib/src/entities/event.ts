import { Chat } from "./chat"
import { EventContent, EventType } from "../types"

export type EventFields = Pick<Event, "timetoken" | "type" | "payload" | "channelId" | "userId">

export class Event {
  protected chat: Chat
  readonly timetoken: string
  readonly type: EventType
  readonly payload: EventContent
  readonly channelId: string
  readonly userId: string

  /** @internal */
  constructor(chat: Chat, params: EventFields) {
    this.chat = chat
    this.timetoken = params.timetoken
    this.type = params.type
    this.payload = params.payload
    this.channelId = params.channelId
    this.userId = params.userId
    Object.assign(this, params)
  }

  /** @internal */
  static fromDTO(
    chat: Chat,
    params: {
      timetoken: string | number
      message: any
      channel: string
      uuid?: string
      publisher?: string
    }
  ) {
    const { type, ...payload } = params.message
    const data = {
      timetoken: String(params.timetoken),
      type,
      payload,
      channelId: params.channel,
      userId: "publisher" in params ? (params.publisher as string) : params.uuid || "unknown-user",
    }

    return new Event(chat, data)
  }
}
