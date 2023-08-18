import React from "react"
import { User } from "@pubnub/chat"
import { TypingIndicator as ChatScopeTypingIndicator } from "@chatscope/chat-ui-kit-react"

type TypingIndicatorProps = {
  typingData: string[]
  users: Map<string, User>
}

export function TypingIndicator({ typingData, users }: TypingIndicatorProps) {
  if (!typingData.length) {
    return null
  }

  if (typingData.length === 1) {
    return (
      <ChatScopeTypingIndicator
        content={`${users.get(typingData[0])?.name || typingData[0]} is typing...`}
      />
    )
  }

  return (
    <ChatScopeTypingIndicator
      content={`${typingData
        .map((typingPoint) => users.get(typingPoint)?.name || typingPoint)
        .join(", ")} are typing...`}
    />
  )
}
