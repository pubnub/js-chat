import PubNub, { UriFileInput } from "pubnub"
import { User } from "./user"

export type MessageContent = {
  type: "text"
  text: string
}

export type MessageConstructorParams = {
  sdk: PubNub
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
  private sdk: PubNub
  readonly timetoken: string
  readonly content: MessageContent

  // parentMessageId?: string
  // quote?: string
  // messagesInThreadCount?: number
  // timetoken!: string
  // destructionTime?: number
  // reactions: { reaction: string; count: number; users: User[] }[] = []

  constructor(params: MessageConstructorParams) {
    this.sdk = params.sdk
    this.timetoken = params.timetoken
    this.content = params.content
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
