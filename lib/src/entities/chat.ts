import PubNub from "pubnub"
import { Channel } from "./channel"

type ChatConstructor = {
  saveDebugLog?: boolean
} & PubNub.PubnubConfig

export class Chat {
  readonly sdk: PubNub

  constructor(params: ChatConstructor) {
    const { saveDebugLog, ...pubnubConfig } = params
    this.sdk = new PubNub(pubnubConfig)
  }

  static init(params: ChatConstructor) {
    return new Chat(params)
  }

  getChannel(id: string) {
    // TODO: connect to pubnub instead
    return new Channel({
      sdk: this.sdk,
      id,
      name: id,
    })
  }

  createUser(params: { id: string; name: string }) {
    // create user
  }

  createChannel(params: { id: string; name: string }) {
    // create channel
  }
}
