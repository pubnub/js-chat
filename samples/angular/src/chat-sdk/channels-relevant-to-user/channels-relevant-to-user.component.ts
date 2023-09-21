import { Component, Input } from "@angular/core"
import { StateService } from "../../app/state.service"
import { Chat, MixedTextTypedElement, UserMentionData } from "@pubnub/chat"

@Component({
  selector: "app-channels-relevant-to-user",
  templateUrl: "./channels-relevant-to-user.component.html",
  styleUrls: ["./channels-relevant-to-user.component.scss"],
})
export class ChannelsRelevantToUserComponent {
  @Input() chat!: Chat
  enhancedUserMentionsData: Awaited<
    ReturnType<Chat["getCurrentUserMentions"]>
  >["enhancedMentionsData"] = []

  constructor(public stateService: StateService) {}

  async ngOnInit() {
    this.enhancedUserMentionsData = (await this.chat.getCurrentUserMentions()).enhancedMentionsData
  }

  closeChannelsRelevantToUser() {
    this.stateService.toggleChannelsRelevantToUser()
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

    return ""
  }

  async renderUserMention(userMentionItem: UserMentionData) {
    const channelId =
      "channelId" in userMentionItem
        ? userMentionItem["channelId"]
        : userMentionItem["parentChannelId"]

    const threadTextSuffix =
      "channelId" in userMentionItem
        ? ""
        : `. This message was posted in a thread with id: ${userMentionItem["threadChannelId"]}.`

    const [user, channel] = await Promise.all([
      this.chat.getUser(userMentionItem.userId),
      this.chat.getChannel(channelId),
    ])

    return `${user ? user.name || user.id : "[Removed user]"} mentioned you in #${
      channel ? channel.name || channel.id : "[Removed channel]"
    }${threadTextSuffix}`
  }
}
