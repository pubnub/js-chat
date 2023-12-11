import PubNub, { GetMembershipsParametersv2, MessageEvent, SignalEvent } from "pubnub"
import { Channel, ChannelFields } from "./channel"
import { User, UserFields } from "./user"
import {
  DeleteParameters,
  TextMessageContent,
  ChannelType,
  ErrorLoggerImplementation,
  UserMentionData,
  SendTextOptionParams,
  EventType,
  EmitEventParams,
  GenericEventParams,
} from "../types"
import { Message } from "./message"
import { Event } from "./event"
import { Membership } from "./membership"
import { MESSAGE_THREAD_ID_PREFIX, INTERNAL_MODERATION_PREFIX } from "../constants"
import { ThreadChannel } from "./thread-channel"
import { MessageElementsUtils } from "../message-elements-utils"
import { getErrorProxiedEntity, ErrorLogger } from "../error-logging"
import { cyrb53a } from "../hash"
import { uuidv4 } from "../uuidv4"

export type ChatConfig = {
  saveDebugLog: boolean
  typingTimeout: number
  storeUserActivityInterval: number
  storeUserActivityTimestamps: boolean
  pushNotifications: {
    sendPushes: boolean
    deviceToken?: string
    deviceGateway: "apns2" | "gcm"
    apnsTopic?: string
    apnsEnvironment: "development" | "production"
  }
  rateLimitFactor: number
  rateLimitPerChannel: {
    [key in ChannelType]: number
  }
  errorLogger?: ErrorLoggerImplementation
}

type ChatConstructor = Partial<ChatConfig> & PubNub.PubnubConfig

export class Chat {
  readonly sdk: PubNub
  readonly config: ChatConfig
  private user: User
  /** @internal */
  private lastSavedActivityInterval?: ReturnType<typeof setInterval>
  /** @internal */
  private suggestedNamesCache: Map<string, User[]>
  /** @internal */
  private suggestedChannelsCache: Map<string, Channel[]>
  /* @internal */
  private subscriptions: { [channel: string]: Set<string> }
  /** @internal */
  errorLogger: ErrorLogger

  /** @internal */
  private constructor(params: ChatConstructor) {
    const {
      saveDebugLog,
      typingTimeout,
      storeUserActivityInterval,
      storeUserActivityTimestamps,
      pushNotifications,
      rateLimitFactor,
      rateLimitPerChannel,
      errorLogger,
      ...pubnubConfig
    } = params

    this.errorLogger = new ErrorLogger(errorLogger)

    try {
      if (storeUserActivityInterval && storeUserActivityInterval < 60000) {
        throw "storeUserActivityInterval must be at least 60000ms"
      }

      if (pushNotifications?.deviceGateway === "apns2" && !pushNotifications?.apnsTopic) {
        throw "apnsTopic has to be defined when deviceGateway is set to apns2"
      }
    } catch (error) {
      this.errorLogger.setItem("PushNotificationError", error, arguments)
      throw error
    }

    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    const pubnub = new PubNub(pubnubConfig) as any
    pubnub._config._addPnsdkSuffix("chat-sdk", `__PLATFORM__/__VERSION__`)
    this.sdk = pubnub

    this.user = new User(this, {
      id: "userId" in pubnubConfig ? pubnubConfig.userId : pubnubConfig.uuid,
    })
    this.subscriptions = {}
    this.suggestedNamesCache = new Map<string, User[]>()
    this.suggestedChannelsCache = new Map<string, Channel[]>()

    this.config = {
      saveDebugLog: saveDebugLog || false,
      typingTimeout: typingTimeout || 5000,
      storeUserActivityInterval: storeUserActivityInterval || 600000,
      storeUserActivityTimestamps: storeUserActivityTimestamps || false,
      pushNotifications: pushNotifications || {
        sendPushes: false,
        apnsEnvironment: "development",
        deviceGateway: "gcm",
      },
      rateLimitFactor: rateLimitFactor || 2,
      rateLimitPerChannel: rateLimitPerChannel || {
        direct: 0,
        group: 0,
        public: 0,
        unknown: 0,
      },
    }
  }

