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

  renderUserMention(userMentionItem: UserMentionData) {
    const channelName =
      "channel" in userMentionItem
        ? userMentionItem["channel"].name
        : userMentionItem["parentChannel"].name

    const threadTextSuffix =
      "channel" in userMentionItem
        ? ""
        : `. This message was posted in a thread with id: ${userMentionItem["threadChannel"].id}.`

    return `${userMentionItem.user.name} mentioned you in #${channelName}${threadTextSuffix}`
  }
}
