import { Component, Input } from '@angular/core';
import { Channel } from "@pubnub/chat";

@Component({
  selector: 'app-message-input-chat',
  templateUrl: './message-input.component.html',
  styleUrls: ['./message-input.component.scss']
})
export class MessageInputComponentChat {
  pubnubInput = "";
  @Input() channel!: Channel;
  @Input() typingSent!: boolean;


  async sendTyping(value: boolean) {
    await this.channel.sendTyping(value)
    this.typingSent = value
  }

  handleInput() {
    if (this.pubnubInput && !this.typingSent) this.sendTyping(true)
    if (!this.pubnubInput && this.typingSent) this.sendTyping(false)
  }

  async handleSend() {
    await this.channel.sendText(this.pubnubInput)
    await this.sendTyping(false)
    this.pubnubInput = "";
  }
}
