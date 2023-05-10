import { Component, Input } from "@angular/core"
import { Channel } from "@pubnub/chat"
import { StateService } from "../../app/state.service"

@Component({
  selector: "app-message-input-chat",
  templateUrl: "./message-input.component.html",
  styleUrls: ["./message-input.component.scss"],
})
export class MessageInputComponentChat {
  pubnubInput = ""
  @Input() typingSent!: boolean

  constructor(private stateService: StateService) {}

  handleInput() {
    this.pubnubInput
      ? this.stateService.currentChannel!.startTyping()
      : this.stateService.currentChannel!.stopTyping()
  }

  async handleSend() {
    const response = await this.stateService.currentChannel!.sendText(this.pubnubInput, {
      meta: { foo: "bar" },
    })
    this.pubnubInput = ""
  }
}
