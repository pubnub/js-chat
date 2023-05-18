import { Injectable } from "@angular/core"
import { Subject } from "rxjs"
import { Channel } from "@pubnub/chat"

@Injectable({
  providedIn: "root",
})
export class StateService {
  createChannelModalJSSDKOpen = false
  createChannelModalChatSDKOpen = false
  createDirectConversationChatSDKOpen = false
  currentChannel: Channel | null = null

  JSSDKModalVisibilityChange: Subject<boolean> = new Subject<boolean>()
  chatSDKModalVisibilityChange: Subject<boolean> = new Subject<boolean>()
  chatSDKCreateDirectConversationModalVisibilityChange: Subject<boolean> = new Subject<boolean>()
  currentChannelChange: Subject<Channel | null> = new Subject<Channel | null>()

  constructor() {
    this.JSSDKModalVisibilityChange.subscribe((value) => {
      this.createChannelModalJSSDKOpen = value
    })
    this.chatSDKModalVisibilityChange.subscribe((value) => {
      this.createChannelModalChatSDKOpen = value
    })
    this.chatSDKCreateDirectConversationModalVisibilityChange.subscribe((value) => {
      this.createDirectConversationChatSDKOpen = value
    })
    this.currentChannelChange.subscribe((value) => {
      this.currentChannel = value
    })
  }

  toggleCreateChannelModalChatSDK() {
    this.chatSDKModalVisibilityChange.next(!this.createChannelModalChatSDKOpen)
  }

  toggleCreateDirectConversationModalChatSDK() {
    this.chatSDKCreateDirectConversationModalVisibilityChange.next(
      !this.createDirectConversationChatSDKOpen
    )
  }

  toggleCreateChannelModalJSSDK() {
    this.JSSDKModalVisibilityChange.next(!this.createChannelModalJSSDKOpen)
  }

  toggleChannel(nextChannel: Channel) {
    this.currentChannelChange.next(nextChannel)
  }

  getCreateChannelModalJSSDKOpen() {
    return this.createChannelModalJSSDKOpen
  }

  getCreateChannelModalChatSDKOpen() {
    return this.createChannelModalChatSDKOpen
  }
}
