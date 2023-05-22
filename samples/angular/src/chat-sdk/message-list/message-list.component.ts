import { Component, Input, SimpleChanges } from "@angular/core"
import { Channel, Chat, Message } from "@pubnub/chat"

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

  constructor() {
    this.messages = []
    this.isPaginationEnd = false
  }

  async ngOnChanges(changes: SimpleChanges) {
    if (changes["channel"].previousValue) {
      changes["channel"].previousValue.disconnect()
    }
    if (changes["channel"].currentValue) {
      this.messages = []
      await changes["channel"].currentValue.join(
        (message: Message) => (this.messages = [...this.messages, message])
      )
    }
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

  async inviteSomeoneToThisChannel() {
    const someExistingUser =
      (await this.chat.getUser("Przemek")) ||
      (await this.chat.createUser("Przemek", { name: "Lukasz" }))

    const r = await this.channel.invite(someExistingUser)
  }

  async pinMessage(message: Message) {
    await message.pin()
  }
}
