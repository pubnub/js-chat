import { Injectable } from "@angular/core"
import { Subject } from "rxjs"

@Injectable({
  providedIn: "root",
})
export class StateService {
  createChannelModalJSSDKOpen = false
  createChannelModalChatSDKOpen = false

  JSSDKModalVisibilityChange: Subject<boolean> = new Subject<boolean>()
  chatSDKModalVisibilityChange: Subject<boolean> = new Subject<boolean>()

  constructor() {
    this.JSSDKModalVisibilityChange.subscribe((value) => {
      this.createChannelModalJSSDKOpen = value
    })
    this.chatSDKModalVisibilityChange.subscribe((value) => {
      this.createChannelModalChatSDKOpen = value
    })
  }

  toggleCreateChannelModalChatSDK() {
    this.chatSDKModalVisibilityChange.next(!this.createChannelModalChatSDKOpen)
  }

  toggleCreateChannelModalJSSDK() {
    this.JSSDKModalVisibilityChange.next(!this.createChannelModalJSSDKOpen)
  }

  getCreateChannelModalJSSDKOpen() {
    return this.createChannelModalJSSDKOpen
  }

  getCreateChannelModalChatSDKOpen() {
    return this.createChannelModalChatSDKOpen
  }
}
