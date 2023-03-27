import PubNub from "pubnub"
import { Channel } from "./channel"
import { User, CreateUserParams } from "./user"

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

  async createUser(id: string, data: CreateUserParams) {
    try {
      await this.sdk.objects.setUUIDMetadata({ uuid: id, data })
      return new User({ chat: this, id, ...data })
    } catch (error) {
      console.log("ERROR CREATING USER: ", error)
      throw error
    }
  }

  async getUser(id: string) {
    try {
      const response = await this.sdk.objects.getUUIDMetadata({ uuid: id })
      console.log("chat fetched user data: ", response)
      const data = response.data
      return new User({ chat: this, id, name: data.name || "" })
    } catch (error) {
      console.log("ERROR GETTING USER: ", error)
      throw error
    }
  }

  getChannel(id: string) {
    // TODO: connect to pubnub instead
    return new Channel({
      chat: this,
      id,
      name: id,
    })
  }

  getChatUser() {
    return this.user
  }

  setChatUser(user: User) {
    // this.sdk.setUUID(user.id)
    this.user = user
  }

  createChannel(params: { id: string; name: string }) {
    // create channel
  }
}
