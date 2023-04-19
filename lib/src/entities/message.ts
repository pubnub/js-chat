import { Chat } from "./chat"
import { FetchMessagesResponse, MessageEvent } from "pubnub"

export type MessageContent = {
  type: "text"
  text: string
}

export type MessageConstructorParams = {
  timetoken: string
  content: MessageContent
  // parentMessageId?: string
  // sdk: PubNub
  // ephemeralDestructionTime?: number
  // text?: string
  // file?: UriFileInput
  // quote?: string
  // pushNotificationOptions?: unknown
}

export class Message {
  private chat: Chat
  readonly timetoken: string
  readonly content: MessageContent

  // parentMessageId?: string
  // quote?: string
  // messagesInThreadCount?: number
  // timetoken!: string
  // destructionTime?: number
  // reactions: { reaction: string; count: number; users: User[] }[] = []

  constructor(chat: Chat, params: MessageConstructorParams) {
    this.chat = chat
    this.timetoken = params.timetoken
    this.content = params.content
  }

  static fromDTO(
    chat: Chat,
    params: FetchMessagesResponse["channels"]["channel"][0] | MessageEvent
  ) {
    const data = {
      timetoken: String(params.timetoken),
      content: params.message,
    }

    return new Message(chat, data)
  }

  // edit(newText: string) {}

  // toggleReaction(reaction: string) {
  //   // toggle reaction
  // }

  // getReactions() {
  //   return this.reactions
  // }

  // delete(soft: boolean = true) {}

  // setEphemeral(timeInMs: number) {
  //   this.destructionTime = timeInMs
  // }

  // setThreadId(threadId: string) {
  //   this.parentMessageId = threadId
  // }
}
