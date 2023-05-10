import { UUIDMetadataObject, ObjectCustom, GetMembershipsParametersv2 } from "pubnub"
import { Chat } from "./chat"
import { StatusTypeFields, DeleteParameters } from "../types"
import { Membership } from "./membership"

export type UserFields = Pick<
  User,
  "id" | "name" | "externalId" | "profileUrl" | "email" | "custom" | "status" | "type"
>

export class User {
  private chat: Chat
  readonly id: string
  readonly name?: string
  readonly externalId?: string
  readonly profileUrl?: string
  readonly email?: string
  readonly custom?: ObjectCustom
  readonly status?: string
  readonly type?: string
  readonly updated?: string
  /** @internal */
  constructor(chat: Chat, params: UserFields) {
    this.chat = chat
    this.id = params.id
    Object.assign(this, params)
  }
  /** @internal */
  static fromDTO(
    chat: Chat,
    params: Partial<UUIDMetadataObject<ObjectCustom>> &
      Pick<UUIDMetadataObject<ObjectCustom>, "id"> &
      StatusTypeFields
  ) {
    const data = {
      id: params.id,
      name: params.name || undefined,
      externalId: params.externalId || undefined,
      profileUrl: params.profileUrl || undefined,
      email: params.email || undefined,
      custom: params.custom || undefined,
      updated: params.updated || undefined,
      status: params.status || undefined,
      type: params.type || undefined,
    }
    return new User(chat, data)
  }

  async update(data: Omit<UserFields, "id">) {
    return this.chat.updateUser(this.id, data)
  }

  async delete(options: DeleteParameters = {}) {
    return this.chat.deleteUser(this.id, options)
  }

  async wherePresent() {
    return this.chat.wherePresent(this.id)
  }

  async isPresentOn(channelId: string) {
    return this.chat.isPresent(this.id, channelId)
  }

  async getMemberships(params: Omit<GetMembershipsParametersv2, "include"> = {}) {
    const membershipsResponse = await this.chat.sdk.objects.getMemberships({
      ...params,
      include: {
        totalCount: true,
        customFields: true,
        channelFields: true,
        customChannelFields: true,
      },
    })

    return {
      next: membershipsResponse.next,
      prev: membershipsResponse.prev,
      totalCount: membershipsResponse.totalCount,
      status: membershipsResponse.status,
      memberships: membershipsResponse.data.map((m) =>
        Membership.fromMembershipDTO(this.chat, m, this)
      ),
    }
  }
}
