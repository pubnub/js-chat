import { Component } from "@angular/core"
import PubNub from "pubnub"
import { Channel, Chat } from "@pubnub/chat"
import { StateService } from "./state.service"

const userId = (new URLSearchParams(window.location.search).get("userid") as string) || "test-user"

const publishKey = "demo"
const subscribeKey = "demo"

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
      storeUserActivityTimestamps: true,
    })

    const channel =
      (await this.chat.getChannel("test-channel")) ||
      (await this.chat.createPublicConversation({
        channelId: "test-channel",
        channelData: { name: "Some channel" },
      }))

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    // channel.sendText([])
    //
    // channel.update(Symbol("hello!"))
    // this.chat.updateChannel(channel.id, Symbol("hello world!"))
    // this.chat.getChannel("")
    // this.chat.createPublicConversation({
    //   channelId:
    //     "Lorem-ipsum-dolor-sit-amet,-consectetur-adipiscing-elit.-Donec-vitae-ligula-nec-urna-euismod-pretium.-Duis-placerat-volutpat-erat,-a-tincidunt-eros-ultricies-in.-Sed-sagittis-felis-ac-velit-euismod,-quis-imperdiet-felis-consectetur.-Aenean-fermentum-faucibus-dolor-in-iaculis.-Ut-venenatis-est-quis-lectus-malesuada-feugiat.-Pellentesque-habitant-morbi-tristique-senectus-et-netus-et-malesuada-fames-ac-turpis-egestas.-Quisque-elit-lorem,-molestie-et-mi-non,-consectetur-cursus-tellus.-Nullam-tempus-mattis-leo-ac-feugiat.-Phasellus-in-sem-ac-ligula-sagittis-cursus-eu-et-metus.-Vestibulum-pretium-eros-et-pretium-scelerisque.-Morbi-eu-luctus-est,-vel-hendrerit-neque.-Proin-sed-lobortis-mauris,-id-bibendum-leo.",
    //   channelData: { name: "hello world" },
    // })

    await this.stateService.toggleChannel(channel)
    this.channel = this.stateService.currentChannel

    this.forwardChannel =
      (await this.chat.getChannel("forward-channel")) ||
      (await this.chat.createPublicConversation({
        channelId: "forward-channel",
        channelData: { name: "forward channel" },
      }))

    // const messagesObj = await channel.getHistory()
    //
    // this.forwardChannel.sendText("some text", { quotedMessage: messagesObj.messages[0] })
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
}
