import PubNub, {UriFileInput} from "pubnub";

type ChannelConstructor = {
  sdk: PubNub;
}

export class Channel {
  readonly sdk: PubNub;

  constructor(params: ChannelConstructor) {
    this.sdk = params.sdk;
  }

  connect(callback: (event: unknown) => void) {
    // Subscribe to this channel and listen for events
  }

  disconnect() {}

  getTyping(callback: (event: unknown) => void) {
    // listen to typing events
  }

  fetchHistory({ start, end, count = 20 }: { start?: string; end?: string; count?: number }) {
  // API should allow to differentiate between thread messages and
  // root messages
  }

  togglePinMessage(messageTimeToken: string) {}

  getUnreadMessagesCount() {}

  publish({ text, file, quote, threadId }: { text?: string, file?: UriFileInput, quote?: string, threadId?: string }) {}

  star() {}

  getMembers() {};

  getOnlineMembers() {};

  search(phrase: string) {};
}
