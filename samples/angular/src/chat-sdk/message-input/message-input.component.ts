import { Component, Input } from "@angular/core"
import { Channel } from "@pubnub/chat"

@Component({
  selector: "app-message-input-chat",
  templateUrl: "./message-input.component.html",
  styleUrls: ["./message-input.component.scss"],
})
export class MessageInputComponentChat {
  pubnubInput = ""
  @Input() channel!: Channel
  @Input() typingSent!: boolean

  handleInput() {
    this.pubnubInput ? this.channel.startTyping() : this.channel.stopTyping()
  }

  async handleSend() {
    const response = await this.channel.sendText(this.pubnubInput, { meta: { foo: "bar" } })
    console.log("response3", response)
    this.pubnubInput = ""
  }
}
