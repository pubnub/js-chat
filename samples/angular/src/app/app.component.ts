import { Component } from "@angular/core"
import PubNub from "pubnub"
import { Channel, Chat } from "@pubnub/chat"
import { StateService } from "./state.service"

const userId = (new URLSearchParams(window.location.search).get("userid") as string) || "test-user"

const publishKey = "pub-c-0457cb83-0786-43df-bc70-723b16a6e816"
const subscribeKey = "sub-c-e654122d-85b5-49a6-a3dd-8ebc93c882de"

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"],
})
export class AppComponent {
  title = "angular"
  pubnubInput = ""
  messages = [] as any[]
  typingReceived = false
  typingSent = false
  channel: Channel | null = null
  forwardChannel: Channel | null = null

  constructor(public stateService: StateService) {}

  pubnub = new PubNub({
    publishKey,
    subscribeKey,
    userId,
  })

  chat?: Chat

  async ngOnInit() {
    this.chat = await Chat.init({
      publishKey,
      subscribeKey,
      userId,
      typingTimeout: 2000,
    })

    const channel =
      (await this.chat.getChannel("test-channel")) ||
      (await this.chat.createPublicConversation({
        channelId: "test-channel",
        channelData: { name: "test channel" },
      }))

    await this.stateService.toggleChannel(channel)
    this.channel = this.stateService.currentChannel

    this.forwardChannel =
      (await this.chat.getChannel("forward-channel")) ||
      (await this.chat.createPublicConversation({
        channelId: "forward-channel",
        channelData: { name: "forward channel" },
      }))
  }

  toggleCreateChannelModalChatSDK() {
    this.stateService.toggleCreateChannelModalChatSDK()
  }

  toggleCreateChannelModalJSSDK() {
    this.stateService.toggleCreateChannelModalJSSDK()
  }

  toggleCreateDirectConversationModalChatSDK() {
    this.stateService.toggleCreateDirectConversationModalChatSDK()
  }

  toggleCreateGroupConversationModalChatSDK() {
    this.stateService.toggleCreateGroupConversationModalChatSDK()
  }

  downloadDebugLog() {
    this.chat?.downloadDebugLog()
  }

  openChannelsRelevantToUser() {
    this.stateService.toggleChannelsRelevantToUser()
  }
}
