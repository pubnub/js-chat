import { Chat } from "./chat"
import Pubnub, { ChannelMembershipObject } from "pubnub"

export type MembershipFields = Pick<Membership, "memberships">

export class Membership {
  private chat: Chat
  readonly memberships: ChannelMembershipObject<Pubnub.ObjectCustom, Pubnub.ObjectCustom>[]

  constructor(chat: Chat, params: MembershipFields) {
    this.chat = chat
    this.memberships = params.memberships
  }

  static fromDTO(
    chat: Chat,
    membershipResponse: Pubnub.ManageMembershipsResponse<Pubnub.ObjectCustom, Pubnub.ObjectCustom>
  ) {
    const data = {
      memberships: membershipResponse.data,
    }

    return new Membership(chat, data)
  }
}