  static async init(params: ChatConstructor) {
    const chat = new Chat(params)

    chat.user =
      (await chat.getUser(chat.sdk.getUUID())) ||
      (await chat.createUser(chat.sdk.getUUID(), { name: chat.sdk.getUUID() }))

    if (params.storeUserActivityTimestamps) {
      chat.storeUserActivityTimestamp()
    }

    const proxiedChat = getErrorProxiedEntity(chat, chat.errorLogger)

    return proxiedChat
  }

  /* @internal */
  subscribe(channel: string) {
    const subscriptionId = Math.floor(Math.random() * Date.now()).toString(36)
    const channelSubIds = (this.subscriptions[channel] ||= new Set())
    if (!channelSubIds.size) this.sdk.subscribe({ channels: [channel], withPresence: true })
    channelSubIds.add(subscriptionId)

    return () => {
      if (!channelSubIds || !channelSubIds.has(subscriptionId)) return
      channelSubIds.delete(subscriptionId)
      if (!channelSubIds.size) this.sdk.unsubscribe({ channels: [channel] })
    }
  }

  /* @internal */
  addListener(listener: PubNub.ListenerParameters) {
    this.sdk.addListener(listener)

    return () => {
      this.sdk.removeListener(listener)
    }
  }

  /* @internal */
  publish(params: PubNub.PublishParameters & { message: TextMessageContent }) {
    return this.sdk.publish(params)
  }

  /* @internal */
  signal(params: { channel: string; message: any }) {
    return this.sdk.signal(params)
  }

  /**
   * Events
   */
  /** @internal */
  private methodForEvent(event: { type: EventType; method?: "signal" | "publish" }) {
    switch (event.type) {
      case "custom":
        return event.method
      case "typing":
      case "receipt":
        return "signal"
      default:
        return "publish"
    }
  }

  emitEvent(event: EmitEventParams) {
    const { payload, type } = event
    const channel = "channel" in event ? event.channel : event.user
    const method = this.methodForEvent(event)
    const message = { ...payload, type }
    const params = { channel, message }
    return method === "signal" ? this.signal(params) : this.publish(params)
  }

  listenForEvents<T extends EventType>(
    event: GenericEventParams<T> & { callback: (event: Event<T>) => unknown }
  ) {
    const { type, callback } = event
    const channel = "channel" in event ? event.channel : event.user
    const method = this.methodForEvent(event)

    const handler = (event: MessageEvent | SignalEvent) => {
      if (event.channel !== channel) return
      if (event.message.type !== type) return
      const { channel: ch, timetoken, message, publisher } = event
      callback(Event.fromDTO(this, { channel: ch, timetoken, message, publisher }))
    }
    const listener = {
      ...(method === "signal" ? { signal: handler } : { message: handler }),
    }
    const removeListener = this.addListener(listener)
    const unsubscribe = this.subscribe(channel)
    return () => {
      removeListener()
      unsubscribe()
    }
  }

  async getEventsHistory(params: {
    channel: string
    startTimetoken?: string
    endTimetoken?: string
    count?: number
  }) {
    try {
      const options = {
        channels: [params.channel],
        count: params.count || 100,
        start: params.startTimetoken,
        end: params.endTimetoken,
        includeMessageActions: false,
        includeMeta: false,
      }

      const response = await this.sdk.fetchMessages(options)

      return {
        events:
          response.channels[params.channel]?.map((messageObject) =>
            Event.fromDTO(this, messageObject)
          ) || [],
        isMore: response.channels[params.channel]?.length === (params.count || 100),
      }
    } catch (error) {
      throw error
    }
  }

  /**
   * Current user
   */
  get currentUser() {
    return this.user
  }

