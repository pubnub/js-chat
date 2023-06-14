import { Component, Input } from "@angular/core"
import { Channel, Chat, User } from "@pubnub/chat"

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

  async handleInput(text: string) {
    const result = await this.chat.getSuggestedGlobalUsers(text)
    console.log("result", result)
    this.suggestedUsers = result
    // const members = await this.channel.getSuggestedChannelMembers(text)
    // console.log("members", members)
    this.pubnubInput ? this.channel.startTyping() : this.channel.stopTyping()
  }

  toggleUserToNotify(user: User) {
    const userAlreadyAdded = this.usersToNotify.find((u) => u.id === user.id)

    if (!!userAlreadyAdded) {
      this.usersToNotify = this.usersToNotify.filter((u) => u.id !== user.id)
    } else {
      this.usersToNotify.push(user)
    }
  }

  isUserToBeNotified(user: User) {
    return !!this.usersToNotify.find((u) => u.id === user.id)
  }

  async handleSend() {
    const response = await this.channel.sendText(this.pubnubInput, {
      meta: { foo: "bar" },
    })
    this.pubnubInput = ""
  }
}
