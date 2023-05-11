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

  async update(
    params: Omit<SetMembershipsParameters<ObjectCustom>, "channels"> & {
      custom?: ObjectCustom
    } = {}
  ) {
    // we can't efficiently check if the user is already a member
    const { custom, ...rest } = params
    await this.chat.sdk.objects.setMemberships({
      ...rest,
      channels: [{ id: this.channel.id, custom }],
    })
    // this method does not return the affected membership because objects.setMemberships
    // returns the full list of user's memberships and the affected membership might not even be there
    // so it returns Promise<undefined>
  }
}
