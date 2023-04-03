import { Component, Input } from "@angular/core"
import { Channel, TypingData } from "@pubnub/chat"
import PubNub from "pubnub"

@Component({
  selector: "app-typing-indicator-chat",
  templateUrl: "./typing-indicator.component.html",
  styleUrls: ["./typing-indicator.component.scss"],
})
export class TypingIndicatorComponentChat {
  @Input() channel!: Channel
  @Input() pubnub!: PubNub
  typingData: TypingData[] = []

  ngOnInit() {
    this.channel.getTyping((value) => (this.typingData = value))
  }
}
