import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-message-list-sdk',
  templateUrl: './message-list.component.html',
  styleUrls: ['./message-list.component.scss']
})
export class MessageListComponentSDK {
  @Input() messages!: any[];
}
