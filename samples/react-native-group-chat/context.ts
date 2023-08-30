import * as React from "react";
import { Chat } from "@pubnub/chat"
import { Membership } from "@pubnub/chat"

type ChatContextParams = {
  chat: null | Chat
  setChat: (chat: Chat) => void
  memberships: Membership[]
  setMemberships: (memberships: Membership[]) => void
}

export const ChatContext = React.createContext({
  chat: null as Chat | null,
  setChat: () => null,
  memberships: [],
  setMemberships: () => null,
} as ChatContextParams)
