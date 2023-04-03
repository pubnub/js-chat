import { Component, Input } from "@angular/core"
import PubNub, { ChannelMetadataObject, ObjectCustom } from "pubnub"

@Component({
  selector: "app-channel-list-sdk",
  templateUrl: "./channel-list.component.html",
  styleUrls: ["./channel-list.component.scss"],
})
export class ChannelListComponentSDK {
  @Input() pubnub!: PubNub
  channels: ChannelMetadataObject<ObjectCustom>[] = []
  channelClickedNumber = -1
  nameInput = ""

  async loadChannels() {
    const channelsResponse = await this.pubnub.objects.getAllChannelMetadata()
    this.channels = channelsResponse.data.slice(0, 5)
  }

  async ngOnInit() {
    this.loadChannels()
  }

  clickOnChannel(index: number) {
    this.channelClickedNumber = index
  }

  async editChannel() {
    await this.pubnub.objects.setChannelMetadata({
      channel: this.channels[this.channelClickedNumber].id,
      data: {
        name: this.nameInput,
      },
    })
    this.channelClickedNumber = -1
    this.nameInput = ""
    this.loadChannels()
  }

  async deleteChannel(channelId: string) {
    await this.pubnub.objects.removeChannelMetadata({
      channel: channelId,
    })
    await this.loadChannels()
  }
}
