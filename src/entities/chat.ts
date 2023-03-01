import PubNub from "pubnub";
import { MessageConstructorParams } from "./message";

type ChatConstructor = {
  saveDebugLog?: boolean
} & PubNub.PubnubConfig;

export class Chat {
  readonly sdk: PubNub;

  constructor(params: ChatConstructor) {
    const { saveDebugLog, ...pubnubConfig } = params;

    this.sdk = new PubNub(pubnubConfig);
  }

  createUser(params: { id: string; name: string }) {}

  createChannel(params: { id: string; name: string }) {}

  createMessage(params: MessageConstructorParams) {}

  getChannels() {};
}
