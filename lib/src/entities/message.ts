import { Chat } from "./chat"
import PubNub from "pubnub"
import { DeleteParameters, MessageActions, MessageDTOParams, TextMessageContent } from "../types"
import { INTERNAL_ADMIN_CHANNEL, INTERNAL_MODERATION_PREFIX } from "../constants"
import { getErrorProxiedEntity } from "../error-logging"
import { MessageElementsUtils } from "../message-elements-utils"
import { defaultGetMessageResponseBody } from "../default-values"

export type MessageFields = Pick<
  Message,
  "timetoken" | "content" | "channelId" | "userId" | "actions" | "meta"
>

export class Message {
  protected chat: Chat
  readonly timetoken: string
  readonly content: TextMessageContent
  readonly channelId: string
  readonly userId: string
  readonly actions?: MessageActions
  readonly meta?: {
    [key: string]: any
  }
  readonly error?: string

  get hasThread() {
    if (!this.actions?.["threadRootId"]) {
      return false
    }
    const key = Object.keys(this.actions["threadRootId"])[0]

    return !!key && !!this.actions["threadRootId"][key].length
  }

  get mentionedUsers() {
    if (this.meta?.mentionedUsers) {
      return this.meta.mentionedUsers
    }

    return {}
  }

  get referencedChannels() {
    if (this.meta?.referencedChannels) {
      return this.meta.referencedChannels
    }

    return {}
  }

  get textLinks() {
    if (this.meta?.textLinks) {
      return this.meta.textLinks
    }

    return []
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

  get files() {
    return this.content.files || []
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
  static fromDTO(chat: Chat, params: MessageDTOParams): Message {
    const getMessageResponseBody =
      chat.config.customPayloads.getMessageResponseBody || defaultGetMessageResponseBody

    const data = {
      timetoken: String(params.timetoken),
      content: getMessageResponseBody(params),
      channelId: params.channel,
      userId: "publisher" in params ? params.publisher : params.uuid || "unknown-user",
      actions: "actions" in params ? params.actions : undefined,
      meta:
        "meta" in params ? params.meta : "userMetadata" in params ? params.userMetadata : undefined,
      error: params.error || undefined,
    }

    return getErrorProxiedEntity(new Message(chat, data), chat.errorLogger)
  }

  /** @internal */
  protected clone(params: Partial<MessageFields>) {
    const { timetoken, content, channelId, userId, actions, meta } = this
    const data = Object.assign({}, { timetoken, content, channelId, userId, actions, meta }, params)
    return new Message(this.chat, data)
  }

  /** @internal */
  protected assignAction(action: PubNub.MessageAction) {
    const { actionTimetoken, type, value, uuid } = action
    const newActions = this.actions || {}
    newActions[type] ||= {}
    newActions[type][value] ||= []
    if (newActions[type][value].find((a) => a.actionTimetoken === actionTimetoken)) {
      return newActions
    }
    newActions[type][value] = [...newActions[type][value], { uuid, actionTimetoken }]
    return newActions
  }

  /** @internal */
  protected filterAction(action: PubNub.MessageAction) {
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
    const edits = this.actions?.[this.chat.editMessageActionName]
    if (!edits) return this.content.text || ""
    const flatEdits = Object.entries(edits).map(([k, v]) => ({ value: k, ...v[0] }))
    const lastEdit = flatEdits.reduce((a, b) => (a.actionTimetoken > b.actionTimetoken ? a : b))

    return lastEdit.value
  }

  getMessageElements() {
    const text = this.text

    return MessageElementsUtils.getMessageElements({
      text,
      textLinks: this.textLinks,
      mentionedUsers: this.mentionedUsers,
      referencedChannels: this.referencedChannels,
    })
  }

  /**
    @deprecated use getMessageElements instead
   */
  getLinkedText() {
    return this.getMessageElements()
  }

  async editText(newText: string) {
    const type = this.chat.editMessageActionName
    try {
      if (this.meta?.PUBNUB_INTERNAL_AUTOMODERATED && !this.chat.currentUser.isInternalModerator) {
        throw "The automoderated message can no longer be edited"
      }

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
    const type = this.chat.deleteMessageActionName
    return !!this.actions?.[type] && !!this.actions?.[type][type].length
  }

  async delete(params: DeleteParameters & { preserveFiles?: boolean } = {}) {
    const { soft } = params
    const type = this.chat.deleteMessageActionName
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
        if (this.files.length && !params.preserveFiles) {
          for (const file of this.files) {
            const { id, name } = file
            await this.chat.sdk.deleteFile({ channel: this.channelId, id, name })
          }
        }

        return true
      }
    } catch (error) {
      throw error
    }
  }

  async restore() {
    if (!this.deleted) {
      console.warn("This message has not been deleted")
      return
    }
    const deletedActions =
      this.actions?.[this.chat.deleteMessageActionName]?.[this.chat.deleteMessageActionName]
    if (!deletedActions) {
      console.warn("Malformed data", deletedActions)
      return
    }

    // in practise it's possible to have a few soft deletions on a message
    // so take care of it
    for (let i = 0; i < deletedActions.length; i++) {
      const deleteActionTimetoken = deletedActions[i].actionTimetoken
      await this.chat.sdk.removeMessageAction({
        channel: this.channelId,
        messageTimetoken: this.timetoken,
        actionTimetoken: String(deleteActionTimetoken),
      })
    }
    const [{ data }, restoredThreadAction] = await Promise.all([
      this.chat.sdk.getMessageActions({
        channel: this.channelId,
        start: this.timetoken,
        end: this.timetoken,
      }),
      this.restoreThread(),
    ])

    let allActions = this.actions || {}
    delete allActions[this.chat.deleteMessageActionName]

    for (let i = 0; i < data.length; i++) {
      const actions = this.assignAction(data[i])
      allActions = {
        ...allActions,
        ...actions,
      }
    }
    if (restoredThreadAction) {
      allActions = {
        ...allActions,
        ...this.assignAction(restoredThreadAction.data),
      }
    }

    return this.clone({ actions: allActions })
  }

  /**
   * Reactions
   */
  get reactions() {
    const type = this.chat.reactionsActionName
    return this.actions?.[type] || {}
  }

  hasUserReaction(reaction: string) {
    return !!this.reactions[reaction]?.find((r) => r.uuid === this.chat.sdk.getUUID())
  }

  async toggleReaction(reaction: string) {
    const type = this.chat.reactionsActionName
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

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    await this.chat.pinMessageToChannel(this, channel!)
  }

  /** @deprecated */
  async DEPRECATED_report(reason: string) {
    const channel = INTERNAL_ADMIN_CHANNEL
    const payload = {
      text: this.text,
      reason,
      reportedMessageChannelId: this.channelId,
      reportedMessageTimetoken: this.timetoken,
      reportedUserId: this.userId,
    }
    return await this.chat.emitEvent({ channel, type: "report", payload })
  }

  async report(reason: string) {
    const channel = `${INTERNAL_MODERATION_PREFIX}${this.channelId}`
    const payload = {
      text: this.text,
      reason,
      reportedMessageChannelId: this.channelId,
      reportedMessageTimetoken: this.timetoken,
      reportedUserId: this.userId,
    }
    return await this.chat.emitEvent({ channel, type: "report", payload })
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

  removeThread() {
    return this.chat.removeThreadChannel(this)
  }

  /** @internal */
  private async deleteThread(params: DeleteParameters = {}) {
    if (this.hasThread) {
      const thread = await this.getThread()
      await thread.delete(params)
    }
  }

  /** @internal */
  private async restoreThread() {
    return this.chat.restoreThreadChannel(this)
  }
}
