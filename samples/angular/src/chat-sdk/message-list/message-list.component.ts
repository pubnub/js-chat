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
      await changes["channel"].currentValue.join((message: Message) => {
        return (this.messages = [...this.messages, message])
      })
    }
  }

  async loadMoreHistoricalMessages() {
    const historicalMessagesObject = await this.channel.getHistory({
      startTimetoken: this.messages?.[0]?.timetoken,
    })
    const msg = historicalMessagesObject.messages[0]
    // const ch = await this.chat.getChannel("6VsqhDZIyFdQJzCbBpJz")
    // await ch!.sendText("Text7", { rootMessage: msg })
    // await this.channel.sendText("Text8", { rootMessage: msg })

    // if (msg.threadRootId) {
    // const thread = await msg.getThread()
    // const threadMessages = await thread!.getHistory()
    // console.log("threadMessages", threadMessages)
    // const c = await this.chat.getChannel(threadMessages.messages[0].channelId)
    // await c!.sendText("whatever", { rootMessage: threadMessages.messages[0] })
    // }

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
}
