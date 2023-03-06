import { Component } from '@angular/core';
import PubNub from "pubnub";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'angular';
  pubnubInput = "";
  channel = "test-channel";
  messages = [] as any[];
  typingReceived = false;
  typingSent = false;

  pubnub = new PubNub({
    subscribeKey: "demo",
    publishKey: "demo",
    userId: "test-user",
  })

  ngOnInit() {
    this.pubnub.subscribe({
      channels: [this.channel],
    });

    this.pubnub.addListener({
      message: (event) => {
        const { message } = event
        if (message.type === "text") this.messages.push(message)
      },
      signal: (event) => {
        const { message } = event
        if (message.type === "typing") this.typingReceived = message.value
      },
    })
  }

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