  /**
   * Users
   */
  async getUser(id: string) {
    if (!id.length) throw "ID is required"
    try {
      const response = await this.sdk.objects.getUUIDMetadata({ uuid: id })
      return User.fromDTO(this, response.data)
    } catch (error) {
      const e = error as { status: { errorData: { status: number } } }
      if (e?.status?.errorData?.status === 404) return null
      else throw error
    }
  }

  async createUser(id: string, data: Omit<UserFields, "id">) {
    if (!id.length) throw "ID is required"
    try {
      const existingUser = await this.getUser(id)
      if (existingUser) throw "User with this ID already exists"
      const response = await this.sdk.objects.setUUIDMetadata({ uuid: id, data })
      return User.fromDTO(this, response.data)
    } catch (error) {
      throw error
    }
  }

  async updateUser(id: string, data: Omit<UserFields, "id">) {
    if (!id.length) throw "ID is required"
    try {
      const existingUser = await this.getUser(id)
      if (!existingUser) throw "User with this ID does not exist"
      const response = await this.sdk.objects.setUUIDMetadata({ uuid: id, data })
      return User.fromDTO(this, response.data)
    } catch (error) {
      throw error
    }
  }

  async deleteUser(id: string, params: DeleteParameters = {}) {
    if (!id.length) throw "ID is required"
    const { soft } = params
    try {
      if (soft) {
        const response = await this.sdk.objects.setUUIDMetadata({
          uuid: id,
          data: { status: "deleted" },
        } as PubNub.SetUUIDMetadataParameters<PubNub.ObjectCustom>)
        return User.fromDTO(this, response.data)
      } else {
        await this.sdk.objects.removeUUIDMetadata({ uuid: id })
        return true
      }
    } catch (error) {
      throw error
    }
  }

  async getUsers(params: Omit<PubNub.GetAllMetadataParameters, "include"> = {}) {
    const mandatoryOptions = {
      include: {
        totalCount: true,
        customFields: true,
      },
    }
    const options = Object.assign({}, params, mandatoryOptions)
    try {
      const response = await this.sdk.objects.getAllUUIDMetadata(options)
      return {
        users: response.data.map((u) => User.fromDTO(this, u)),
        page: {
          next: response.next,
          prev: response.prev,
        },
        total: response.totalCount,
      }
    } catch (error) {
      throw error
    }
  }

  /**
   * Message threads
   */

  /** @internal */
  getThreadId(channelId: string, messageId: string) {
    return `${MESSAGE_THREAD_ID_PREFIX}_${channelId}_${messageId}`
  }

  /** @internal */
  async getThreadChannel(message: Message) {
    if (!message) throw "Message is required"

    const threadChannelId = this.getThreadId(message.channelId, message.timetoken)

    try {
      const response = await this.sdk.objects.getChannelMetadata({
        channel: threadChannelId,
      })
      return ThreadChannel.fromDTO(this, {
        ...response.data,
        parentMessage: message,
        parentChannelId: message.channelId,
      })
    } catch (error) {
      const e = error as { status: { errorData: { status: number } } }
      if (e?.status?.errorData?.status === 404) {
        throw "This message is not a thread"
      } else throw error
    }
  }

