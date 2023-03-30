import PubNub, {
  SetUUIDMetadataParameters,
  GetAllMetadataParameters,
  ObjectCustom,
  ChannelMetadata,
} from "pubnub"
import { Channel } from "./channel"
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

  async getUser(id?: string) {
    const uuid = id || this.sdk.getUUID()
    try {
      const response = await this.sdk.objects.getUUIDMetadata({ uuid })
      return User.fromDTO(this, response.data)
    } catch (error) {
      const e = error as { status: { errorData: { status: number } } }
      if (e?.status?.errorData?.status === 404) return null
      else throw error
    }
  }

  async createUser(id: string, data: Omit<UserFields, "id">) {
    if (!id.length) throw "ID is required when creating a User"
    try {
      const response = await this.sdk.objects.setUUIDMetadata({ uuid: id, data })
      return User.fromDTO(this, response.data)
    } catch (error) {
      throw error
    }
  }

  async deleteUser(id: string, soft = false) {
    const uuid = id || this.sdk.getUUID()
    try {
      if (soft) {
        const response = await this.sdk.objects.setUUIDMetadata({
          uuid,
          data: { status: "deleted" },
        } as SetUUIDMetadataParameters<ObjectCustom>)
        return User.fromDTO(this, response.data)
      } else {
        await this.sdk.objects.removeUUIDMetadata({ uuid })
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

  async getChannel(id: string) {
    try {
      const response = await this.sdk.objects.getChannelMetadata({
        channel: id,
      })
      return Channel.fromDTO(this, response.data)
    } catch (e) {
      console.error("Are you sure this channel exists?");
      throw e;
    }
  }

  getChatUser() {
    return this.user
  }

  setChatUser(user: User) {
    // this.sdk.setUUID(user.id)
    this.user = user
  }

  async createChannel(id: string, data: ChannelMetadata<ObjectCustom>) {
    if (!id.length) throw "ID is required when creating a Channel"
    try {
      const response = await this.sdk.objects.setChannelMetadata({
        channel: id,
        data,
      })

      return Channel.fromDTO(this, response.data)
    } catch (e) {
      console.error(e);
      throw e;
    }
  }

  getChannels() {
    // TODO
    return Promise.resolve({ data: [] })
  }
}
