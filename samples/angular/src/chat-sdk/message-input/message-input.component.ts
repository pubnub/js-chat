import { Component, Input, ViewChild, ElementRef } from "@angular/core"
import { Channel, Chat, MessageDraft, MixedTextTypedElement, User } from "@pubnub/chat"
import { StateService } from "../../app/state.service"

@Component({
  selector: "app-message-input-chat",
  templateUrl: "./message-input.component.html",
  styleUrls: ["./message-input.component.scss"],
})
export class MessageInputComponentChat {
  pubnubInput = ""
  suggestedUsers: User[] = []
  suggestedChannels: Channel[] = []
  usersToNotify: User[] = []
  isAddTextLinkDialogOpen = false
  textLinkDialogValues: {
    text: string
    link: string
  } = {
    text: "",
    link: "",
  }
  @Input() channel!: Channel
  @Input() chat!: Chat
  newMessageDraft: MessageDraft
  lastAffectedNameOccurrenceIndex = -1
  lastAffectedChannelNameOccurrenceIndex = -1
  currentlyHighlightedMention: {
    mentionedUser: User | undefined | null
    nameOccurrenceIndex: number
  }
  messagePreview: MixedTextTypedElement[] = []

  @ViewChild("textAreaElement") userInput: ElementRef | undefined

  constructor(private stateService: StateService) {
    this.newMessageDraft = this.channel?.createMessageDraft()
    this.currentlyHighlightedMention = {
      mentionedUser: null,
      nameOccurrenceIndex: -1,
    }
  }

  ngOnInit() {
    this.newMessageDraft = this.channel.createMessageDraft({
      userSuggestionSource: "global",
      userLimit: 100,
    })
  }

  async handleInput(text: string) {
    const response = await this.newMessageDraft.onChange(text)
    this.suggestedUsers = response.users.suggestedUsers
    this.lastAffectedNameOccurrenceIndex = response.users.nameOccurrenceIndex
    this.suggestedChannels = response.channels.suggestedChannels
    this.lastAffectedChannelNameOccurrenceIndex = response.channels.channelOccurrenceIndex
    this.messagePreview = this.newMessageDraft.getMessagePreview()
  }

  toggleUserToNotify(user: User) {
    this.newMessageDraft.addMentionedUser(user, this.lastAffectedNameOccurrenceIndex)
    this.messagePreview = this.newMessageDraft.getMessagePreview()
  }

  toggleChannelToReference(channel: Channel) {
    this.newMessageDraft.addReferencedChannel(channel, this.lastAffectedChannelNameOccurrenceIndex)
    this.messagePreview = this.newMessageDraft.getMessagePreview()
    console.log("this.messagePreview", this.messagePreview)
  }

  removeUserFromNotification(nameOccurrenceIndex: number) {
    this.newMessageDraft.removeMentionedUser(nameOccurrenceIndex)
  }

  isUserToBeNotified(user: User) {
    return !!this.usersToNotify.find((u) => u.id === user.id)
  }

  get quotedMessage() {
    const quote = this.stateService.pendingQuotes[this.channel.id]

    if (!quote) {
      return undefined
    }

    return quote
  }

  async handleSend() {
    if (this.quotedMessage) {
      this.newMessageDraft.addQuote(this.quotedMessage)
    }

    const response = await this.newMessageDraft.send()

    this.suggestedUsers = []
    this.pubnubInput = ""
    this.stateService.changeChannelQuote({ [this.channel.id]: null })
  }

  handleCaret(event: any) {
    this.currentlyHighlightedMention = this.newMessageDraft.getHighlightedMention(
      this.userInput?.nativeElement.selectionStart
    )
  }

  toggleAddTextLinkDialog() {
    this.isAddTextLinkDialogOpen = !this.isAddTextLinkDialogOpen
  }

  handleDialogClose() {
    this.isAddTextLinkDialogOpen = false
    if (!this.textLinkDialogValues.text || !this.textLinkDialogValues.link) {
      return
    }

    this.newMessageDraft.addLinkedText({
      link: this.textLinkDialogValues.link,
      text: this.textLinkDialogValues.text,
      positionInInput: this.userInput?.nativeElement.selectionStart,
    })
    this.messagePreview = this.newMessageDraft.getMessagePreview()
  }

  removeTextLink() {
    this.newMessageDraft.removeLinkedText(this.userInput?.nativeElement.selectionStart)
    this.messagePreview = this.newMessageDraft.getMessagePreview()
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
}
