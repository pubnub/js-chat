import PubNub, {
  MessageEvent,
  ObjectCustom,
  GetChannelMembersParameters,
  SetMembershipsParameters,
} from "pubnub"
import { Chat } from "./chat"
import { Message } from "./message"
import { Event } from "./event"
import {
  SendTextOptionParams,
  DeleteParameters,
  ChannelDTOParams,
  MessageDraftConfig,
  MessageType,
  TextMessageContent,
  ChannelType,
} from "../types"
import { ExponentialRateLimiter } from "../rate-limiter"
import { Membership } from "./membership"
import { User } from "./user"
import { MentionsUtils } from "../mentions-utils"
import { MessageDraft } from "./message-draft"
import { getErrorProxiedEntity } from "../error-logging"

export type ChannelFields = Pick<
  Channel,
  "id" | "name" | "custom" | "description" | "updated" | "status" | "type"
>

export class Channel {
  protected chat: Chat
  readonly id: string
  readonly name?: string
  readonly custom?: ObjectCustom
  readonly description?: string
  readonly updated?: string
  readonly status?: string
  readonly type?: ChannelType
  /** @internal */
  private suggestedNames: Map<string, Membership[]>
  /** @internal */
  private disconnect?: () => void
  /** @internal */
  private typingSent = false
  /** @internal */
  private typingSentTimer?: ReturnType<typeof setTimeout>
  /** @internal */
  private typingIndicators: Map<string, ReturnType<typeof setTimeout>> = new Map()
  /** @internal */
  private sendTextRateLimiter: ExponentialRateLimiter

  /** @internal */
  constructor(chat: Chat, params: ChannelFields) {
    this.chat = chat
    this.id = params.id
    this.suggestedNames = new Map()
    this.sendTextRateLimiter = new ExponentialRateLimiter(
      params.type ? chat.config.rateLimitPerChannel[params.type] || 0 : 0,
      chat.config.rateLimitFactor
    )
    Object.assign(this, params)
  }

  /** @internal */
  static fromDTO(chat: Chat, params: ChannelDTOParams) {
    const data = {
      id: params.id,
      name: params.name || undefined,
      custom: params.custom || undefined,
      description: params.description || undefined,
      updated: params.updated || undefined,
      status: params.status || undefined,
      type: params.type || undefined,
    }

    return getErrorProxiedEntity(new Channel(chat, data), chat.errorLogger)
  }

  /*
   * CRUD
   */
  async update(data: Omit<ChannelFields, "id">) {
    return this.chat.updateChannel(this.id, data)
  }

  async delete(options: DeleteParameters = {}) {
    return this.chat.deleteChannel(this.id, options)
  }

  /*
   * Updates
   */
  static streamUpdatesOn(channels: Channel[], callback: (channels: Channel[]) => unknown) {
    if (!channels.length) throw "Cannot stream channel updates on an empty list"
    const listener = {
      objects: (event: PubNub.SetChannelMetadataEvent<PubNub.ObjectCustom>) => {
        if (event.message.type !== "channel") return
        const channel = channels.find((c) => c.id === event.channel)
        if (!channel) return
        const newChannel = Channel.fromDTO(channel.chat, event.message.data)
        const newChannels = channels.map((channel) =>
          channel.id === newChannel.id ? newChannel : channel
        )
        callback(newChannels)
      },
    }
    const { chat } = channels[0]
    const removeListener = chat.addListener(listener)
    const subscriptions = channels.map((channel) => chat.subscribe(channel.id))

    return () => {
      removeListener()
      subscriptions.map((unsub) => unsub())
    }
  }

  streamUpdates(callback: (channel: Channel) => unknown) {
    return Channel.streamUpdatesOn([this], (channels) => callback(channels[0]))
  }

  /*
   * Publishing
   */
  /** @internal */
  protected getPushPayload(text: string) {
    const { sendPushes, apnsTopic } = this.chat.config.pushNotifications
    if (!sendPushes) return {}

    const title = this.chat.currentUser.name || this.chat.currentUser.id
    const pushBuilder = PubNub.notificationPayload(title, text)
    const pushGateways = ["fcm"]
    pushBuilder.sound = "default"
    if (this.name) pushBuilder.subtitle = this.name
    if (apnsTopic) {
      pushBuilder.apns.configurations = [{ targets: [{ topic: apnsTopic }] }]
      pushGateways.push("apns2")
    }

    return pushBuilder.buildPayload(pushGateways)
  }

