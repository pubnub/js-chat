import { Component, Input, SimpleChanges } from "@angular/core"
import { Channel } from "@pubnub/chat"

@Component({
  selector: "app-typing-indicator-chat",
  templateUrl: "./typing-indicator.component.html",
  styleUrls: ["./typing-indicator.component.scss"],
})
export class TypingIndicatorComponentChat {
  @Input() channel!: Channel
  typingData: string[] = []

  ngOnChanges(changes: SimpleChanges) {
    if (changes["channel"].previousValue) {
      changes["channel"].previousValue.disconnect()
    }
    if (changes["channel"].currentValue) {
      this.channel.getTyping((value) => (this.typingData = value))
    }
  }
}
