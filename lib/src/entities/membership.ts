import { Chat } from "./chat"

export class Membership {
  private chat: Chat

  constructor(chat: Chat) {
    this.chat = chat
  }

  static fromDTO(chat: Chat) {
    return new Membership(chat)
  }
}