  /** @internal */
  protected emitUserMention({
    userId,
    timetoken,
    text,
  }: {
    userId: string
    timetoken: number
    text: string
  }) {
    const payload = {
      messageTimetoken: String(timetoken),
      channel: this.id,
      ...this.getPushPayload(text),
    }
    this.chat.emitEvent({
      channel: userId,
      type: "mention",
      method: "publish",
      payload,
    })
  }

  async sendText(text: string, options: SendTextOptionParams = {}) {
    const implementation = async () => {
      const { mentionedUsers, textLinks, quotedMessage, files, ...rest } = options
      const filesData: TextMessageContent["files"] = []

      if (quotedMessage && quotedMessage.channelId !== this.id) {
        throw "You cannot quote messages from other channels"
      }
      if (typeof text !== "string") {
        throw "You can only send text messages using this method"
      }

      if (files) {
        const filesArray = Array.isArray(files) ? files : Array.from(files)
        for (const file of filesArray) {
          const type = "type" in file ? file.type : file.mimeType
          const { name, id } = await this.chat.sdk.sendFile({
            channel: this.id,
            file,
            storeInHistory: false,
          })
          const url = this.chat.sdk.getFileUrl({ channel: this.id, id, name })
          filesData.push({ url, name, id, type })
        }
      }

      const message: TextMessageContent = {
        type: MessageType.TEXT,
        text,
        ...(filesData.length && { files: filesData }),
        ...this.getPushPayload(text),
      }

      const publishResponse = await this.chat.publish({
        ...rest,
        channel: this.id,
        message,
        meta: {
          ...(rest.meta || {}),
          mentionedUsers,
          textLinks,
          quotedMessage: quotedMessage
            ? {
                timetoken: quotedMessage.timetoken,
                text: quotedMessage.text,
                userId: quotedMessage.userId,
              }
            : undefined,
        },
      })

      if (mentionedUsers) {
        Object.keys(mentionedUsers).forEach((key) => {
          const userId = mentionedUsers[Number(key)].id

          this.emitUserMention({ userId, timetoken: publishResponse.timetoken, text })
        })
      }

      return publishResponse
    }

    return this.sendTextRateLimiter.runWithinLimits(implementation)
  }

  async forwardMessage(message: Message) {
    return this.chat.forwardMessage(message, this.id)
  }

  /*
   * Typing indicator
   */
  /* @internal */
  private async sendTypingSignal(value: boolean) {
    return await this.chat.emitEvent({
      channel: this.id,
      method: "signal",
      type: "typing",
      payload: { value },
    })
  }

  async startTyping() {
    if (this.type === "public") throw "Typing indicators are not supported in Public chats."
    if (this.typingSent) return
    this.typingSent = true
    this.typingSentTimer = setTimeout(
      () => (this.typingSent = false),
      this.chat.config.typingTimeout - 1000
    )
    return await this.sendTypingSignal(true)
  }

  async stopTyping() {
    if (this.type === "public") throw "Typing indicators are not supported in Public chats."
    clearTimeout(this.typingSentTimer)
    if (!this.typingSent) return
    this.typingSent = false
    return await this.sendTypingSignal(false)
  }

  getTyping(callback: (typingUserIds: string[]) => unknown) {
    if (this.type === "public") throw "Typing indicators are not supported in Public chats."
    const handler = (event: Event<"typing">) => {
      const { channelId, payload, userId, type } = event
      if (channelId !== this.id) return
      if (type !== "typing") return
      const timer = this.typingIndicators.get(userId)
      if (!payload.value && timer) {
        clearTimeout(timer)
        this.typingIndicators.delete(userId)
      }
      if (payload.value && timer) {
        clearTimeout(timer)
        const newTimer = setTimeout(() => {
          this.typingIndicators.delete(userId)
          callback(Array.from(this.typingIndicators.keys()))
        }, this.chat.config.typingTimeout)
        this.typingIndicators.set(userId, newTimer)
      }
      if (payload.value && !timer) {
        const newTimer = setTimeout(() => {
          this.typingIndicators.delete(userId)
          callback(Array.from(this.typingIndicators.keys()))
        }, this.chat.config.typingTimeout)
        this.typingIndicators.set(userId, newTimer)
      }
      callback(Array.from(this.typingIndicators.keys()))
    }

    return this.chat.listenForEvents({
      channel: this.id,
      method: "signal",
      type: "typing",
      callback: handler,
    })
  }

