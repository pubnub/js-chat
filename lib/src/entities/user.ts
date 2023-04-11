import { UUIDMetadataObject, ObjectCustom } from "pubnub"
import { Chat } from "./chat"
import { StatusTypeFields } from "../types"

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

  constructor(chat: Chat, params: UserFields) {
    this.chat = chat
    this.id = params.id
    Object.assign(this, params)
  }

  static fromDTO(chat: Chat, params: UUIDMetadataObject<ObjectCustom> & StatusTypeFields) {
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

  async delete(soft = false) {
    return this.chat.deleteUser(this.id, soft)
  }

  async wherePresent() {
    return this.chat.wherePresent(this.id)
  }

  async isPresentOn(channelId: string) {
    return this.chat.isPresent(this.id, channelId)
  }
}
