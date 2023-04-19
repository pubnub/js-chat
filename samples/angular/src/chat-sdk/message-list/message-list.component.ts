import { Component, Input } from "@angular/core"
import { Channel, Message } from "@pubnub/chat"

@Component({
  selector: "app-message-list-chat",
  templateUrl: "./message-list.component.html",
  styleUrls: ["./message-list.component.scss"],
})
export class MessageListComponentChat {
  @Input() channel!: Channel

  messages: Message[]
  isPaginationEnd: boolean

  constructor() {
    this.messages = []
    this.isPaginationEnd = false
  }

  async ngOnInit() {
    await this.loadMoreHistoricalMessages()

    this.channel.connect((message) => this.messages.push(message))
  }

  async loadMoreHistoricalMessages() {
    const historicalMessagesObject = await this.channel.getHistory({
      startTimetoken: this.messages?.[0]?.timetoken,
    })

    this.isPaginationEnd = !historicalMessagesObject.isMore

    this.messages = [...historicalMessagesObject.messages, ...this.messages]
  }
}