  /*
   * Streaming messages
   */
  connect(callback: (message: Message) => void) {
    const listener = {
      message: (event: MessageEvent) => {
        if (event.channel !== this.id) return
        if (event.message.type !== "text") return
        callback(Message.fromDTO(this.chat, event))
      },
    }

    const removeListener = this.chat.addListener(listener)
    const unsubscribe = this.chat.subscribe(this.id)

    return () => {
      removeListener()
      unsubscribe()
    }
  }

  /*
   * Presence
   */
  async whoIsPresent() {
    return this.chat.whoIsPresent(this.id)
  }

  async isPresent(userId: string) {
    return this.chat.isPresent(userId, this.id)
  }

  async getHistory(
    params: { startTimetoken?: string; endTimetoken?: string; count?: number } = {}
  ) {
    try {
      const options = {
        channels: [this.id],
        count: params.count || 25,
        start: params.startTimetoken,
        end: params.endTimetoken,
        includeMessageActions: true,
        includeMeta: true,
      }

      const response = await this.chat.sdk.fetchMessages(options)

      return {
        messages:
          response.channels[this.id]?.map((messageObject) =>
            Message.fromDTO(this.chat, messageObject)
          ) || [],
        isMore: response.channels[this.id]?.length === (params.count || 25),
      }
    } catch (error) {
      throw error
    }
  }

  async getMessage(timetoken: string) {
    const previousTimetoken = String(BigInt(timetoken) + BigInt(1))
    const response = await this.getHistory({
      endTimetoken: timetoken,
      startTimetoken: previousTimetoken,
    })

    return response.messages[0]
  }

  async join(
    callback: (message: Message) => void,
    params: Omit<SetMembershipsParameters<ObjectCustom>, "channels" | "include" | "filter"> & {
      custom?: ObjectCustom
    } = {}
  ) {
    try {
      const { custom, ...rest } = params
      const membershipsResponse = await this.chat.sdk.objects.setMemberships({
        ...rest,
        channels: [{ id: this.id, custom }],
        include: {
          totalCount: true,
          customFields: true,
          channelFields: true,
          customChannelFields: true,
        },
        filter: `channel.id == '${this.id}'`,
      })

      this.disconnect = this.connect(callback)

      return Membership.fromMembershipDTO(
        this.chat,
        membershipsResponse.data[0],
        this.chat.currentUser as User
      )
    } catch (error) {
      throw error
    }
  }

  async leave() {
    if (this.disconnect) this.disconnect()

    try {
      await this.chat.sdk.objects.removeMemberships({
        channels: [this.id],
      })
      return true
    } catch (error) {
      throw error
    }
  }

  async getMembers(params: Omit<GetChannelMembersParameters, "channel" | "include"> = {}) {
    const membersResponse = await this.chat.sdk.objects.getChannelMembers({
      ...params,
      channel: this.id,
      include: {
        totalCount: true,
        customFields: true,
        UUIDFields: true,
        customUUIDFields: true,
      },
    })

    return {
      page: {
        next: membersResponse.next,
        prev: membersResponse.prev,
      },
      total: membersResponse.totalCount,
      status: membersResponse.status,
      members: membersResponse.data.map((m) => Membership.fromChannelMemberDTO(this.chat, m, this)),
    }
  }

  async invite(user: User) {
    if (this.type === "public") throw "Channel invites are not supported in Public chats."
    try {
      const channelMembers = await this.getMembers({ filter: `uuid.id == '${user.id}'` })

      // already a member
      if (channelMembers.members.length) {
        return channelMembers.members[0]
      }

      const response = await this.chat.sdk.objects.setMemberships({
        uuid: user.id,
        channels: [this.id],
        include: {
          totalCount: true,
          customFields: true,
          channelFields: true,
          customChannelFields: true,
        },
        filter: `channel.id == '${this.id}'`,
      })

      return Membership.fromMembershipDTO(this.chat, response.data[0], user)
    } catch (error) {
      throw error
    }
  }

