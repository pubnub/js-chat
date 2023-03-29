import { Component, Input } from '@angular/core';
import PubNub, { ChannelMetadataObject, ObjectCustom } from "pubnub";

@Component({
  selector: 'app-channel-list-sdk',
  templateUrl: './channel-list.component.html',
  styleUrls: ['./channel-list.component.scss']
})
export class ChannelListComponentSDK {
  @Input() pubnub!: PubNub;
  channels: ChannelMetadataObject<ObjectCustom>[] = []

  async ngOnInit() {
    const channelsResponse = await this.pubnub.objects.getAllChannelMetadata();
    this.channels = channelsResponse.data.slice(0, 1);
  }
}
