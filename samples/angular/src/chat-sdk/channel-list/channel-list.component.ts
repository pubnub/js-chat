import { Component, Input } from '@angular/core';
import { ChannelEntity, Chat} from "@pubnub/chat";

@Component({
  selector: 'app-channel-list-chat',
  templateUrl: './channel-list.component.html',
  styleUrls: ['./channel-list.component.scss']
})
export class ChannelListComponentChat {
  @Input() chat!: Chat;
  channels: ChannelEntity[] = []

  async ngOnInit() {
    const channelsResponse = await this.chat.getChannels();
    this.channels = channelsResponse.data;
  }
}