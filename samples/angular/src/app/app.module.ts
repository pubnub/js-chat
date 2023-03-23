import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { MessageInputComponentSDK } from "../js-sdk/message-input/message-input.component";
import { MessageListComponentSDK } from "../js-sdk/message-list/message-list.component";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { TypingIndicatorComponentSDK } from "../js-sdk/typing-indicator/typing-indicator.component";
import { TypingIndicatorComponentChat } from "../chat-sdk/typing-indicator/typing-indicator.component";
import { MessageListComponentChat } from "../chat-sdk/message-list/message-list.component";
import { MessageInputComponentChat } from "../chat-sdk/message-input/message-input.component";

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
