import { Chat } from "./chat"
import { ChannelMembershipObject, ObjectCustom, UUIDMembershipObject } from "pubnub"
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
}
