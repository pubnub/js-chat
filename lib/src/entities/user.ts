import PubNub, { UUIDMetadataObject, ObjectCustom, GetMembershipsParametersv2 } from "pubnub"
import { Chat } from "./chat"
import { DeleteParameters, OptionalAllBut } from "../types"
import { Channel } from "./channel"
import { Membership } from "./membership"
import { INTERNAL_ADMIN_CHANNEL, INTERNAL_MODERATION_PREFIX } from "../constants"
import { getErrorProxiedEntity } from "../error-logging"

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
  readonly lastActiveTimestamp?: number

  /** @internal */
  constructor(chat: Chat, params: UserFields) {
    this.chat = chat
    this.id = params.id
    Object.assign(this, params)
  }

  /** @internal */
  static fromDTO(
    chat: Chat,
    params: OptionalAllBut<UUIDMetadataObject<ObjectCustom>, "id"> & {
      status?: string
      type?: string
    }
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
      lastActiveTimestamp: params.custom?.lastActiveTimestamp || undefined,
    }
    return getErrorProxiedEntity(new User(chat, data), chat.errorLogger)
  }

  get active() {
    return !!(
      this.lastActiveTimestamp &&
      new Date().getTime() - this.lastActiveTimestamp <= this.chat.config.storeUserActivityInterval
    )
  }

  /*
   * CRUD
   */
  async update(data: Omit<UserFields, "id">) {
    return this.chat.updateUser(this.id, data)
  }

  async delete(options: DeleteParameters = {}) {
    return this.chat.deleteUser(this.id, options)
  }

  /*
   * Updates
   */
  static streamUpdatesOn(users: User[], callback: (users: User[]) => unknown) {
    if (!users.length) throw "Cannot stream user updates on an empty list"
    const listener = {
      objects: (event: PubNub.SetUUIDMetadataEvent<PubNub.ObjectCustom>) => {
        if (event.message.type !== "uuid") return
        const user = users.find((c) => c.id === event.channel)
        if (!user) return
        const newUser = User.fromDTO(user.chat, event.message.data)
        const newUsers = users.map((user) => (user.id === newUser.id ? newUser : user))
        callback(newUsers)
      },
    }
    const { chat } = users[0]
    const removeListener = chat.addListener(listener)
    const subscriptions = users.map((user) => chat.subscribe(user.id))
    return () => {
      removeListener()
      subscriptions.map((unsub) => unsub())
    }
  }

  streamUpdates(callback: (user: User) => unknown) {
    return User.streamUpdatesOn([this], (users) => callback(users[0]))
  }

  /*
   * Presence
   */
  async wherePresent() {
    return this.chat.wherePresent(this.id)
  }

  async isPresentOn(channelId: string) {
    return this.chat.isPresent(this.id, channelId)
  }

  /*
   * Memberships
   */
  async getMemberships(params: Omit<GetMembershipsParametersv2, "include"> = {}) {
    const membershipsResponse = await this.chat.sdk.objects.getMemberships({
      ...params,
      include: {
        totalCount: true,
        customFields: true,
        channelFields: true,
        customChannelFields: true,
      },
      filter: `!(channel.id LIKE '${INTERNAL_MODERATION_PREFIX}*')`,
    })

    return {
      page: {
        next: membershipsResponse.next,
        prev: membershipsResponse.prev,
      },
      total: membershipsResponse.totalCount,
      status: membershipsResponse.status,
      memberships: membershipsResponse.data.map((m) =>
        Membership.fromMembershipDTO(this.chat, m, this)
      ),
    }
  }

  /**
   * Moderation restrictions
   */

  async setRestrictions(channel: Channel, params: { ban?: boolean; mute?: boolean }) {
    if (!(this.chat.sdk as any)._config.secretKey)
      throw "Moderation restrictions can only be set by clients initialized with a Secret Key."
    return this.chat.setRestrictions(this.id, channel.id, params)
  }

  /* @internal */
  private async getRestrictions(
    channel?: Channel,
    params?: Pick<PubNub.GetMembershipsParametersv2, "limit" | "page" | "sort">
  ) {
    const filter = channel
      ? `channel.id == '${INTERNAL_MODERATION_PREFIX}${channel.id}'`
      : `channel.id LIKE '${INTERNAL_MODERATION_PREFIX}*'`
    return await this.chat.sdk.objects.getMemberships({
      uuid: this.id,
      include: {
        totalCount: true,
        customFields: true,
      },
      filter,
      ...params,
    })
  }

  async getChannelRestrictions(channel: Channel) {
    const response = await this.getRestrictions(channel)
    const restrictions = response && response.data[0]?.custom
    return {
      ban: !!restrictions?.ban,
      mute: !!restrictions?.mute,
    }
  }

  async getChannelsRestrictions(
    params?: Pick<PubNub.GetChannelMembersParameters, "limit" | "page" | "sort">
  ) {
    const response = await this.getRestrictions(undefined, params)
    return {
      page: {
        next: response.next,
        prev: response.prev,
      },
      total: response.totalCount,
      status: response.status,
      restrictions: response.data.map(({ custom, channel }) => ({
        ban: !!custom?.ban,
        mute: !!custom?.mute,
        channelId: channel.id.replace(INTERNAL_MODERATION_PREFIX, ""),
      })),
    }
  }

  /*
   * Other
   */
  async report(reason: string) {
    const channel = INTERNAL_ADMIN_CHANNEL
    const payload = {
      reason,
      reportedUserId: this.id,
    }
    return await this.chat.emitEvent({ channel, type: "report", payload })
  }
}
