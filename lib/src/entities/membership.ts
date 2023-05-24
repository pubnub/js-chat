import { Chat } from "./chat"
import {
  ChannelMembershipObject,
  ObjectCustom,
  SetMembershipsParameters,
  UUIDMembershipObject,
} from "pubnub"
import { Channel } from "./channel"
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
}
