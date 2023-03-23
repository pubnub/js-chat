import { Component, Input } from '@angular/core';
import { Channel } from "@pubnub/chat";

@Component({
  selector: 'app-message-list-chat',
  templateUrl: './message-list.component.html',
  styleUrls: ['./message-list.component.scss']
})
export class MessageListComponentChat {
  @Input() channel!: Channel;

  messages: any[];

  constructor() {
    this.messages = [];
  }

  ngOnInit() {
    this.channel.connect((message) => this.messages.push(message.content))
  }
}
