import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { MessageInputComponentSDK } from "../sdk/message-input/message-input.component";
import { MessageListComponentSDK } from "../sdk/message-list/message-list.component";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { TypingIndicatorComponentSDK } from "../sdk/typing-indicator/typing-indicator.component";
import { TypingIndicatorComponentChat } from "../chat/typing-indicator/typing-indicator.component";
import { MessageListComponentChat } from "../chat/message-list/message-list.component";
import { MessageInputComponentChat } from "../chat/message-input/message-input.component";

@NgModule({
  declarations: [
    AppComponent,
    MessageInputComponentSDK,
    MessageListComponentSDK,
    TypingIndicatorComponentSDK,
    TypingIndicatorComponentChat,
    MessageListComponentChat,
    MessageInputComponentChat,
  ],
  imports: [
    BrowserModule,
    ReactiveFormsModule,
    FormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
