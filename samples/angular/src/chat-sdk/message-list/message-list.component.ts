import { Component, Input, SimpleChanges, Pipe, PipeTransform } from "@angular/core"
import { DomSanitizer, SafeHtml } from "@angular/platform-browser"
import {
  Channel,
  Chat,
  Message,
  MixedTextTypedElement,
  ThreadChannel,
  ThreadMessage,
} from "@pubnub/chat"
import { StateService } from "../../app/state.service"

@Pipe({
  name: "byPassSecurity",
})
export class ByPassSecurityPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  transform(value: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(value)
  }
}

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
  threadInputOpen = "0"
  threadChannelOpen: ThreadChannel | null = null

  constructor(private sanitizer: DomSanitizer, private stateService: StateService) {
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
    const msg = historicalMessagesObject.messages[1]

    const things = ["Rock", "Paper", "Scissor"]
    const thing = things[Math.floor(Math.random() * things.length)]

    // if (msg.hasThread) {
    //   const thread = await msg.getThread()
    //   thread.sendText(thing)
    // } else {
    //   const thread = await msg.createThread()
    //   thread.sendText(thing)
    // }

    this.isPaginationEnd = !historicalMessagesObject.isMore

    this.messages = [...historicalMessagesObject.messages, ...this.messages]
  }

  async forwardMessage(message: Message) {
    const forwardChannel =
      (await this.chat.getChannel("forward-channel")) ||
      (await this.chat.createPublicConversation({
        channelId: "forward-channel",
        channelData: { name: "forward channel" },
      }))

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
    if (!message.hasThread) {
      return
    }

    const thread = await message.getThread()

    const threadMessages = await thread!.getHistory()
    await this.getPinnedMessage(thread!)
    this.threadMessages[message.timetoken] = threadMessages.messages
  }

  renderMessagePart(messagePart: MixedTextTypedElement) {
    if (messagePart.type === "text") {
      return messagePart.content.text
    }
    if (messagePart.type === "plainLink") {
      return `<a href="${messagePart.content.link}">${messagePart.content.link}</a>`
    }
    if (messagePart.type === "textLink") {
      return `<a href="${messagePart.content.link}">${messagePart.content.text}</a>`
    }
    if (messagePart.type === "mention") {
      return `<a href="https://pubnub.com/${messagePart.content.id}">@${messagePart.content.name}</a>`
    }
    if (messagePart.type === "channelReference") {
      return `<a href="https://pubnub.com/${messagePart.content.id}">#${messagePart.content.name}</a>`
    }

    return ""
  }

  quoteMessage(message: Message) {
    this.stateService.changeChannelQuote({ [message.channelId]: message })
  }

  async openThread(message: Message) {
    if (message.hasThread) {
      const thread = await message.getThread()
      await this.loadThreadMessages(message)
      this.threadChannelOpen = thread
    } else {
      const thread = await message.createThread()
      this.threadChannelOpen = thread
    }

    this.threadInputOpen = message.timetoken
  }

  async removeThread(message: Message) {
    message.removeThread()
  }
}