  /** @internal */
  async createThreadChannel(message: Message): Promise<ThreadChannel> {
    try {
      if (message.channelId.startsWith(MESSAGE_THREAD_ID_PREFIX)) {
        throw "Only one level of thread nesting is allowed"
      }

      const threadChannelId = this.getThreadId(message.channelId, message.timetoken)

      const existingThread = await this.getChannel(threadChannelId)

      if (existingThread) throw "Thread for this message already exists"

      const newThreadChannelDraft = new ThreadChannel(this, {
        description: `Thread on channel ${message.channelId} with message timetoken ${message.timetoken}`,
        id: threadChannelId,
        parentMessage: message,
        parentChannelId: message.channelId,
      })

      // eslint-disable-next-line @typescript-eslint/no-this-alias
      const self = this

      let isThreadCreated = false

      return new Proxy(newThreadChannelDraft, {
        get(target: ThreadChannel, prop: keyof ThreadChannel) {
          if (prop !== "sendText" || isThreadCreated) {
            return target[prop]
          }

          const originalSendText = target.sendText

          return async function proxifiedSendText(
            text: string,
            options: SendTextOptionParams = {}
          ) {
            try {
              await Promise.all([
                self.sdk.objects.setChannelMetadata({
                  channel: threadChannelId,
                  data: {
                    description: `Thread on channel ${message.channelId} with message timetoken ${message.timetoken}`,
                  },
                }),
                self.sdk.addMessageAction({
                  channel: message.channelId,
                  messageTimetoken: message.timetoken,
                  action: {
                    type: "threadRootId",
                    value: threadChannelId,
                  },
                }),
              ])
              isThreadCreated = true

              return originalSendText.bind(this)(text, options)
            } catch (e) {
              throw e
            }
          }
        },
      })
    } catch (e) {
      console.error(e)
      throw e
    }
  }

  /** @internal */
  async removeThreadChannel(message: Message, options: DeleteParameters = {}) {
    if (!message.hasThread) {
      throw "There is no thread to be deleted"
    }

    const actionTimetoken =
      message.actions?.threadRootId[this.getThreadId(message.channelId, message.timetoken)][0]
        .actionTimetoken

    if (!actionTimetoken) {
      throw "There is no action timetoken corresponding to the thread"
    }

    const threadId = this.getThreadId(message.channelId, message.timetoken)

    const threadChannel = await this.getChannel(threadId)

    if (!threadChannel) {
      throw `There is no thread with id: ${threadId}`
    }

    return Promise.all([
      this.sdk.removeMessageAction({
        channel: message.channelId,
        messageTimetoken: message.timetoken,
        actionTimetoken: String(actionTimetoken),
      }),
      threadChannel.delete(options),
    ])
  }

  /**
   *  Channels
   */
  async getChannel(id: string) {
    if (!id || !id.length) throw "ID is required"
    try {
      const response = await this.sdk.objects.getChannelMetadata({
        channel: id,
      })
      return Channel.fromDTO(this, response.data)
    } catch (error) {
      const e = error as { status: { errorData: { status: number } } }
      if (e?.status?.errorData?.status === 404) return null
      else throw error
    }
  }

  async updateChannel(id: string, data: Omit<ChannelFields, "id">) {
    if (!id.length) throw "ID is required"
    try {
      const existingChannel = await this.getChannel(id)
      if (!existingChannel) throw "Channel with this ID does not exist"
      const response = await this.sdk.objects.setChannelMetadata({
        channel: id,
        data,
      })
      return Channel.fromDTO(this, response.data)
    } catch (e) {
      console.error(e)
      throw e
    }
  }

  /* @internal */
  async createChannel(
    id: string,
    data: PubNub.ChannelMetadata<PubNub.ObjectCustom> & { type: ChannelType }
  ) {
    if (!id.length) throw "ID is required"
    try {
      const existingChannel = await this.getChannel(id)
      if (existingChannel) throw "Channel with this ID already exists"
      const response = await this.sdk.objects.setChannelMetadata({
        channel: id,
        data,
      })
      return Channel.fromDTO(this, response.data)
    } catch (e) {
      console.error(e)
      throw e
    }
  }

  async getChannels(params: Omit<PubNub.GetAllMetadataParameters, "include"> = {}) {
    const mandatoryOptions = {
      include: {
        totalCount: true,
        customFields: true,
      },
    }
    const options = Object.assign({}, params, mandatoryOptions)
    try {
      const response = await this.sdk.objects.getAllChannelMetadata(options)
      return {
        channels: response.data.map((u) => Channel.fromDTO(this, u)),
        page: {
          next: response.next,
          prev: response.prev,
        },
        total: response.totalCount,
      }
    } catch (error) {
      throw error
    }
  }

