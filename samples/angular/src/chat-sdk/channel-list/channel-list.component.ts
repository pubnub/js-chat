import { Component, Input } from "@angular/core"
import { Channel, Chat, MembershipResponse } from "@pubnub/chat"
import { StateService } from "../../app/state.service"

@Component({
  selector: "app-channel-list-chat",
  templateUrl: "./channel-list.component.html",
  styleUrls: ["./channel-list.component.scss"],
})
export class ChannelListComponentChat {
  @Input() chat!: Chat
  channels: Channel[] = []
  channelClickedNumber = -1
  nameInput = ""
  membershipResponse: MembershipResponse | null = null
  buttonTexts: { [key: string]: string } = {}

  constructor(private stateService: StateService) {}

  async loadChannels() {
    this.channels = (await this.chat.getChannels({ limit: 5 })).channels
  }

  async loadMemberships() {
    const user = await this.chat.getUser("test-user")
    this.membershipResponse = await user!.getMemberships()

    this.channels.forEach((c) => {
      this.buttonTexts[c.id] = this.membershipResponse?.data.find((m) => m.channel.id === c.id)
        ? "Leave"
        : "Join"
    })
  }

  async ngOnInit() {
    await this.loadChannels()

    this.loadMemberships()
  }

  clickOnChannel(index: number) {
    this.channelClickedNumber = index
  }

  async editChannel() {
    await this.channels[this.channelClickedNumber].update({ name: this.nameInput })
    this.channelClickedNumber = -1
    this.nameInput = ""
    this.loadChannels()
  }

  async deleteChannel(channelId: string) {
    await this.chat.deleteChannel(channelId)
    await this.loadChannels()
  }

  async toggleChannel(channelId: string) {
    const channel = await this.chat.getChannel(channelId)

    await this.stateService.toggleChannel(channel!, this.buttonTexts[channelId] === "Join")
    await this.loadMemberships()
  }
}
