import { Chat } from "./chat"
import PubNub, { ChannelMembershipObject, ObjectCustom, UUIDMembershipObject } from "pubnub"
import { Channel } from "./channel"
import { Message } from "./message"
import { User } from "./user"

export type MembershipFields = Pick<Membership, "channel" | "user" | "custom">

export class Membership {
  private chat: Chat
  readonly channel: Channel
  readonly user: User
  readonly custom: ObjectCustom | null | undefined

  /** @internal */
  constructor(chat: Chat, params: MembershipFields) {
    this.chat = chat
    this.channel = params.channel
    this.user = params.user
    this.custom = params.custom
  }

  /** @internal */
  static fromMembershipDTO(
    chat: Chat,
    channelMembershipObject: ChannelMembershipObject<ObjectCustom, ObjectCustom>,
    user: User
  ) {
    const data = {
      channel: Channel.fromDTO(chat, channelMembershipObject.channel),
      user,
      custom: channelMembershipObject.custom,
    }

    return new Membership(chat, data)
  }

  /** @internal */
  static fromChannelMemberDTO(
    chat: Chat,
    userMembershipObject: UUIDMembershipObject<ObjectCustom, ObjectCustom>,
    channel: Channel
  ) {
    const data = {
      user: User.fromDTO(chat, userMembershipObject.uuid),
      channel,
      custom: userMembershipObject.custom,
    }

    return new Membership(chat, data)
  }

  /** @internal */
  private async exists() {
    const membershipsResponse = await this.chat.sdk.objects.getMemberships({
      uuid: this.user.id,
      filter: `channel.id == '${this.channel.id}'`,
    })

    return !!membershipsResponse.data.length
  }

  async update({ custom }: { custom: ObjectCustom }) {
    try {
      // check if membership exists before updating it
      if (!(await this.exists())) {
        throw "No such membership exists"
      }
      const membershipsResponse = await this.chat.sdk.objects.setMemberships({
        uuid: this.user.id,
        channels: [{ id: this.channel.id, custom }],
        include: {
          totalCount: true,
          customFields: true,
          channelFields: true,
          customChannelFields: true,
        },
        filter: `channel.id == '${this.channel.id}'`,
      })

      return Membership.fromMembershipDTO(this.chat, membershipsResponse.data[0], this.user)
    } catch (error) {
      throw error
    }
  }

  /*
   * Updates
   */
  static streamUpdatesOn(
    memberships: Membership[],
    callback: (memberships: Membership[]) => unknown
  ) {
    if (!memberships.length) throw "Cannot stream membership updates on an empty list"
    const listener = {
      objects: (event: PubNub.SetMembershipEvent<PubNub.ObjectCustom>) => {
        if (event.message.type !== "membership") return
        const membership = memberships.find(
          (m) => m.channel.id === event.channel && m.user.id === event.message.data.uuid.id
        )
        if (!membership) return
        const newMembership = new Membership(membership.chat, {
          user: membership.user,
          channel: membership.channel,
          custom: event.message.data.custom,
        })
        const newMemberships = memberships.map((membership) =>
          membership.channel.id === newMembership.channel.id &&
          membership.user.id === newMembership.user.id
            ? newMembership
            : membership
        )
        callback(newMemberships)
      },
    }
    const { chat } = memberships[0]
    const removeListener = chat.addListener(listener)
    const subscriptions = memberships.map((membership) => chat.subscribe(membership.channel.id))
    return () => {
      removeListener()
      subscriptions.map((unsub) => unsub())
    }
  }

  streamUpdates(callback: (membership: Membership) => unknown) {
    return Membership.streamUpdatesOn([this], (memberships) => callback(memberships[0]))
  }

  /*
   * Unread message counts
   */
  get lastReadMessageTimetoken() {
    return this.custom?.lastReadMessageTimetoken
  }

  async setLastReadMessage(message: Message) {
    try {
      return this.update({
        custom: { ...this.custom, lastReadMessageTimetoken: message.timetoken },
      })
    } catch (error) {
      throw error
    }
  }

  async getUnreadMessagesCount() {
    try {
      const timetoken = await this.lastReadMessageTimetoken
      if (timetoken) {
        const response = await this.chat.sdk.messageCounts({
          channels: [this.channel.id],
          channelTimetokens: [String(timetoken)],
        })
        return response.channels?.[this.channel.id]
      } else {
        return false
      }
    } catch (error) {
      throw error
    }
  }
}