  async deleteChannel(id: string, params: DeleteParameters = {}) {
    if (!id.length) throw "ID is required"
    const { soft } = params
    try {
      if (soft) {
        const response = await this.sdk.objects.setChannelMetadata({
          channel: id,
          data: { status: "deleted" },
        } as PubNub.SetChannelMetadataParameters<PubNub.ObjectCustom>)
        return Channel.fromDTO(this, response.data)
      } else {
        await this.sdk.objects.removeChannelMetadata({ channel: id })
        return true
      }
    } catch (error) {
      throw error
    }
  }

  /**
   * Channel types
   */
  async createPublicConversation({
    channelId,
    channelData = {},
  }: {
    channelId?: string
    channelData?: PubNub.ChannelMetadata<PubNub.ObjectCustom>
  } = {}) {
    const finalChannelId = channelId || uuidv4()

    return this.createChannel(finalChannelId, {
      name: finalChannelId,
      ...channelData,
      type: "public",
    })
  }

  /**
   *  Presence
   */
  async wherePresent(id: string) {
    if (!id.length) throw "ID is required"
    try {
      const response = await this.sdk.whereNow({ uuid: id })
      return response.channels
    } catch (error) {
      throw error
    }
  }

  async whoIsPresent(id: string) {
    if (!id.length) throw "ID is required"
    try {
      const response = await this.sdk.hereNow({ channels: [id] })
      return response.channels[id].occupants.map((u) => u.uuid)
    } catch (error) {
      throw error
    }
  }

  async isPresent(userId: string, channelId: string) {
    if (!userId.length) throw "User ID is required"
    if (!channelId.length) throw "Channel ID is required"
    try {
      const response = await this.sdk.whereNow({ uuid: userId })
      return response.channels.includes(channelId)
    } catch (error) {
      throw error
    }
  }

  /**
   * Messages
   */
  /** @internal */
  async forwardMessage(message: Message, channel: string) {
    if (!channel) throw "Channel ID is required"
    if (!message) throw "Message is required"

    const meta = {
      ...(message.meta || {}),
      originalPublisher: message.userId,
      originalChannelId: message.channelId,
    }
    this.publish({ message: message.content, channel, meta })
  }

  /** @internal */
  pinMessageToChannel(message: Message | null, channel: Channel) {
    const customMetadataToSet = {
      ...(channel.custom || {}),
    }

    if (!message) {
      delete customMetadataToSet.pinnedMessageTimetoken
      delete customMetadataToSet.pinnedMessageChannelID
    } else {
      customMetadataToSet.pinnedMessageTimetoken = message.timetoken
      customMetadataToSet.pinnedMessageChannelID = message.channelId
    }

    return this.sdk.objects.setChannelMetadata({
      channel: channel.id,
      data: {
        custom: customMetadataToSet,
      },
    })
  }

  /**
   * Save last activity timestamp
   */

  /** @internal */
  private async saveTimeStampFunc() {
    const response = await this.sdk.objects.setUUIDMetadata({
      uuid: this.sdk.getUUID(),
      data: {
        custom: {
          ...(this.user?.custom || {}),
          lastActiveTimestamp: new Date().getTime(),
        },
      },
    })

    this.user = User.fromDTO(this, response.data)
  }

  /** @internal */
  private runSaveTimestampInterval() {
    this.saveTimeStampFunc()

    this.lastSavedActivityInterval = setInterval(() => {
      this.saveTimeStampFunc()
    }, this.config.storeUserActivityInterval)
  }

