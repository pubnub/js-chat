import { Component, Input, SimpleChanges } from "@angular/core"
import { Channel, Chat, Message, ThreadMessage } from "@pubnub/chat"

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
  threadMessages: {
    [key: string]: ThreadMessage[]
  }
  pinnedMessages: {
    [key: string]: string
  }

  constructor() {
    this.messages = []
    this.isPaginationEnd = false
    this.threadMessages = {}
    this.pinnedMessages = {}
  }

  async getPinnedMessage(channel: Channel) {
    const pinnedMessage = await channel.getPinnedMessage()

    if (!pinnedMessage) {
      this.pinnedMessages[channel.id] = "No pinned message"
      return
    }

    this.pinnedMessages[channel.id] = pinnedMessage.text
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
    await this.getPinnedMessage(this.channel)
    const msg = historicalMessagesObject.messages[0]
    // console.log("historicalMessagesObject", historicalMessagesObject)
    // const ch = await this.chat.getChannel("123")
    // await ch!.sendText("Tex20", { rootMessage: msg })



    // await this.channel.sendText("Text1303", { rootMessage: msg })


    if (msg.threadRootId) {
      const thread = await msg.getThread()
      const threadMessages = await thread!.getHistory()

      console.log("threadMessages", threadMessages)
      // await this.channel.sendText("Text1303", { rootMessage: threadMessages.messages[0] })
      // console.log("threadMessages", threadMessages)
      // const c = await this.chat.getChannel(threadMessages.messages[0].channelId)
      // await c!.sendText("whatever", { rootMessage: threadMessages.messages[0] })
    }

    // const pinnedMessage = await this.channel.getPinnedMessage()

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

  async pinThreadMessage(message: ThreadMessage) {
    await message.pinToParentChannel()
  }

  async loadThreadMessages(message: Message) {
    if (!message.threadRootId) {
      return
    }

    const thread = await message.getThread()
    const threadMessages = await thread!.getHistory()
    await this.getPinnedMessage(thread!)
    this.threadMessages[message.timetoken] = threadMessages.messages
  }
}
