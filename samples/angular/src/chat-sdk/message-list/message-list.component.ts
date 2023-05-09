import { Component, Input } from "@angular/core"
import { Channel, Chat, Message } from "@pubnub/chat"
import { StateService } from "../../app/state.service"

@Component({
  selector: "app-message-list-chat",
  templateUrl: "./message-list.component.html",
  styleUrls: ["./message-list.component.scss"],
})
export class MessageListComponentChat {
  @Input() channel!: Channel
  @Input() chat!: Chat

  messages: Message[]
  isPaginationEnd: boolean

  constructor(private stateService: StateService) {
    this.messages = []
    this.isPaginationEnd = false
  }

  async ngOnInit() {
    await this.loadMoreHistoricalMessages()

    this.stateService.currentChannelChange.subscribe((channel) => {
      this.messages = []
      channel!.join((message) => (this.messages = [...this.messages, message]))
    })
  }

  async loadMoreHistoricalMessages() {
    const historicalMessagesObject = await this.channel.getHistory({
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
