import { Component, Input } from '@angular/core';
import { Chat } from "@pubnub/chat";

@Component({
  selector: 'app-create-channel-modal-chat',
  templateUrl: './create-channel-modal.component.html',
  styleUrls: ['./create-channel-modal.component.scss']
})
export class CreateChannelModalComponentChat {
  channelNameInput = "";
  @Input() chat!: Chat;
  @Input() createChannelModalOpen!: boolean;
  @Input() toggleCreateChannelModal!: Function;

  async submitCreateChannelForm() {
    if (!this.channelNameInput) {
      return;
    }

    await this.chat.createChannel({ id: this.channelNameInput.replaceAll(" ", "."), name: this.channelNameInput });
    this.toggleCreateChannelModal();
  }
}
