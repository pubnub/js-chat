import { Chat } from "./chat"

type UserConstructor = {
  chat: Chat
  id: string
  name?: string
  avatarUrl?: string
}

export type CreateUserParams = Pick<UserConstructor, "name" | "avatarUrl">

export class User {
  private chat: Chat
  readonly id: string
  readonly name: string
  readonly avatarUrl: string

  constructor(params: UserConstructor) {
    this.chat = params.chat
    this.id = params.id
    this.name = params.name || params.id
    this.avatarUrl =
      params.avatarUrl || `https://api.dicebear.com/5.x/shapes/svg?seed=${params.id}&radius=5`
  }
}
