import { Component, Input, ViewChild, ElementRef } from "@angular/core"
import { Channel, Chat, MessageDraft, User } from "@pubnub/chat"

@Component({
  selector: "app-message-input-chat",
  templateUrl: "./message-input.component.html",
  styleUrls: ["./message-input.component.scss"],
})
export class MessageInputComponentChat {
  pubnubInput = ""
  suggestedUsers: User[] = []
  usersToNotify: User[] = []
  @Input() channel!: Channel
  @Input() chat!: Chat
  @Input() typingSent!: boolean
  newMessageDraft: MessageDraft
  lastAffectedNameOccurrenceIndex = -1
  currentlyHighlightedMention: {
    mentionedUser: User | undefined | null
    nameOccurrenceIndex: number
  }

  @ViewChild("textAreaElement") userInput: ElementRef | undefined

  constructor() {
    this.newMessageDraft = this.channel?.createMessageDraft()
    this.currentlyHighlightedMention = {
      mentionedUser: null,
      nameOccurrenceIndex: -1,
    }
  }

  ngOnInit() {
    this.newMessageDraft = this.channel.createMessageDraft({ userSuggestionSource: "global" })
  }

  async handleInput(text: string) {
    const response = await this.newMessageDraft.onChange(text)
    // console.log("response??", response)
    this.suggestedUsers = response.suggestedUsers
    this.lastAffectedNameOccurrenceIndex = response.nameOccurrenceIndex
  }

  toggleUserToNotify(user: User) {
    this.newMessageDraft.addMentionedUser(user, this.lastAffectedNameOccurrenceIndex)
  }

  removeUserFromNotification(nameOccurrenceIndex: number) {
    this.newMessageDraft.removeMentionedUser(nameOccurrenceIndex)
  }

  isUserToBeNotified(user: User) {
    return !!this.usersToNotify.find((u) => u.id === user.id)
  }

  async handleSend() {
    const response = await this.newMessageDraft.send()

    this.suggestedUsers = []
    this.pubnubInput = ""
  }

  handleCaret(event: any) {
    this.currentlyHighlightedMention = this.newMessageDraft.getHighlightedMention(
      this.userInput?.nativeElement.selectionStart
    )
  }
}
