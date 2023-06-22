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
  newMention: { name: string; nameOccurrenceIndex: number } = { name: "", nameOccurrenceIndex: -1 }
  currentlyHighlightedMention: User | undefined | null

  @ViewChild("textAreaElement") userInput: ElementRef | undefined

  constructor() {
    this.newMessageDraft = this.channel?.createMessageDraft()
  }

  ngOnInit() {
    this.newMessageDraft = this.channel.createMessageDraft()
  }

  async handleInput(text: string) {
    const resp = this.newMessageDraft.onChange(text)

    if (resp.differentMention) {
      this.newMention = resp.differentMention
      this.suggestedUsers = await this.chat.getSuggestedGlobalUsers(resp.differentMention.name)
    } else {
      this.suggestedUsers = []
    }

    this.pubnubInput ? this.channel.startTyping() : this.channel.stopTyping()
  }

  toggleUserToNotify(user: User) {
    this.newMessageDraft.addMentionedUser(user, this.newMention)
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
