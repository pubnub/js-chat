import { FlatList, View, StyleSheet } from "react-native"
import React, { useCallback, useContext } from "react"
import { Channel, Message, MessageDraft, User } from "@pubnub/chat"
import { Text } from "../ui-components"
import { Bubble } from "react-native-gifted-chat"
import { EnhancedIMessage } from "../utils"
import { Quote, DataSuggestionBox } from "../components"
import { MessageText } from "../components/message-text"
import { ChatContext } from "../context"

type UseCommonChatRenderersProps = {
  typingData: string[]
  messageDraft: MessageDraft | null
  lastAffectedNameOccurrenceIndex: number
  setText: (text: string) => void
  setShowSuggestedData: (value: boolean) => void
  showSuggestedData: boolean
  giftedChatRef: React.RefObject<FlatList<EnhancedIMessage>>
  giftedChatMappedMessages: EnhancedIMessage[]
  suggestedData: User[] | Channel[]
}

export function useCommonChatRenderers({
  typingData,
  messageDraft,
  lastAffectedNameOccurrenceIndex,
  setText,
  setShowSuggestedData,
  giftedChatRef,
  giftedChatMappedMessages,
  suggestedData,
  showSuggestedData,
}: UseCommonChatRenderersProps) {
  const { getUser } = useContext(ChatContext)

  const handleSuggestionSelect = useCallback(
    (suggestion: User | Channel) => {
      if (!messageDraft) {
        return
      }
      if (suggestion instanceof User) {
        messageDraft.addMentionedUser(suggestion, lastAffectedNameOccurrenceIndex)
      } else {
        messageDraft.addReferencedChannel(suggestion, lastAffectedNameOccurrenceIndex)
      }

      setText(messageDraft.value)
      setShowSuggestedData(false)
    },
    [messageDraft, lastAffectedNameOccurrenceIndex, setText, setShowSuggestedData]
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
    [giftedChatMappedMessages, giftedChatRef]
  )

  const renderChatFooter = useCallback(() => {
    if (!messageDraft) {
      return null
    }

    const quotedMessage = messageDraft.quotedMessage
    let quotedMessageComponent = null
    let dataSuggestionComponent = null

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
    if (showSuggestedData) {
      dataSuggestionComponent = (
        <DataSuggestionBox data={suggestedData} onSelect={handleSuggestionSelect} />
      )
    }

    return (
      <>
        {quotedMessageComponent}
        {dataSuggestionComponent}
      </>
    )
  }, [messageDraft, showSuggestedData, scrollToMessage, suggestedData, handleSuggestionSelect])

  const renderFooter = useCallback(() => {
    if (!typingData.length) {
      return null
    }

    if (typingData.length === 1) {
      return (
        <View>
          <Text variant="body">{getUser(typingData[0])?.name || typingData[0]} is typing...</Text>
        </View>
      )
    }

    return (
      <View>
        <Text variant="body">
          {typingData.map((typingPoint) => getUser(typingPoint)?.name || typingPoint).join(", ")}{" "}
          are typing...
        </Text>
      </View>
    )
  }, [getUser, typingData])

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
