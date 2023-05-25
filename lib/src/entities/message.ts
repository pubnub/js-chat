import { Chat } from "./chat"
import PubNub from "pubnub"
import { MessageActionType, MessageActions, DeleteParameters } from "../types"
import { Channel } from "./channel"

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
  get threadRootId() {
    if (!this.actions?.["threadRootId"]) {
      return false
    }

    return Object.keys(this.actions["threadRootId"])[0]
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
    newActions[type][value] ||= []
    newActions[type][value] = [...newActions[type][value], { uuid, actionTimetoken }]
    return newActions
  }

  /** @internal */
  private filterAction(action: PubNub.MessageAction) {
    const { actionTimetoken, type, value, uuid } = action
    const newActions = this.actions || {}
    newActions[type] ||= {}
    newActions[type][value] ||= []
    newActions[type][value] = newActions[type][value].filter(
      (r) => r.actionTimetoken !== actionTimetoken || r.uuid !== uuid
    )
    return newActions
  }

  /*
   * Message text
   */
  get text() {
    const type = MessageActionType.EDITED
    const edits = this.actions?.[type]
    if (!edits) return this.content.text
    const flatEdits = Object.entries(edits).map(([k, v]) => ({ value: k, ...v[0] }))
    const lastEdit = flatEdits.reduce((a, b) => (a.actionTimetoken > b.actionTimetoken ? a : b))
    return lastEdit.value
  }

  async editText(newText: string) {
    const type = MessageActionType.EDITED
    try {
      const { data } = await this.chat.sdk.addMessageAction({
        channel: this.channelId,
        messageTimetoken: this.timetoken,
        action: { type, value: newText },
      })
      const actions = this.assignAction(data)
      return this.clone({ actions })
    } catch (error) {
      throw error
    }
  }

  /*
   * Deletions
   */
  get deleted() {
    const type = MessageActionType.DELETED
    return !!this.actions?.[type]
  }

  async delete(params: DeleteParameters = {}) {
    const { soft } = params
    const type = MessageActionType.DELETED
    try {
      if (soft) {
        const { data } = await this.chat.sdk.addMessageAction({
          channel: this.channelId,
          messageTimetoken: this.timetoken,
          action: { type, value: type },
        })
        const actions = this.assignAction(data)
        await this.deleteThread(params)

        return this.clone({ actions })
      } else {
        const previousTimetoken = String(BigInt(this.timetoken) - BigInt(1))
        await this.chat.sdk.deleteMessages({
          channel: this.channelId,
          start: previousTimetoken,
          end: this.timetoken,
        })
        await this.deleteThread(params)

        return true
      }
    } catch (error) {
      throw error
    }
  }

  /**
   * Reactions
   */
  get reactions() {
    const type = MessageActionType.REACTIONS
    return this.actions?.[type] || {}
  }

  hasUserReaction(reaction: string) {
    return !!this.reactions[reaction]?.find((r) => r.uuid === this.chat.sdk.getUUID())
  }

  async toggleReaction(reaction: string) {
    const type = MessageActionType.REACTIONS
    const uuid = this.chat.sdk.getUUID()
    const messageTimetoken = this.timetoken
    const channel = this.channelId
    const value = reaction
    let actions

    try {
      const existingReaction = this.reactions[value]?.find((r) => r.uuid === uuid)
      if (existingReaction) {
        const actionTimetoken = String(existingReaction.actionTimetoken)
        await this.chat.sdk.removeMessageAction({ actionTimetoken, channel, messageTimetoken })
        actions = this.filterAction({ actionTimetoken, messageTimetoken, type, uuid, value })
      } else {
        const { data } = await this.chat.sdk.addMessageAction({
          channel,
          messageTimetoken,
          action: { type, value },
        })
        actions = this.assignAction(data)
      }
      return this.clone({ actions })
    } catch (error) {
      throw error
    }
  }

  /*
   * Other
   */
  async forward(channelId: string) {
    return this.chat.forwardMessage(this, channelId)
  }

  async pin() {
    const channel = await this.chat.getChannel(this.channelId)

    await this.chat.pinMessageToChannel(this, channel!)
  }

  /**
   * Threads
   */
  async getThread() {
    try {
      const threadChannelId = this.chat.getThreadId(this.channelId, this.timetoken)

      const response = await this.chat.sdk.objects.getChannelMetadata({
        channel: threadChannelId,
      })

      return Channel.fromDTO(this.chat, {
        ...response.data,
      })
    } catch (error) {
      const e = error as { status: { errorData: { status: number } } }
      if (e?.status?.errorData?.status === 404) {
        throw "This message is not a thread"
      } else throw error
    }
  }

  /** @internal */
  private async deleteThread(params: DeleteParameters = {}) {
    if (this.threadRootId) {
      const thread = await this.getThread()
      await thread.delete(params)
    }
  }
}
