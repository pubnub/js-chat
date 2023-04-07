import { Component, Input } from "@angular/core"
import PubNub from "pubnub"
import { StateService } from "../../app/state.service"

@Component({
  selector: "app-create-channel-modal-sdk",
  templateUrl: "./create-channel-modal.component.html",
  styleUrls: ["./create-channel-modal.component.scss"],
})
export class CreateChannelModalComponentSDK {
  channelNameInput = ""
  @Input() pubnub!: PubNub

  get createChannelModalOpen(): boolean {
    return this.stateService.createChannelModalJSSDKOpen
  }

  constructor(private stateService: StateService) {}

  toggleCreateChannelModal() {
    this.stateService.toggleCreateChannelModalJSSDK()
  }

  async submitCreateChannelForm() {
    if (!this.channelNameInput) {
      return
    }
    await this.pubnub.objects.setChannelMetadata({
      channel: this.channelNameInput.replaceAll(" ", "."),
      data: {
        name: this.channelNameInput,
      },
    })

    this.stateService.toggleCreateChannelModalJSSDK()
  }
}
