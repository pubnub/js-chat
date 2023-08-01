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
    publishKey: "pub-c-0457cb83-0786-43df-bc70-723b16a6e816",
    subscribeKey: "sub-c-e654122d-85b5-49a6-a3dd-8ebc93c882de",
    userId,
  })

  chat?: Chat

  async ngOnInit() {
    const storage = {}
    const setItem = (key: string, value: string) => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      storage[key] = value
    }
    const getItem = (key: string) => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      return storage[key]
    }

    this.chat = await Chat.init({
      publishKey: "pub-c-0457cb83-0786-43df-bc70-723b16a6e816",
      subscribeKey: "sub-c-e654122d-85b5-49a6-a3dd-8ebc93c882de",
      userId,
      typingTimeout: 2000,
      errorLogger: {
        setItem(key: string, value: string) {
          setItem(key, value)
        },
        getItem(key: string) {
          return getItem(key)
        },
        getStorageObject() {
          return storage
        },
      },
    })
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    window.storage = storage

    const channel =
      (await this.chat.getChannel("123")) ||
      (await this.chat.createChannel("123", { name: "Some channel" }))

    // channel.update(Symbol("hello!"))
    // this.chat.updateChannel(channel.id, Symbol("hello world!"))
    // this.chat.getChannel("")
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    // this.chat.createChannel(Symbol("symbol"), { name: "a" })
    // this.chat.createChannel('Lorem-ipsum-dolor-sit-amet,-consectetur-adipiscing-elit.-Donec-vitae-ligula-nec-urna-euismod-pretium.-Duis-placerat-volutpat-erat,-a-tincidunt-eros-ultricies-in.-Sed-sagittis-felis-ac-velit-euismod,-quis-imperdiet-felis-consectetur.-Aenean-fermentum-faucibus-dolor-in-iaculis.-Ut-venenatis-est-quis-lectus-malesuada-feugiat.-Pellentesque-habitant-morbi-tristique-senectus-et-netus-et-malesuada-fames-ac-turpis-egestas.-Quisque-elit-lorem,-molestie-et-mi-non,-consectetur-cursus-tellus.-Nullam-tempus-mattis-leo-ac-feugiat.-Phasellus-in-sem-ac-ligula-sagittis-cursus-eu-et-metus.-Vestibulum-pretium-eros-et-pretium-scelerisque.-Morbi-eu-luctus-est,-vel-hendrerit-neque.-Proin-sed-lobortis-mauris,-id-bibendum-leo.', { name: "hello world" })

    await this.stateService.toggleChannel(channel)
    this.channel = this.stateService.currentChannel

    this.forwardChannel =
      (await this.chat.getChannel("forward-channel")) ||
      (await this.chat.createChannel("forward-channel", { name: "forward channel" }))

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    // this.chat.getChannel();
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
