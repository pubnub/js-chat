import { Component, Input } from '@angular/core';
import PubNub from "pubnub";

@Component({
  selector: 'app-message-input-sdk',
  templateUrl: './message-input.component.html',
  styleUrls: ['./message-input.component.scss']
})
export class MessageInputComponentSDK {
  pubnubInput = "";
  @Input() channel!: string;
  @Input() pubnub!: PubNub;
  @Input() typingSent!: boolean;


  async sendTyping(value: boolean) {
    await this.pubnub.signal({ channel: this.channel, message: { type: "typing", value } })
    this.typingSent = value
  }

  handleInput() {
    if (this.pubnubInput && !this.typingSent) {
      setTimeout(() => {
        console.log("stopped typing")
      }, 3000)
      this.sendTyping(true)
    }
    if (!this.pubnubInput && this.typingSent) this.sendTyping(false)
  }

  async handleSend() {
    await this.pubnub.publish({ channel: this.channel, message: { text: this.pubnubInput, type: "text" } })
    await this.sendTyping(false)
    this.pubnubInput = "";
  }
}