  /** @internal */
  private async storeUserActivityTimestamp() {
    if (this.lastSavedActivityInterval) {
      clearInterval(this.lastSavedActivityInterval)
    }

    try {
      const user = await this.getUser(this.sdk.getUUID())

      if (!user || !user.lastActiveTimestamp) {
        this.runSaveTimestampInterval()
        return
      }

      const currentTime = new Date().getTime()
      const elapsedTimeSinceLastCheck = currentTime - user.lastActiveTimestamp

      if (elapsedTimeSinceLastCheck >= this.config.storeUserActivityInterval) {
        this.runSaveTimestampInterval()
        return
      }

      const remainingTime = this.config.storeUserActivityInterval - elapsedTimeSinceLastCheck

      setTimeout(() => {
        this.runSaveTimestampInterval()
      }, remainingTime)
    } catch (error) {
      throw error
    }
  }

  async createDirectConversation({
    user,
    channelId,
    channelData = {},
    membershipData = {},
  }: {
    user: User
    channelId?: string
    channelData?: PubNub.ChannelMetadata<PubNub.ObjectCustom>
    membershipData?: Omit<
      PubNub.SetMembershipsParameters<PubNub.ObjectCustom>,
      "channels" | "include" | "filter"
    > & {
      custom?: PubNub.ObjectCustom
    }
  }) {
    try {
      if (!this.user) {
        throw "Chat user is not set. Set them by calling setChatUser on the Chat instance."
      }

      const sortedUsers = [this.user.id, user.id].sort()

      const finalChannelId = channelId || `direct.${cyrb53a(`${sortedUsers[0]}&${sortedUsers[1]}`)}`

      const channel =
        (await this.getChannel(finalChannelId)) ||
        (await this.createChannel(finalChannelId, {
          name: finalChannelId,
          ...channelData,
          type: "direct",
        }))

      const { custom, ...rest } = membershipData
      const hostMembershipPromise = this.sdk.objects.setMemberships({
        ...rest,
        channels: [{ id: channel.id, custom }],
        include: {
          totalCount: true,
          customFields: true,
          channelFields: true,
          customChannelFields: true,
        },
        filter: `channel.id == '${channel.id}'`,
      })

      const [hostMembershipResponse, inviteeMembership] = await Promise.all([
        hostMembershipPromise,
        channel.invite(user),
      ])

      return {
        channel,
        hostMembership: Membership.fromMembershipDTO(
          this,
          hostMembershipResponse.data[0],
          this.user
        ),
        inviteeMembership,
      }
    } catch (error) {
      throw error
    }
  }

  async createGroupConversation({
    users,
    channelId,
    channelData = {},
    membershipData = {},
  }: {
    users: User[]
    channelId?: string
    channelData?: PubNub.ChannelMetadata<PubNub.ObjectCustom>
    membershipData?: Omit<
      PubNub.SetMembershipsParameters<PubNub.ObjectCustom>,
      "channels" | "include" | "filter"
    > & {
      custom?: PubNub.ObjectCustom
    }
  }) {
    const finalChannelId = channelId || uuidv4()

    try {
      const channel =
        (await this.getChannel(finalChannelId)) ||
        (await this.createChannel(finalChannelId, {
          name: finalChannelId,
          ...channelData,
          type: "group",
        }))
      const { custom, ...rest } = membershipData
      const hostMembershipPromise = this.sdk.objects.setMemberships({
        ...rest,
        channels: [{ id: channel.id, custom }],
        include: {
          totalCount: true,
          customFields: true,
          channelFields: true,
          customChannelFields: true,
        },
        filter: `channel.id == '${channel.id}'`,
      })

      const [hostMembershipResponse, inviteesMemberships] = await Promise.all([
        hostMembershipPromise,
        channel.inviteMultiple(users),
      ])

      return {
        channel,
        hostMembership: Membership.fromMembershipDTO(
          this,
          hostMembershipResponse.data[0],
          this.user
        ),
        inviteesMemberships,
      }
    } catch (error) {
      throw error
    }
  }

