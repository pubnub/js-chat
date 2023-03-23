import { Chat } from "./chat"

type UserConstructor = {
  chat: Chat
  id: string
  name: string
}

export class User {
  private chat: Chat
  readonly id: string
  readonly name: string

  constructor(params: UserConstructor) {
    this.chat = params.chat
    this.id = params.id
    this.name = params.name
  }
}
