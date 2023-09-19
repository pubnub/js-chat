import { FlatList, Linking, View, StyleSheet } from "react-native"
import React, { useCallback } from "react"
import { Chat, Message, MessageDraft, MixedTextTypedElement, User } from "@pubnub/chat"
import { Text } from "../ui-components"
import { Bubble } from "react-native-gifted-chat"
import { EnhancedIMessage } from "../utils"
import { Quote, UserSuggestionBox } from "../components"

type UseCommonChatRenderersProps = {
  chat: Chat | null
  typingData: string[]
  users: Map<string, User>
  messageDraft: MessageDraft
  lastAffectedNameOccurrenceIndex: number
  setText: (text: string) => void
  setShowSuggestedUsers: (value: boolean) => void
  showSuggestedUsers: boolean
  giftedChatRef: React.RefObject<FlatList<EnhancedIMessage>>
  giftedChatMappedMessages: EnhancedIMessage[]
  suggestedUsers: User[]
}

export function useCommonChatRenderers({
  chat,
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
  const openLink = (link: string) => {
    Linking.openURL(link)
  }

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
  }, [messageDraft, showSuggestedUsers, scrollToMessage, handleUserToMention, suggestedUsers])

  const renderMessagePart = useCallback(
    (messagePart: MixedTextTypedElement, index: number, userId: string | number) => {
      // TODO make it look nice
      if (messagePart.type === "text") {
        return (
          <Text variant="body" color={chat?.currentUser.id ? undefined : "neutral900"} key={index}>
            {messagePart.content.text}
          </Text>
        )
      }
      if (messagePart.type === "plainLink") {
        return (
          <Text key={index} variant="body" onPress={() => openLink(messagePart.content.link)}>
            {messagePart.content.link}
          </Text>
        )
      }
      if (messagePart.type === "textLink") {
        return (
          <Text key={index} variant="body" onPress={() => openLink(messagePart.content.link)}>
            {messagePart.content.text}
          </Text>
        )
      }
      if (messagePart.type === "mention") {
        return (
          <Text
            key={index}
            variant="body"
            onPress={() => openLink(`https://pubnub.com/${messagePart.content.id}`)}
          >
            @{messagePart.content.name}
          </Text>
        )
      }
      if (messagePart.type === "channelReference") {
        return (
          <Text
            key={index}
            variant="body"
            onPress={() => openLink(`https://pubnub.com/${messagePart.content.id}`)}
          >
            #{messagePart.content.name}
          </Text>
        )
      }

      return null
    },
    [chat?.currentUser]
  )

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

  const renderMessageText = (props: Bubble<EnhancedIMessage>["props"]) => {
    if (props.currentMessage?.originalPnMessage.getLinkedText()) {
      return (
        <View>
          {props.currentMessage?.originalPnMessage.quotedMessage ? (
            <Quote
              message={props.currentMessage?.originalPnMessage.quotedMessage}
              onGoToMessage={() => {
                scrollToMessage(props.currentMessage?.originalPnMessage.quotedMessage)
              }}
              charactersLimit={50}
            />
          ) : null}
          <Text variant="body">
            {props.currentMessage.originalPnMessage
              .getLinkedText()
              .map((msgPart, index) =>
                renderMessagePart(msgPart, index, props.currentMessage?.user._id || "")
              )}
          </Text>
        </View>
      )
    }

    return <Text variant="body">{props.currentMessage?.text}</Text>
  }

  return {
    renderMessagePart,
    renderFooter,
    renderMessageText,
    renderChatFooter,
  }
}

const styles = StyleSheet.create({
  footerContainer: {
    marginLeft: 16,
    paddingTop: 12,
  },
})
