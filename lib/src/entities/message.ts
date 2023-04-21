import { Chat } from "./chat"
import { FetchMessagesResponse, MessageEvent } from "pubnub"
import { MessageActions, DeleteParameters } from "../types"

export type MessageContent = {
  type: "text"
  text: string
}

export type MessageFields = Pick<Message, "timetoken" | "content" | "channelId">

export class Message {
  private chat: Chat
  readonly timetoken: string
  readonly content: MessageContent
  readonly channelId: string
  readonly userId?: string
  readonly actions?: MessageActions

  // parentMessageId?: string
  // quote?: string
  // messagesInThreadCount?: number
  // timetoken!: string
  // destructionTime?: number
  // reactions: { reaction: string; count: number; users: User[] }[] = []

  constructor(chat: Chat, params: MessageFields) {
    this.chat = chat
    this.timetoken = params.timetoken
    this.content = params.content
    this.channelId = params.channelId
    Object.assign(this, params)
  }

  static fromDTO(
    chat: Chat,
    params: FetchMessagesResponse["channels"]["channel"][0] | MessageEvent
  ) {
    const data = {
      timetoken: String(params.timetoken),
      content: params.message,
      channelId: params.channel,
      userId: "publisher" in params ? params.publisher : params.uuid,
      actions: "actions" in params ? params.actions : undefined,
    }

    return new Message(chat, data)
  }

  getText() {
    const edits = this.actions?.edited
    if (edits) {
      const flatEdits = Object.entries(edits).map(([k, v]) => ({ value: k, ...v[0] }))
      const lastEdit = flatEdits.reduce((a, b) => (a.actionTimetoken > b.actionTimetoken ? a : b))
      return lastEdit.value
    }
    return this.content.text
  }

  editText(newText: string) {
    this.chat.editMessageText(this.channelId, this.timetoken, newText)
    this.content.text = newText // TODO: should we do this?
  }

  // toggleReaction(reaction: string) {
  //   // toggle reaction
  // }

  // getReactions() {
  //   return this.reactions
  // }

  delete(params: DeleteParameters = {}) {
    this.chat.deleteMessage(this.channelId, this.timetoken, params)
  }

  // setEphemeral(timeInMs: number) {
  //   this.destructionTime = timeInMs
  // }

  // setThreadId(threadId: string) {
  //   this.parentMessageId = threadId
  // }
}
