import { Component, Input } from '@angular/core';
import PubNub from "pubnub";

@Component({
  selector: 'app-typing-indicator-sdk',
  templateUrl: './typing-indicator.component.html',
  styleUrls: ['./typing-indicator.component.scss']
})
export class TypingIndicatorComponentSDK {
  @Input() pubnub!: PubNub;
  @Input() typingReceived!: boolean;
}
