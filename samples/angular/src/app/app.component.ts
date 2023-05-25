import { Component } from "@angular/core"
import PubNub from "pubnub"
import { Channel, Chat } from "@pubnub/chat"
import { StateService } from "./state.service"

const userId = "test-user"

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
    publishKey: "demo",
    subscribeKey: "demo",
    userId,
  })

  chat = Chat.init({
    publishKey: "demo",
    subscribeKey: "demo",
    userId,
    typingTimeout: 2000,
  })

  async ngOnInit() {
    const user =
      (await this.chat.getUser(userId)) ||
      (await this.chat.createUser(userId, { name: "Some name" }))

    this.chat.setChatUser(user)
    const channel =
      (await this.chat.getChannel("123")) ||
      (await this.chat.createChannel("123", { name: "Some channel" }))

    await this.stateService.toggleChannel(channel)
    this.channel = this.stateService.currentChannel

    this.forwardChannel =
      (await this.chat.getChannel("forward-channel")) ||
      (await this.chat.createChannel("forward-channel", { name: "forward channel" }))
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
}
