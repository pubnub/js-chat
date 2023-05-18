import { Component, Input } from "@angular/core"
import { Chat } from "@pubnub/chat"
import { StateService } from "../../app/state.service"

@Component({
  selector: "app-create-direct-conversation-modal-chat",
  templateUrl: "./create-direct-conversation-modal.component.html",
  styleUrls: ["./create-direct-conversation-modal.scss"],
})
export class CreateDirectConversationModalChat {
  @Input() chat!: Chat
  get createDirectConversationChatSDKOpen(): boolean {
    return this.stateService.createDirectConversationChatSDKOpen
  }

  constructor(private stateService: StateService) {}

  toggleCreateChannelModal() {
    this.stateService.toggleCreateDirectConversationModalChatSDK()
  }

  async submitCreateChannelForm() {
    const someRandomUser = "some-random-user4"

    const someUser =
      (await this.chat.getUser(someRandomUser)) ||
      (await this.chat.createUser(someRandomUser, { name: "some random user" }))

    const response = await this.chat.createDirectConversation({
      user: someUser,
      channelData: { name: "Private conversation" },
    })

    this.toggleCreateChannelModal()
  }
}
