import PubNub, {
  SetUUIDMetadataParameters,
  SetChannelMetadataParameters,
  GetAllMetadataParameters,
  ObjectCustom,
  ChannelMetadata,
} from "pubnub"
import { Channel, ChannelFields } from "./channel"
import { User, UserFields } from "./user"

type ChatConfig = {
  saveDebugLog: boolean
  typingTimeout: number
}

type ChatConstructor = Partial<ChatConfig> & PubNub.PubnubConfig

export class Chat {
  readonly sdk: PubNub
  readonly config: ChatConfig
  private user?: User

  constructor(params: ChatConstructor) {
    const { saveDebugLog, typingTimeout, ...pubnubConfig } = params
    this.sdk = new PubNub(pubnubConfig)
    this.config = {
      saveDebugLog: saveDebugLog || false,
      typingTimeout: typingTimeout || 5000,
    }
  }

  static init(params: ChatConstructor) {
    return new Chat(params)
  }

  /**
   * Current user
   */
  getChatUser() {
    return this.user
  }

  setChatUser(user: User) {
    // this.sdk.setUUID(user.id)
    this.user = user
  }

  /**
   * Users
   */
  async getUser(id: string) {
    if (!id.length) throw "ID is required"
    try {
      const response = await this.sdk.objects.getUUIDMetadata({ uuid: id })
      return User.fromDTO(this, response.data)
    } catch (error) {
      const e = error as { status: { errorData: { status: number } } }
      if (e?.status?.errorData?.status === 404) return null
      else throw error
    }
  }

  async createUser(id: string, data: Omit<UserFields, "id">) {
    if (!id.length) throw "ID is required"
    try {
      const existingUser = await this.getUser(id)
      if (existingUser) throw "User with this ID already exists"
      const response = await this.sdk.objects.setUUIDMetadata({ uuid: id, data })
      return User.fromDTO(this, response.data)
    } catch (error) {
      throw error
    }
  }

  async updateUser(id: string, data: Omit<UserFields, "id">) {
    if (!id.length) throw "ID is required"
    try {
      const existingUser = await this.getUser(id)
      if (!existingUser) throw "User with this ID does not exist"
      const response = await this.sdk.objects.setUUIDMetadata({ uuid: id, data })
      return User.fromDTO(this, response.data)
    } catch (error) {
      throw error
    }
  }

  async deleteUser(id: string, soft = false) {
    if (!id.length) throw "ID is required"
    try {
      if (soft) {
        const response = await this.sdk.objects.setUUIDMetadata({
          uuid: id,
          data: { status: "deleted" },
        } as SetUUIDMetadataParameters<ObjectCustom>)
        return User.fromDTO(this, response.data)
      } else {
        await this.sdk.objects.removeUUIDMetadata({ uuid: id })
        return true
      }
    } catch (error) {
      throw error
    }
  }

  async getUsers(params: Omit<GetAllMetadataParameters, "include">) {
    const mandatoryOptions = {
      include: {
        totalCount: true,
        customFields: true,
      },
    }
    const options = Object.assign({}, params, mandatoryOptions)
    try {
      const response = await this.sdk.objects.getAllUUIDMetadata(options)
      return {
        users: response.data.map((u) => User.fromDTO(this, u)),
        page: {
          next: response.next,
          prev: response.prev,
        },
        total: response.totalCount,
      }
    } catch (error) {
      throw error
    }
  }

  /**
   *  Channels
   */
  async getChannel(id: string) {
    if (!id.length) throw "ID is required"
    try {
      const response = await this.sdk.objects.getChannelMetadata({
        channel: id,
      })
      return Channel.fromDTO(this, response.data)
    } catch (error) {
      const e = error as { status: { errorData: { status: number } } }
      if (e?.status?.errorData?.status === 404) return null
      else throw error
    }
  }

  async updateChannel(id: string, data: Omit<ChannelFields, "id">) {
    if (!id.length) throw "ID is required"
    try {
      const existingChannel = await this.getChannel(id)
      if (!existingChannel) throw "Channel with this ID does not exist"
      const response = await this.sdk.objects.setChannelMetadata({
        channel: id,
        data,
      })
      return Channel.fromDTO(this, response.data)
    } catch (e) {
      console.error(e)
      throw e
    }
  }

  async createChannel(id: string, data: ChannelMetadata<ObjectCustom>) {
    if (!id.length) throw "ID is required"
    try {
      const existingChannel = await this.getChannel(id)
      if (existingChannel) throw "Channel with this ID already exists"
      const response = await this.sdk.objects.setChannelMetadata({
        channel: id,
        data,
      })
      return Channel.fromDTO(this, response.data)
    } catch (e) {
      console.error(e)
      throw e
    }
  }

  async getChannels(params: Omit<GetAllMetadataParameters, "include">) {
    const mandatoryOptions = {
      include: {
        totalCount: true,
        customFields: true,
      },
    }
    const options = Object.assign({}, params, mandatoryOptions)
    try {
      const response = await this.sdk.objects.getAllChannelMetadata(options)
      return {
        channels: response.data.map((u) => Channel.fromDTO(this, u)),
        page: {
          next: response.next,
          prev: response.prev,
        },
        total: response.totalCount,
      }
    } catch (error) {
      throw error
    }
  }

  async deleteChannel(id: string, soft = false) {
    if (!id.length) throw "ID is required"
    try {
      if (soft) {
        const response = await this.sdk.objects.setChannelMetadata({
          channel: id,
          data: { status: "deleted" },
        } as SetChannelMetadataParameters<ObjectCustom>)
        return Channel.fromDTO(this, response.data)
      } else {
        await this.sdk.objects.removeChannelMetadata({ channel: id })
        return true
      }
    } catch (error) {
      throw error
    }
  }

  /**
   *  Presence
   */
  async wherePresent(id: string) {
    if (!id.length) throw "ID is required"
    try {
      const response = await this.sdk.whereNow({ uuid: id })
      return response.channels
    } catch (error) {
      throw error
    }
  }

  async whoIsPresent(id: string) {
    if (!id.length) throw "ID is required"
    try {
      const response = await this.sdk.hereNow({ channels: [id] })
      return response.channels[id].occupants.map((u) => u.uuid)
    } catch (error) {
      throw error
    }
  }

  async isPresent(userId: string, channelId: string) {
    if (!userId.length) throw "User ID is required"
    if (!channelId.length) throw "Channel ID is required"
    try {
      const response = await this.sdk.whereNow({ uuid: userId })
      return response.channels.includes(channelId)
    } catch (error) {
      throw error
    }
  }
}
