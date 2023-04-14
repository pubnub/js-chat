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

  constructor(private stateService: StateService) {}

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
    this.channel =
      (await this.chat.getChannel("test-channel")) ||
      (await this.chat.createChannel("test-channel", { name: "Some channel" }))
  }

  toggleCreateChannelModalChatSDK() {
    this.stateService.toggleCreateChannelModalChatSDK()
  }

  toggleCreateChannelModalJSSDK() {
    this.stateService.toggleCreateChannelModalJSSDK()
  }
}