  async getUserSuggestions(
    text: string,
    options: { limit: number } = { limit: 10 }
  ): Promise<User[]> {
    const cacheKey = MessageElementsUtils.getPhraseToLookFor(text)

    if (!cacheKey) {
      return []
    }

    if (this.suggestedNamesCache.get(cacheKey)) {
      return this.suggestedNamesCache.get(cacheKey) as User[]
    }

    const usersResponse = await this.getUsers({
      filter: `name LIKE "${cacheKey}*"`,
      limit: options.limit,
    })

    this.suggestedNamesCache.set(cacheKey, usersResponse.users)

    return this.suggestedNamesCache.get(cacheKey) as User[]
  }

  async getChannelSuggestions(
    text: string,
    options: { limit: number } = { limit: 10 }
  ): Promise<Channel[]> {
    const cacheKey = MessageElementsUtils.getChannelPhraseToLookFor(text)

    if (!cacheKey) {
      return []
    }

    if (this.suggestedChannelsCache.get(cacheKey)) {
      return this.suggestedChannelsCache.get(cacheKey) as Channel[]
    }

    const channelsResponse = await this.getChannels({
      filter: `name LIKE "${cacheKey}*"`,
      limit: options.limit,
    })

    this.suggestedChannelsCache.set(cacheKey, channelsResponse.channels)

    return this.suggestedChannelsCache.get(cacheKey) as Channel[]
  }

  /**
   * Register for push notifications
   */

  /** @internal */
  getCommonPushOptions() {
    const { deviceToken, deviceGateway, apnsEnvironment, apnsTopic } = this.config.pushNotifications
    if (!deviceToken) throw "Device Token has to be defined in Chat pushNotifications config."

    return {
      device: deviceToken,
      pushGateway: deviceGateway,
      ...(deviceGateway === "apns2" && {
        environment: apnsEnvironment,
        topic: apnsTopic,
      }),
    }
  }

  async registerPushChannels(channels: string[]) {
    return await this.sdk.push.addChannels({ channels, ...this.getCommonPushOptions() })
  }

  async unregisterPushChannels(channels: string[]) {
    return await this.sdk.push.removeChannels({
      channels,
      ...this.getCommonPushOptions(),
    })
  }

  async unregisterAllPushChannels() {
    return await this.sdk.push.deleteDevice(this.getCommonPushOptions())
  }

  async getPushChannels() {
    const response = await this.sdk.push.listChannels(this.getCommonPushOptions())
    return response.channels
  }

  downloadDebugLog() {
    return this.errorLogger.getStorageObject()
  }

  async getCurrentUserMentions(
    params: { startTimetoken?: string; endTimetoken?: string; count?: number } = {}
  ): Promise<{ enhancedMentionsData: UserMentionData[]; isMore: boolean }> {
    const mentionsHistoryObject = await this.getEventsHistory({
      ...params,
      channel: this.currentUser.id,
    })

    const enhancedMentionsData = await Promise.all(
      mentionsHistoryObject.events
        .filter((event) => event.type === "mention")
        .map(async (event) => {
          const previousTimetoken = String(BigInt(event.payload.messageTimetoken) + BigInt(1))
          const sdkMessages = await this.sdk.fetchMessages({
            channels: [event.payload.channel],
            start: previousTimetoken,
            end: event.payload.messageTimetoken,
          })

          if (!event.payload.parentChannel) {
            return {
              event: event as Event<"mention">,
              channelId: event.payload.channel,
              message: Message.fromDTO(this, sdkMessages.channels[event.payload.channel][0]),
              userId: event.userId,
            }
          }

          return {
            event: event as Event<"mention">,
            message: Message.fromDTO(this, sdkMessages.channels[event.payload.channel][0]),
            userId: event.userId,
            parentChannelId: event.payload.parentChannel,
            threadChannelId: event.payload.channel,
          }
        })
    )

    return {
      enhancedMentionsData,
      isMore: mentionsHistoryObject.isMore,
    }
  }

