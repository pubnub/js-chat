import { Chat } from "./chat"
import PubNub from "pubnub"
import {
  MessageActionType,
  MessageActions,
  DeleteParameters,
  MessageDTOParams,
  MessageType,
  TextMessageContent,
  ReportMessageContent,
} from "../types"
import { INTERNAL_ADMIN_CHANNEL } from "../constants"
import { MentionsUtils } from "../mentions-utils"

type GetLinkedTextParams = {
  mentionedUserRenderer: (userId: string, mentionedName: string) => any
  plainLinkRenderer: (link: string) => any
}

export type MessageFields = Pick<
  Message,
  "timetoken" | "content" | "channelId" | "userId" | "actions" | "meta"
>

export class Message {
  protected chat: Chat
  readonly timetoken: string
  readonly content: TextMessageContent | ReportMessageContent
  readonly channelId: string
  readonly userId: string
  readonly actions?: MessageActions
  readonly meta?: {
    [key: string]: any
  }

  get hasThread() {
    if (!this.actions?.["threadRootId"]) {
      return false
    }

    return !!Object.keys(this.actions["threadRootId"])[0]
  }

  get mentionedUsers() {
    if (this.meta?.mentionedUsers) {
      return this.meta.mentionedUsers
    }

    return {}
  }

  get type() {
    return this.content.type
  }

  get quotedMessage() {
    if (this.meta?.quotedMessage) {
      return this.meta.quotedMessage
    }

    return undefined
  }

  /** @internal */
  constructor(chat: Chat, params: MessageFields) {
    this.chat = chat
    this.timetoken = params.timetoken
    this.content = params.content
    this.channelId = params.channelId
    this.userId = params.userId
    Object.assign(this, params)
  }

  /** @internal */
  static fromDTO(chat: Chat, params: MessageDTOParams) {
    const data = {
      timetoken: String(params.timetoken),
      content: params.message,
      channelId: params.channel,
      userId: "publisher" in params ? params.publisher : params.uuid || "unknown-user",
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
   * Updates
   */
  static streamUpdatesOn(messages: Message[], callback: (messages: Message[]) => unknown) {
    if (!messages.length) throw "Cannot stream message updates on an empty list"
    const listener = {
      messageAction: (event: PubNub.MessageActionEvent) => {
        const message = messages.find((msg) => msg.timetoken === event.data.messageTimetoken)
        if (!message) return
        if (message.channelId !== event.channel) return
        let actions
        if (event.event === "added") actions = message.assignAction(event.data)
        if (event.event === "removed") actions = message.filterAction(event.data)
        const newMessage = message.clone({ actions })
        const newMessages = messages.map((msg) =>
          msg.timetoken === newMessage.timetoken ? newMessage : msg
        )
        callback(newMessages)
      },
    }
    const { chat } = messages[0]
    const removeListener = chat.addListener(listener)
    const subscriptions = messages
      .filter((m1, i) => messages.findIndex((m2) => m1.channelId === m2.channelId) === i)
      .map((message) => chat.subscribe(message.channelId))

    return () => {
      removeListener()
      subscriptions.map((unsub) => unsub())
    }
  }

  streamUpdates(callback: (message: Message) => unknown) {
    return Message.streamUpdatesOn([this], (messages) => callback(messages[0]))
  }

  /*
   * Message text
   */
  get text() {
    const type = MessageActionType.EDITED
    const edits = this.actions?.[type]
    if (!edits) return this.content.text || ""
    const flatEdits = Object.entries(edits).map(([k, v]) => ({ value: k, ...v[0] }))
    const lastEdit = flatEdits.reduce((a, b) => (a.actionTimetoken > b.actionTimetoken ? a : b))

    return lastEdit.value
  }

  getLinkedText(params?: Partial<GetLinkedTextParams>) {
    const text = this.text

    let { mentionedUserRenderer, plainLinkRenderer } = params || {}

    mentionedUserRenderer ||= function (userId, mentionedName) {
      return `<a href="https://pubnub.com/${userId}">@${mentionedName}</a> `
    }

    plainLinkRenderer ||= function (link) {
      const linkWithProtocol = link.startsWith("www.") ? `https://${link}` : link

      return `<a href="${linkWithProtocol}">${link}</a> `
    }

    return MentionsUtils.getLinkedText({
      text,
      userCallback: mentionedUserRenderer,
      plainLinkRenderer,
      mentionedUsers: this.mentionedUsers,
    })
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

  async report(reason: string) {
    try {
      const channel = INTERNAL_ADMIN_CHANNEL
      const message: ReportMessageContent = {
        type: MessageType.REPORT,
        text: this.text,
        reason,
        reportedMessageChannelId: this.channelId,
        reportedMessageTimetoken: this.timetoken,
        reportedUserId: this.userId,
      }
      return await this.chat.publish({ message, channel })
    } catch (error) {
      throw error
    }
  }

  /**
   * Threads
   */
  getThread() {
    return this.chat.getThreadChannel(this)
  }

  createThread() {
    return this.chat.createThreadChannel(this)
  }

  /** @internal */
  private async deleteThread(params: DeleteParameters = {}) {
    if (this.hasThread) {
      const thread = await this.getThread()
      await thread.delete(params)
    }
  }
}
