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
    this.channels = (await this.chat.getChannels({ limit: 100 })).channels
  }

  async loadMemberships() {
    const user = this.chat.currentUser
    this.membershipResponse = await user!.getMemberships()

    await this.membershipResponse.memberships[0].update({ custom: { some: "property1" } })

    this.channels.forEach((c) => {
      this.buttonTexts[c.id] = this.membershipResponse?.memberships.find(
        (m) => m.channel.id === c.id
      )
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
    const isAlreadyMember = !!this.membershipResponse!.memberships.find(
      (m) => m.channel.id === channelId
    )

    if (isAlreadyMember) {
      await channel!.leave()
    } else {
      await this.stateService.toggleChannel(channel!)
    }

    // dummy waiting
    setTimeout(() => {
      this.loadMemberships()
    }, 1000)
  }
}