  async getUnreadMessagesCounts(params: Omit<GetMembershipsParametersv2, "include"> = {}) {
    const userMemberships = await this.currentUser.getMemberships(params)

    if (!userMemberships.memberships.length) {
      return []
    }

    const response = await this.sdk.messageCounts({
      channels: userMemberships.memberships.map((m) => m.channel.id),
      channelTimetokens: userMemberships.memberships.map(
        (m) => m.lastReadMessageTimetoken || "0"
      ) as string[],
    })

    return Object.keys(response.channels)
      .map((key) => {
        const relevantMembership = userMemberships.memberships.find((m) => m.channel.id === key)

        if (!relevantMembership) {
          throw `Cannot find channel with id ${key}`
        }

        return {
          channel: relevantMembership.channel,
          membership: relevantMembership,
          count: response.channels[key],
        }
      })
      .filter((r) => r.count > 0)
  }

  async markAllMessagesAsRead(params: Omit<GetMembershipsParametersv2, "include"> = {}) {
    const userMemberships = await this.currentUser.getMemberships(params)

    const relevantChannelIds = userMemberships.memberships.map((m) => m.channel.id)

    if (!relevantChannelIds.length) {
      return
    }

    const lastMessagesFromMembershipChannels = await this.sdk.fetchMessages({
      channels: relevantChannelIds,
      count: 1,
    })

    const channelsSetCustom = relevantChannelIds.map((relevantChannelId, i) => {
      const relevantLastMessage =
        lastMessagesFromMembershipChannels.channels[encodeURIComponent(relevantChannelId)]

      const relevantLastMessageTimetoken =
        relevantLastMessage && relevantLastMessage[0] ? relevantLastMessage[0].timetoken : "0"

      return {
        id: relevantChannelId,
        custom: {
          ...userMemberships.memberships[i].custom,
          lastReadMessageTimetoken: relevantLastMessageTimetoken,
        },
      }
    })
    const filterExpression = `${relevantChannelIds.map((r) => `channel.id == '${r}'`).join(" || ")}`

    const membershipsResponse = await this.sdk.objects.setMemberships({
      uuid: this.user.id,
      channels: channelsSetCustom,
      include: {
        totalCount: true,
        customFields: true,
        channelFields: true,
        customChannelFields: true,
      },
      filter: filterExpression,
    })

    relevantChannelIds.forEach((relevantChannelId) => {
      const relevantLastMessage =
        lastMessagesFromMembershipChannels.channels[encodeURIComponent(relevantChannelId)]

      const relevantLastMessageTimetoken =
        relevantLastMessage && relevantLastMessage[0]
          ? String(relevantLastMessage[0].timetoken)
          : ""

      this.emitEvent({
        channel: relevantChannelId,
        type: "receipt",
        payload: {
          messageTimetoken: relevantLastMessageTimetoken,
        },
      })
    })

    return {
      page: {
        next: membershipsResponse.next,
        prev: membershipsResponse.prev,
      },
      total: membershipsResponse.totalCount,
      status: membershipsResponse.status,
      memberships: membershipsResponse.data.map((m) =>
        Membership.fromMembershipDTO(this, m, this.user)
      ),
    }
  }

  /**
   * Moderation restrictions
   */

  async setRestrictions(
    userId: string,
    channelId: string,
    params: { ban?: boolean; mute?: boolean }
  ) {
    const channel = `${INTERNAL_MODERATION_PREFIX}${channelId}`

    if (!params.ban && !params.mute) {
      await this.sdk.objects.removeChannelMembers({ channel, uuids: [userId] })
      await this.emitEvent({
        type: "moderation",
        channel: userId,
        payload: {
          channelId: channel,
          restriction: "lifted",
        },
      })
    } else {
      await this.sdk.objects.setChannelMembers({ channel, uuids: [{ id: userId, custom: params }] })
      await this.emitEvent({
        type: "moderation",
        channel: userId,
        payload: {
          channelId: channel,
          restriction: params.ban ? "banned" : "muted",
        },
      })
    }
  }
}
