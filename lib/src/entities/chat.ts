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

  getChannel(id: string) {
    // TODO: connect to pubnub instead
    return new Channel({
      chat: this,
      id,
      name: id,
    })
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

  createChannel(params: { id: string; name: string }) {
    // create channel
  }
}
