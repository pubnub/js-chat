import PubNub, { UriFileInput } from "pubnub"
import { User } from "./User"

export type MessageConstructorParams = {
  timetoken: string
  parentMessageId?: string
  sdk: PubNub
  ephemeralDestructionTime?: number
  text?: string
  file?: UriFileInput
  quote?: string
  pushNotificationOptions?: unknown
}

export class Message {
  readonly sdk!: PubNub
  parentMessageId?: string
  quote?: string
  messagesInThreadCount?: number
  timetoken!: string
  destructionTime?: number
  reactions: { reaction: string; count: number; users: User[] }[] = []

  constructor(params: MessageConstructorParams) {
    this.sdk = params.sdk
  }

  edit(newText: string) {}

  toggleReaction(reaction: string) {
    // toggle reaction
  }

  getReactions() {
    return this.reactions
  }

  delete(soft: boolean = true) {}

  setEphemeral(timeInMs: number) {
    this.destructionTime = timeInMs
  }

  setThreadId(threadId: string) {
    this.parentMessageId = threadId
  }
}
