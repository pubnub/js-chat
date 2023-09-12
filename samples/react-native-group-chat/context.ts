import * as React from "react"
import { Chat, User, Membership } from "@pubnub/chat"

type ChatContextParams = {
  chat: null | Chat
  setChat: (chat: Chat | null) => void
  users: User[]
  setUsers: (users: User[]) => void
  memberships: Membership[]
  setMemberships: (memberships: Membership[]) => void
}

export const ChatContext = React.createContext({
  chat: null as Chat | null,
  setChat: () => null,
  users: [],
  setUsers: () => null,
  memberships: [],
  setMemberships: () => null,
} as ChatContextParams)