  async inviteMultiple(users: User[]) {
    if (this.type === "public") throw "Channel invites are not supported in Public chats."
    const uuids = users.map((u) => u.id)
    const filter = uuids.map((uuid) => `uuid.id == '${uuid}'`).join(" || ")

    try {
      const response = await this.chat.sdk.objects.setChannelMembers({
        channel: this.id,
        uuids,
        include: {
          totalCount: true,
          customFields: true,
          UUIDFields: true,
          customUUIDFields: true,
        },
        filter,
      })

      return response.data.map((dataPoint) =>
        Membership.fromChannelMemberDTO(this.chat, dataPoint, this)
      )
    } catch (error) {
      throw error
    }
  }

  async pinMessage(message: Message) {
    const response = await this.chat.pinMessageToChannel(message, this)
    return Channel.fromDTO(this.chat, response.data)
  }

  async unpinMessage() {
    const response = await this.chat.pinMessageToChannel(null, this)
    return Channel.fromDTO(this.chat, response.data)
  }

  async getPinnedMessage() {
    try {
      const pinnedMessageTimetoken = this.custom?.["pinnedMessageTimetoken"]
      const pinnedMessageChannelID = this.custom?.["pinnedMessageChannelID"]

      if (!pinnedMessageTimetoken || !pinnedMessageChannelID) {
        return null
      }

      if (pinnedMessageChannelID === this.id) {
        return this.getMessage(String(pinnedMessageTimetoken))
      }

      const threadChannel = await this.chat.getChannel(String(pinnedMessageChannelID))

      if (!threadChannel) {
        throw "The thread channel does not exist"
      }

      return threadChannel.getMessage(String(pinnedMessageTimetoken))
    } catch (error) {
      console.error(error)
      return null
    }
  }

  async getUserSuggestions(
    text: string,
    options: { limit: number } = { limit: 10 }
  ): Promise<Membership[]> {
    const cacheKey = MentionsUtils.getPhraseToLookFor(text)

    if (!cacheKey) {
      return []
    }

    if (this.suggestedNames.get(cacheKey)) {
      return this.suggestedNames.get(cacheKey) as Membership[]
    }

    const membersResponse = await this.getMembers({
      filter: `uuid.name LIKE "${cacheKey}*"`,
      limit: options.limit,
    })

    this.suggestedNames.set(cacheKey, membersResponse.members)

    return this.suggestedNames.get(cacheKey) as Membership[]
  }

  createMessageDraft(config?: Partial<MessageDraftConfig>) {
    return getErrorProxiedEntity(new MessageDraft(this.chat, this, config), this.chat.errorLogger)
  }

  registerForPush() {
    return this.chat.registerPushChannels([this.id])
  }

  unregisterFromPush() {
    return this.chat.unregisterPushChannels([this.id])
  }

  async streamReadReceipts(callback: (receipts: { [key: string]: string[] }) => unknown) {
    if (this.type === "public") throw "Read receipts are not supported in Public chats."
    function generateReceipts() {
      const receipts: { [key: string]: string[] } = {}
      timetokensPerUser.forEach((timetoken, userId) => {
        receipts[timetoken] ??= []
        receipts[timetoken].push(userId)
      })
      return receipts
    }

    const { members } = await this.getMembers()
    const timetokensPerUser = new Map<string, string>()
    members.forEach((m) => {
      const lastTimetoken = m.custom?.lastReadMessageTimetoken
      if (lastTimetoken) timetokensPerUser.set(m.user.id, String(lastTimetoken))
    })
    callback(generateReceipts())

    const unsubscribe = this.chat.listenForEvents({
      channel: this.id,
      type: "receipt",
      method: "signal",
      callback: (event) => {
        const { userId, payload } = event
        timetokensPerUser.set(userId, payload.messageTimetoken)
        callback(generateReceipts())
      },
    })

    return unsubscribe
  }

  async getFiles(params: Omit<PubNub.ListFilesParameters, "channel"> = {}) {
    const response = await this.chat.sdk.listFiles({ channel: this.id, ...params })
    const filesWithUrls = response.data.map((f) => {
      const { name, id } = f
      const url = this.chat.sdk.getFileUrl({ channel: this.id, id, name })
      return { name, id, url }
    })
    return {
      files: filesWithUrls,
      next: response.next,
      total: response.count,
    }
  }

  async deleteFile(params: { id: string; name: string }) {
    return this.chat.sdk.deleteFile({ channel: this.id, ...params })
  }
}
