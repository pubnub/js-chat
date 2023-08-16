import { Injectable } from "@angular/core"
import { Subject } from "rxjs"
import { Channel, Message } from "@pubnub/chat"

@Injectable({
  providedIn: "root",
})
export class StateService {
  createChannelModalJSSDKOpen = false
  createChannelModalChatSDKOpen = false
  createDirectConversationChatSDKOpen = false
  createGroupConversationChatSDKOpen = false
  currentChannel: Channel | null = null
  pendingQuotes: { [channelId: string]: Message | null } = {}
  channelsRelevantToUserModalOpen = false

  JSSDKModalVisibilityChange: Subject<boolean> = new Subject<boolean>()
  chatSDKModalVisibilityChange: Subject<boolean> = new Subject<boolean>()
  chatSDKCreateDirectConversationModalVisibilityChange: Subject<boolean> = new Subject<boolean>()
  chatSDKCreateGroupConversationModalVisibilityChange: Subject<boolean> = new Subject<boolean>()
  currentChannelChange: Subject<Channel | null> = new Subject<Channel | null>()
  pendingQuotesChange: Subject<{ [channelId: string]: Message | null }> = new Subject<{
    [channelId: string]: Message | null
  }>()
  channelsRelevantToUserModalVisibilityChange: Subject<boolean> = new Subject<boolean>()

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
    this.pendingQuotesChange.subscribe((value) => {
      this.pendingQuotes = { ...this.pendingQuotes, ...value }
    })
    this.chatSDKCreateGroupConversationModalVisibilityChange.subscribe((value) => {
      this.createGroupConversationChatSDKOpen = value
    })
    this.channelsRelevantToUserModalVisibilityChange.subscribe((value) => {
      this.channelsRelevantToUserModalOpen = value
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

  toggleCreateGroupConversationModalChatSDK() {
    this.chatSDKCreateGroupConversationModalVisibilityChange.next(
      !this.createGroupConversationChatSDKOpen
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

  changeChannelQuote(channelQuote: { [channelId: string]: Message | null }) {
    this.pendingQuotesChange.next(channelQuote)
  }

  toggleChannelsRelevantToUser() {
    this.channelsRelevantToUserModalVisibilityChange.next(!this.channelsRelevantToUserModalOpen)
  }
}
