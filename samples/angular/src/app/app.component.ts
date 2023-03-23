import { Component } from '@angular/core';
import PubNub from "pubnub";
import { Chat } from "@pubnub/chat";

const userId = "test-user"

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
    userId,
  })

  chat = Chat.init({
    publishKey: "demo",
    subscribeKey: "demo",
    userId,
    typingTimeout: 2000,
  })

  channel = this.chat.getChannel("test-channel")

  ngOnInit() {
    const user = this.chat.getUser(userId)
    this.chat.setChatUser(user)

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
