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

  constructor(private stateService: StateService) {}

  pubnub = new PubNub({
    publishKey: "pub-c-0457cb83-0786-43df-bc70-723b16a6e816",
    subscribeKey: "sub-c-e654122d-85b5-49a6-a3dd-8ebc93c882de",
    userId,
  })

  chat = Chat.init({
    publishKey: "pub-c-0457cb83-0786-43df-bc70-723b16a6e816",
    subscribeKey: "sub-c-e654122d-85b5-49a6-a3dd-8ebc93c882de",
    userId,
    typingTimeout: 2000,
  })

  async ngOnInit() {
    const user =
      (await this.chat.getUser(userId)) ||
      (await this.chat.createUser(userId, { name: "Some name" }))

    console.log("memberships", await user.getMemberships())

    this.chat.setChatUser(user)
    this.channel =
      (await this.chat.getChannel("test-channel")) ||
      (await this.chat.createChannel("test-channel", { name: "Some channel" }))
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
}
