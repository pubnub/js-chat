import { Chat } from "./chat"
import PubNub from "pubnub"
import { MessageActions, DeleteParameters } from "../types"

export type MessageContent = {
  type: "text"
  text: string
}

export type MessageFields = Pick<
  Message,
  "timetoken" | "content" | "channelId" | "userId" | "actions" | "meta"
>

type EnhancedMessageEvent = PubNub.MessageEvent & {
  userMetadata?: {
    [key: string]: any
  }
}

export class Message {
  private chat: Chat
  readonly timetoken: string
  readonly content: MessageContent
  readonly channelId: string
  readonly userId?: string
  readonly actions?: MessageActions
  readonly meta?: {
    [key: string]: any
  }

  /** @internal */
  constructor(chat: Chat, params: MessageFields) {
    this.chat = chat
    this.timetoken = params.timetoken
    this.content = params.content
    this.channelId = params.channelId
    Object.assign(this, params)
  }

  /** @internal */
  static fromDTO(
    chat: Chat,
    params: PubNub.FetchMessagesResponse["channels"]["channel"][0] | EnhancedMessageEvent
  ) {
    const data = {
      timetoken: String(params.timetoken),
      content: params.message,
      channelId: params.channel,
      userId: "publisher" in params ? params.publisher : params.uuid,
      actions: "actions" in params ? params.actions : undefined,
      meta:
        "meta" in params ? params.meta : "userMetadata" in params ? params.userMetadata : undefined,
    }

    return new Message(chat, data)
  }

  /** @internal */
  private clone(params: Partial<MessageFields>) {
    const { timetoken, content, channelId, userId, actions } = this
    const data = Object.assign({}, { timetoken, content, channelId, userId, actions }, params)
    return new Message(this.chat, data)
  }

  /** @internal */
  private assignAction(action: PubNub.MessageAction) {
    const { actionTimetoken, type, value, uuid } = action
    const newActions = this.actions || {}
    newActions[type] ||= {}
    newActions[type][value] = [{ actionTimetoken, uuid }]
    return newActions
  }

  getText() {
    const edits = this.actions?.edited
    if (!edits) return this.content.text
    const flatEdits = Object.entries(edits).map(([k, v]) => ({ value: k, ...v[0] }))
    const lastEdit = flatEdits.reduce((a, b) => (a.actionTimetoken > b.actionTimetoken ? a : b))
    return lastEdit.value
  }

  async editText(newText: string) {
    try {
      const { data } = await this.chat.sdk.addMessageAction({
        channel: this.channelId,
        messageTimetoken: this.timetoken,
        action: {
          type: "edited",
          value: newText,
        },
      })
      const actions = this.assignAction(data)
      return this.clone({ actions })
    } catch (error) {
      throw error
    }
  }

  // toggleReaction(reaction: string) {
  //   // toggle reaction
  // }

  // getReactions() {
  //   return this.reactions
  // }

  async delete(params: DeleteParameters = {}) {
    const { soft } = params
    try {
      if (soft) {
        const { data } = await this.chat.sdk.addMessageAction({
          channel: this.channelId,
          messageTimetoken: this.timetoken,
          action: {
            type: "deleted",
            value: "deleted",
          },
        })
        const actions = this.assignAction(data)
        return this.clone({ actions })
      } else {
        const previousTimetoken = String(BigInt(this.timetoken) - BigInt(1))
        await this.chat.sdk.deleteMessages({
          channel: this.channelId,
          start: previousTimetoken,
          end: this.timetoken,
        })
        return true
      }
    } catch (error) {
      throw error
    }
  }

  async forward(channelId: string) {
    return this.chat.forwardMessage(this, channelId)
  }

  // setEphemeral(timeInMs: number) {
  //   this.destructionTime = timeInMs
  // }

  // setThreadId(threadId: string) {
  //   this.parentMessageId = threadId
  // }
}
