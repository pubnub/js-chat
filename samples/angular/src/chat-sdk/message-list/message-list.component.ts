import { Component, Input } from "@angular/core"
import { Chat, Message } from "@pubnub/chat"
import { StateService } from "../../app/state.service"

@Component({
  selector: "app-message-list-chat",
  templateUrl: "./message-list.component.html",
  styleUrls: ["./message-list.component.scss"],
})
export class MessageListComponentChat {
  @Input() chat!: Chat

  messages: Message[]
  isPaginationEnd: boolean

  constructor(private stateService: StateService) {
    this.messages = []
    this.isPaginationEnd = false
  }

  async ngOnInit() {
    this.stateService.currentChannelChange.subscribe(async (channel) => {
      this.messages = []
      await this.loadMoreHistoricalMessages()
      await channel!.join((message) => (this.messages = [...this.messages, message]))
    })

    const channelMembers = await this.stateService.currentChannel!.getChannelMembers()
  }

  async loadMoreHistoricalMessages() {
    const historicalMessagesObject = await this.stateService.currentChannel!.getHistory({
      startTimetoken: this.messages?.[0]?.timetoken,
    })

    this.isPaginationEnd = !historicalMessagesObject.isMore

    this.messages = [...historicalMessagesObject.messages, ...this.messages]
  }

  async forwardMessage(message: Message) {
    const forwardChannel =
      (await this.chat.getChannel("forward-channel")) ||
      (await this.chat.createChannel("forward-channel", { name: "forward channel" }))

    await forwardChannel.forwardMessage(message)

    console.log("Message forwarded to:", forwardChannel.id)
  }
}
