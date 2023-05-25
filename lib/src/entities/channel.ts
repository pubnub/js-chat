import PubNub, {
  ListenerParameters,
  SignalEvent,
  MessageEvent,
  ObjectCustom,
  GetChannelMembersParameters,
  SetMembershipsParameters,
} from "pubnub"
import { Chat } from "./chat"
import { Message } from "./message"
import { SendTextOptionParams, DeleteParameters, ChannelDTOParams } from "../types"
import { Membership } from "./membership"
import { User } from "./user"
import { MESSAGE_THREAD_ID_PREFIX } from "../constants"

export type ChannelFields = Pick<
  Channel,
  "id" | "name" | "custom" | "description" | "updated" | "status" | "type"
>

export class Channel {
  private chat: Chat
  readonly id: string
  readonly name?: string
  readonly custom?: ObjectCustom
  readonly description?: string
  readonly updated?: string
  readonly status?: string
  readonly type?: string
  /** @internal */
  private disconnect?: () => void
  /** @internal */
  private typingSent = false
  /** @internal */
  private typingSentTimer?: ReturnType<typeof setTimeout>
  /** @internal */
  private typingIndicators: Map<string, ReturnType<typeof setTimeout>> = new Map()

  /** @internal */
  constructor(chat: Chat, params: ChannelFields) {
    this.chat = chat
    this.id = params.id
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

    return new Channel(chat, data)
  }

  /** @internal */
  private async createThread(timetoken: string) {
    try {
      const threadChannelId = this.chat.getThreadId(this.id, timetoken)
      console.log("threadChannelId", threadChannelId)

      const response = await this.chat.sdk.objects.setChannelMetadata({
        channel: threadChannelId,
        data: {
          description: `Thread on channel ${this.id} with message timetoken ${timetoken}`,
        },
      })
      return Channel.fromDTO(this.chat, {
        ...response.data,
      })
    } catch (e) {
      console.error(e)
      throw e
    }
  }

  /** @internal */
  private isThreadRoot() {
    return this.id.startsWith(MESSAGE_THREAD_ID_PREFIX)
  }

  /** @internal */
  private markMessageAsThreadRoot(timetoken: string) {
    const channelIdToSend = this.chat.getThreadId(this.id, timetoken)

    return this.chat.sdk.addMessageAction({
      channel: this.id,
      messageTimetoken: timetoken,
      action: {
        type: "threadRootId",
        value: channelIdToSend,
      },
    })
  }

  async sendText(text: string, options: SendTextOptionParams = {}) {
    try {
      let channelIdToSend = this.id

      if (options.rootMessage && this.isThreadRoot()) {
        throw "Only one level of thread nesting is allowed"
      }
      if (options.rootMessage && options.rootMessage.channelId !== this.id) {
        throw "This 'rootMessage' you provided does not come from this channel"
      }

      if (options.rootMessage) {
        channelIdToSend = this.chat.getThreadId(this.id, options.rootMessage.timetoken)

        if (!options.rootMessage.threadRootId) {
          await Promise.all([
            this.markMessageAsThreadRoot(options.rootMessage.timetoken),
            this.createThread(options.rootMessage.timetoken),
          ])
        }
      }

      return await this.chat.sdk.publish({
        channel: channelIdToSend,
        message: {
          type: "text",
          text,
        },
        ...options,
      })
    } catch (error) {
      throw error
    }
  }

  private async sendTypingSignal(value: boolean) {
    return await this.chat.sdk.signal({
      channel: this.id,
      message: {
        type: "typing",
        value,
      },
    })
  }

  async startTyping() {
    if (this.typingSent) return
    this.typingSent = true
    this.typingSentTimer = setTimeout(
      () => (this.typingSent = false),
      this.chat.config.typingTimeout - 1000
    )
    return await this.sendTypingSignal(true)
  }

  async stopTyping() {
    clearTimeout(this.typingSentTimer)
    if (!this.typingSent) return
    this.typingSent = false
    return await this.sendTypingSignal(false)
  }

  getTyping(callback: (typingUserIds: string[]) => unknown) {
    const listener = {
      signal: (event: SignalEvent) => {
        const { channel, message, publisher } = event
        if (channel !== this.id) return
        if (message.type !== "typing") return
        const timer = this.typingIndicators.get(publisher)

        if (!message.value && timer) {
          clearTimeout(timer)
          this.typingIndicators.delete(publisher)
        }

        if (message.value && timer) {
          clearTimeout(timer)
          const newTimer = setTimeout(() => {
            this.typingIndicators.delete(publisher)
            callback(Array.from(this.typingIndicators.keys()))
          }, this.chat.config.typingTimeout)
          this.typingIndicators.set(publisher, newTimer)
        }

        if (message.value && !timer) {
          const newTimer = setTimeout(() => {
            this.typingIndicators.delete(publisher)
            callback(Array.from(this.typingIndicators.keys()))
          }, this.chat.config.typingTimeout)
          this.typingIndicators.set(publisher, newTimer)
        }

        callback(Array.from(this.typingIndicators.keys()))
      },
    }

    const removeListener = this.chat.addListener(listener)
    const unsubscribe = this.chat.subscribe(this.id)

    return () => {
      removeListener()
      unsubscribe()
    }
  }

  connect(callback: (message: Message) => void) {
    const listener = {
      message: (event: MessageEvent) => {
        const { message, channel } = event
        if (channel !== this.id) return
        if (!["text"].includes(message.type)) return
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

  async update(data: Omit<ChannelFields, "id">) {
    return this.chat.updateChannel(this.id, data)
  }

  async delete(options: DeleteParameters = {}) {
    return this.chat.deleteChannel(this.id, options)
  }

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

  async forwardMessage(message: Message) {
    return this.chat.forwardMessage(message, this.id)
  }

  async join(
    callback: (message: Message) => void,
    params: Omit<SetMembershipsParameters<ObjectCustom>, "channels" | "include" | "filter"> & {
      custom?: ObjectCustom
    } = {}
  ) {
    try {
      const currentUser = this.chat.getChatUser()

      if (!currentUser) {
        throw "Chat user is not set. Set them by calling setChatUser on the Chat instance."
      }

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

      return Membership.fromMembershipDTO(this.chat, membershipsResponse.data[0], currentUser)
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

  async pinMessage(message: Message) {
    const response = await this.chat.pinMessageToChannel(message, this)
    return Channel.fromDTO(this.chat, response.data)
  }

  async unpinMessage() {
    const response = await this.chat.pinMessageToChannel(null, this)
    return Channel.fromDTO(this.chat, response.data)
  }

  async getPinnedMessage() {
    const pinnedMessageTimetoken = this.custom?.["pinnedMessageTimetoken"]

    if (!pinnedMessageTimetoken) {
      return null
    }

    return await this.getMessage(pinnedMessageTimetoken as string)
  }

  // togglePinMessage(messageTimeToken: string) {}

  // getUnreadMessagesCount() {}

  // star() {}

  // getMembers() {}

  // getOnlineMembers() {}

  // search(phrase: string) {}
}
