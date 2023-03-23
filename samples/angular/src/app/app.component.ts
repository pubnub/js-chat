import { Component } from '@angular/core';
import PubNub from "pubnub";
import { Chat } from "@pubnub/chat";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'angular';
  pubnubInput = "";
  messages = [] as any[];
  typingReceived = false;
  typingSent = false;

  pubnub = new PubNub({
    subscribeKey: "demo",
    publishKey: "demo",
    userId: "test-user",
  })

  chat = Chat.init({
    publishKey: "demo",
    subscribeKey: "demo",
    userId: "test-user",
  })

  channel = this.chat.getChannel("test-channel")

  ngOnInit() {
    this.pubnub.subscribe({
      channels: [this.channel.id],
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
}
