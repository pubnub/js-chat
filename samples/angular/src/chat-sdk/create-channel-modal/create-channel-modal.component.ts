import { Component, Input } from '@angular/core';
import { Chat } from "@pubnub/chat";
import {StateService} from "../../app/state.service";

@Component({
  selector: 'app-create-channel-modal-chat',
  templateUrl: './create-channel-modal.component.html',
  styleUrls: ['./create-channel-modal.component.scss']
})
export class CreateChannelModalComponentChat {
  channelNameInput = "";
  @Input() chat!: Chat;
  get createChannelModalOpen(): boolean {
    return this.stateService.createChannelModalChatSDKOpen;
  }

  constructor(private stateService: StateService) {

  }

  toggleCreateChannelModal() {
    this.stateService.toggleCreateChannelModalChatSDK();
  }

  async submitCreateChannelForm() {
    if (!this.channelNameInput) {
      return;
    }

    await this.chat.createChannel(this.channelNameInput.replaceAll(" ", "."), { name: this.channelNameInput });
    this.toggleCreateChannelModal();
  }
}
