import PubNub, { MessageEvent, SignalEvent } from "pubnub"
import { Channel, ChannelFields } from "./channel"
import { User, UserFields } from "./user"
import { DeleteParameters, TextMessageContent, EventContent, EventType } from "../types"
import { Message } from "./message"
import { Event } from "./event"
import { Membership } from "./membership"
import { MESSAGE_THREAD_ID_PREFIX } from "../constants"
import { ThreadChannel } from "./thread-channel"
import { MentionsUtils } from "../mentions-utils"

type ChatConfig = {
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
  /* @internal */
  private subscriptions: { [channel: string]: Set<string> }

  /** @internal */
  private constructor(params: ChatConstructor) {
    const {
      saveDebugLog,
      typingTimeout,
      storeUserActivityInterval,
      storeUserActivityTimestamps,
      pushNotifications,
      ...pubnubConfig
    } = params

    if (storeUserActivityInterval && storeUserActivityInterval < 600000) {
      throw "storeUserActivityInterval must be at least 600000ms"
    }

    if (pushNotifications?.deviceGateway === "apns2" && !pushNotifications?.apnsTopic) {
      throw "apnsTopic has to be defined when deviceGateway is set to apns2"
    }

    this.sdk = new PubNub(pubnubConfig)
    this.user = new User(this, {
      id: "userId" in pubnubConfig ? pubnubConfig.userId : pubnubConfig.uuid,
    })
    this.subscriptions = {}
    this.suggestedNamesCache = new Map<string, User[]>()
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

    return chat
  }

  /* @internal */
  subscribe(channel: string) {
    const subscriptionId = Math.floor(Math.random() * Date.now()).toString(36)
    const channelSubIds = (this.subscriptions[channel] ||= new Set())
    if (!channelSubIds.size) this.sdk.subscribe({ channels: [channel] })
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
  emitEvent<T extends EventType>({
    channel,
    type,
    method,
    payload,
  }: {
    channel: string
    type?: T
    method?: "signal" | "publish"
    payload: EventContent[T]
  }) {
    const defType = type || "custom"
    const defMethod = method || "signal"
    const message = { ...payload, type: defType }
    const params = { channel, message }
    return defMethod === "signal" ? this.signal(params) : this.publish(params)
  }

  listenForEvents<T extends EventType>({
    channel,
    type,
    method,
    callback,
  }: {
    channel: string
    type?: T
    method?: "signal" | "publish"
    callback: (event: Event<T>) => unknown
  }) {
    const defType = type || "custom"
    const defMethod = method || "signal"
    const handler = (event: MessageEvent | SignalEvent) => {
      if (event.channel !== channel) return
      if (event.message.type !== defType) return
      const { channel: ch, timetoken, message, publisher } = event
      callback(Event.fromDTO(this, { channel: ch, timetoken, message, publisher }))
    }
    const listener = {
      ...(defMethod === "signal" ? { signal: handler } : { message: handler }),
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

  async getUsers(params: Omit<PubNub.GetAllMetadataParameters, "include">) {
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
  async createThreadChannel(message: Message) {
    try {
      if (message.channelId.startsWith(MESSAGE_THREAD_ID_PREFIX)) {
        throw "Only one level of thread nesting is allowed"
      }

      const threadChannelId = this.getThreadId(message.channelId, message.timetoken)

      const existingThread = await this.getChannel(threadChannelId)
      if (existingThread) throw "Thread for this message already exists"

      const response = await this.sdk.objects.setChannelMetadata({
        channel: threadChannelId,
        data: {
          description: `Thread on channel ${message.channelId} with message timetoken ${message.timetoken}`,
        },
      })
      const data = await Promise.all([
        ThreadChannel.fromDTO(this, {
          ...response.data,
          parentChannelId: message.channelId,
        }),
        this.sdk.addMessageAction({
          channel: message.channelId,
          messageTimetoken: message.timetoken,
          action: {
            type: "threadRootId",
            value: threadChannelId,
          },
        }),
      ])

      return data[0]
    } catch (e) {
      console.error(e)
      throw e
    }
  }

  /**
   *  Channels
   */
  async getChannel(id: string) {
    if (!id.length) throw "ID is required"
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

  async createChannel(id: string, data: PubNub.ChannelMetadata<PubNub.ObjectCustom>) {
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

  async getChannels(params: Omit<PubNub.GetAllMetadataParameters, "include">) {
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
    if (message.channelId === channel) throw "You cannot forward the message to the same channel"

    const meta = {
      ...(message.meta || {}),
      originalPublisher: message.userId,
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
    channelData,
    membershipData = {},
  }: {
    user: User
    channelData: PubNub.ChannelMetadata<PubNub.ObjectCustom>
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

      const channelName = `direct.${sortedUsers[0]}&${sortedUsers[1]}`

      const channel =
        (await this.getChannel(channelName)) || (await this.createChannel(channelName, channelData))

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
    channelData,
    membershipData = {},
  }: {
    users: User[]
    channelId: string
    channelData: PubNub.ChannelMetadata<PubNub.ObjectCustom>
    membershipData?: Omit<
      PubNub.SetMembershipsParameters<PubNub.ObjectCustom>,
      "channels" | "include" | "filter"
    > & {
      custom?: PubNub.ObjectCustom
    }
  }) {
    try {
      const channel =
        (await this.getChannel(channelId)) || (await this.createChannel(channelId, channelData))
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
    const cacheKey = MentionsUtils.getPhraseToLookFor(text)

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
}
