import { Component, Input } from "@angular/core"
import PubNub from "pubnub"

@Component({
  selector: "app-message-list-sdk",
  templateUrl: "./message-list.component.html",
  styleUrls: ["./message-list.component.scss"],
})
export class MessageListComponentSDK {
  @Input() pubnub!: PubNub
  @Input() channel!: string
  isPaginationEnd: boolean
  messages: any[]
  typingReceived = false

  constructor() {
    this.isPaginationEnd = false
    this.messages = []
  }

  async getHistory() {
    try {
      const options = {
        channels: [this.channel],
        count: 25,
        start: this.messages?.[0]?.timetoken,
        includeMessageActions: true,
        includeMeta: true,
      }

      const response = await this.pubnub.fetchMessages(options)

      this.isPaginationEnd = response.channels[this.channel].length !== 25
      this.messages = [...response.channels[this.channel], ...this.messages]
    } catch (error) {
      throw error
    }
  }

  async ngOnInit() {
    await this.getHistory()

    this.pubnub.subscribe({
      channels: [this.channel],
    })

    this.pubnub.addListener({
      message: (event) => {
        const { message } = event
        if (message.type === "text") this.messages.push(message)
      },
      signal: (event) => {
        const { message } = event
        if (message.type === "typing") this.typingReceived = message.value
      },
    })
  }
}
