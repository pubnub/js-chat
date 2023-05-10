import { Chat } from "./chat"
import Pubnub, { ChannelMembershipObject, ObjectCustom, UUIDMembershipObject } from "pubnub"
import { Channel } from "./channel"
import { User } from "./user"

export type MembershipFields = Pick<ChannelMembership, "channel" | "user" | "custom">

export class ChannelMembership {
  private chat: Chat
  readonly channel: Channel
  readonly user: User
  readonly custom: ObjectCustom | null | undefined

  constructor(chat: Chat, params: MembershipFields) {
    this.chat = chat
    this.channel = params.channel
    this.user = params.user
    this.custom = params.custom
  }

  static fromMembershipDTO(
    chat: Chat,
    channelMembershipObject: ChannelMembershipObject<Pubnub.ObjectCustom, Pubnub.ObjectCustom>,
    user: User
  ) {
    const data = {
      channel: Channel.fromDTO(chat, channelMembershipObject.channel),
      user,
      custom: channelMembershipObject.custom,
    }

    return new ChannelMembership(chat, data)
  }

  static fromChannelMemberDTO(
    chat: Chat,
    userMembershipObject: UUIDMembershipObject<Pubnub.ObjectCustom, Pubnub.ObjectCustom>,
    channel: Channel
  ) {
    const data = {
      user: User.fromDTO(chat, userMembershipObject.uuid),
      channel,
      custom: userMembershipObject.custom,
    }

    return new ChannelMembership(chat, data)
  }
}
