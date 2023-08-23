import * as React from "react";
import { Chat } from "@pubnub/js-chat"

type ChatContextParams = {
  chat: null | Chat
  setChat: (chat: Chat) => void
}

export const ChatContext = React.createContext({
  chat: null,
  setChat: () => null,
} as ChatContextParams)
