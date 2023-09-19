import { FlatList, View, StyleSheet } from "react-native"
import React, { useCallback } from "react"
import { Message, MessageDraft, User } from "@pubnub/chat"
import { Text } from "../ui-components"
import { Bubble } from "react-native-gifted-chat"
import { EnhancedIMessage } from "../utils"
import { Quote, UserSuggestionBox } from "../components"
import { MessageText } from "../components/message-text"

type UseCommonChatRenderersProps = {
  typingData: string[]
  users: Map<string, User>
  messageDraft: MessageDraft | null
  lastAffectedNameOccurrenceIndex: number
  setText: (text: string) => void
  setShowSuggestedUsers: (value: boolean) => void
  showSuggestedUsers: boolean
  giftedChatRef: React.RefObject<FlatList<EnhancedIMessage>>
  giftedChatMappedMessages: EnhancedIMessage[]
  suggestedUsers: User[]
}

export function useCommonChatRenderers({
  typingData,
  users,
  messageDraft,
  lastAffectedNameOccurrenceIndex,
  setText,
  setShowSuggestedUsers,
  giftedChatRef,
  giftedChatMappedMessages,
  suggestedUsers,
  showSuggestedUsers,
}: UseCommonChatRenderersProps) {
  const handleUserToMention = useCallback(
    (user: User) => {
      if (!messageDraft) {
        return
      }

      messageDraft.addMentionedUser(user, lastAffectedNameOccurrenceIndex)
      setText(messageDraft.value)
      setShowSuggestedUsers(false)
    },
    [messageDraft, lastAffectedNameOccurrenceIndex]
  )

  const scrollToMessage = useCallback(
    (message: Message) => {
      if (!giftedChatRef.current) {
        return
      }

      const messageIndex = giftedChatMappedMessages.findIndex(
        (m) => m.originalPnMessage.timetoken === message.timetoken
      )

      if (messageIndex === -1) {
        console.warn("This message is not loaded")
        return
      }

      giftedChatRef.current.scrollToIndex({ animated: true, index: messageIndex })
    },
    [giftedChatMappedMessages]
  )

  const renderChatFooter = useCallback(() => {
    if (!messageDraft) {
      return null
    }

    const quotedMessage = messageDraft.quotedMessage
    let quotedMessageComponent = null
    let userSuggestionComponent = null

    if (quotedMessage) {
      quotedMessageComponent = (
        <View style={styles.footerContainer}>
          <Quote
            message={quotedMessage}
            charactersLimit={100}
            onGoToMessage={() => scrollToMessage(quotedMessage)}
          />
        </View>
      )
    }
    if (showSuggestedUsers) {
      userSuggestionComponent = (
        <UserSuggestionBox users={suggestedUsers} onUserSelect={handleUserToMention} />
      )
    }

    return (
      <>
        {quotedMessageComponent}
        {userSuggestionComponent}
      </>
    )
  }, [messageDraft, showSuggestedUsers, scrollToMessage, suggestedUsers])

  const renderFooter = useCallback(() => {
    if (!typingData.length) {
      return null
    }

    if (typingData.length === 1) {
      return (
        <View>
          <Text variant="body">{users.get(typingData[0])?.name || typingData[0]} is typing...</Text>
        </View>
      )
    }

    return (
      <View>
        <Text variant="body">
          {typingData.map((typingPoint) => users.get(typingPoint)?.name || typingPoint).join(", ")}{" "}
          are typing...
        </Text>
      </View>
    )
  }, [typingData, users])

  return {
    renderFooter,
    renderMessageText: (props: Bubble<EnhancedIMessage>["props"]) => (
      <MessageText messageProps={props} onGoToMessage={scrollToMessage} />
    ),
    renderChatFooter,
  }
}

const styles = StyleSheet.create({
  footerContainer: {
    marginLeft: 16,
    paddingTop: 12,
  },
})
