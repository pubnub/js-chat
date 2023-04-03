import { Component, Input } from "@angular/core"
import { Channel, Chat } from "@pubnub/chat"

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

  async loadChannels() {
    this.channels = await this.chat.getChannels()
  }

  async ngOnInit() {
    this.loadChannels()
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
}
