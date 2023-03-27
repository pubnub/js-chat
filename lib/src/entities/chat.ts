import PubNub from "pubnub"
import { Channel } from "./channel"
import { User } from "./user"

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

  async getChannel(id: string) {
    try {
      const channelMetadata = await this.sdk.objects.getChannelMetadata({
        channel: id,
      })
      return new Channel({
        chat: this,
        id,
        name: channelMetadata.data.name!,
      })
    } catch (e) {
      console.error("Are you sure this channel exists?");
      throw e;
    }
  }

  getUser(id: string) {
    // TODO: connect to pubnub instead
    return new User({
      chat: this,
      id,
      name: id
        .split("-")
        .map((w) => w[0].toUpperCase() + w.substring(1))
        .join(" "),
    })
  }

  getChatUser() {
    return this.user
  }

  setChatUser(user: User) {
    this.user = user
  }

  createUser(params: { id: string; name: string }) {
    // create user
  }

  async createChannel(params: { id: string; name: string }) {
    try {
      await this.sdk.objects.setChannelMetadata({
        channel: params.id,
        data: {
          name: params.name,
        }
      })

      return new Channel({
        chat: this,
        id: params.id,
        name: params.name,
      })
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
