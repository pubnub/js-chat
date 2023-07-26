import { Component, Input } from "@angular/core"
import { Chat, User } from "@pubnub/chat"
import { v4 as uuidv4 } from "uuid"
import { StateService } from "../../app/state.service"

const range = (start: number, stop: number, step = 1) =>
  Array.from({ length: (stop - start) / step + 1 }, (_, i) => start + i * step)

@Component({
  selector: "app-create-group-conversation-modal-chat",
  templateUrl: "./create-group-conversation-modal.component.html",
  styleUrls: ["./create-group-conversation-modal.scss"],
})
export class CreateGroupConversationModalChat {
  randomUsers: User[] = []

  @Input() chat!: Chat
  get createGroupConversationChatSDKOpen(): boolean {
    return this.stateService.createGroupConversationChatSDKOpen
  }

  constructor(private stateService: StateService) {}

  toggleCreateChannelModal() {
    this.stateService.toggleCreateGroupConversationModalChatSDK()
  }

  async getSomeRandomUsers(userCount: number) {
    this.randomUsers = await Promise.all(
      range(0, userCount).map(async (index) => {
        const someRandomUser = `some-random-user-${index}`

        return (
          (await this.chat.getUser(someRandomUser)) ||
          (await this.chat.createUser(someRandomUser, { name: `some random user ${index}` }))
        )
      })
    )
  }

  async submitCreateChannelForm() {
    if (!this.randomUsers.length) {
      console.warn("Fetch users first")
      return
    }

    const response = await this.chat.createGroupConversation({
      users: this.randomUsers,
      channelId: uuidv4(),
      channelData: { name: "Group conversation" },
    })

    console.log("response", response)

    this.toggleCreateChannelModal()
  }
}
