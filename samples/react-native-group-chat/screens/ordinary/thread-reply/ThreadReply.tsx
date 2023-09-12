import React, { useCallback, useContext, useEffect, useState } from "react"
import { NativeStackScreenProps } from "@react-navigation/native-stack"
import { HomeStackParamList } from "../../../types"
import { ChatContext } from "../../../context"
import { EnhancedIMessage, mapPNMessageToGChatMessage } from "../../../utils"
import { MessageDraft, MixedTextTypedElement, ThreadChannel, User } from "@pubnub/chat"
import { Bubble, GiftedChat } from "react-native-gifted-chat"
import { Linking, StyleSheet, TouchableOpacity, View } from "react-native"
import { Gap, Line, RandomAvatar, usePNTheme, Text, Icon } from "../../../ui-components"

export function ThreadReply({ route }: NativeStackScreenProps<HomeStackParamList, "ThreadReply">) {
  const { parentMessage } = route.params
  const { chat } = useContext(ChatContext)
  const [currentThreadChannel, setCurrentThreadChannel] = useState<ThreadChannel | null>(null)
  const [messageDraft, setMessageDraft] = useState<MessageDraft | null>(null)
  const [isMoreMessages, setIsMoreMessages] = useState(true)
  const [isLoadingMoreMessages, setIsLoadingMoreMessages] = useState(false)
  const [giftedChatMappedMessages, setGiftedChatMappedMessages] = useState<EnhancedIMessage[]>([])
  const [text, setText] = useState("")
  const [typingData, setTypingData] = useState<string[]>([])
  const [isParentMessageCollapsed, setIsParentMessageCollapsed] = useState(false)
  const [suggestedUsers, setSuggestedUsers] = useState<User[]>([])
  const [lastAffectedNameOccurrenceIndex, setLastAffectedNameOccurrenceIndex] = useState(-1)
  const theme = usePNTheme()

  useEffect(() => {
    async function init() {
      if (!chat) {
        return
      }

      try {
        const threadChannel = await parentMessage.originalPnMessage.getThread()
        setCurrentThreadChannel(threadChannel)
      } catch (e) {
        const threadChannel = await parentMessage.originalPnMessage.createThread()
        setCurrentThreadChannel(threadChannel)
      }
    }

    init()
  }, [])

  useEffect(() => {
    async function init() {
      if (!currentThreadChannel || !chat) {
        return
      }
      setGiftedChatMappedMessages([])

      const [historicalMessagesObject, parentChannel] = await Promise.all([
        currentThreadChannel.getHistory({ count: 5 }),
        chat.getChannel(parentMessage.originalPnMessage.channelId),
      ])

      setMessageDraft(
        currentThreadChannel.createMessageDraft({
          userSuggestionSource: "global",
          isTypingIndicatorTriggered: parentChannel?.type !== "public",
        })
      )

      if (parentChannel?.type !== "public") {
        currentThreadChannel.getTyping((value) => {
          setTypingData(value)
        })
      }

      setGiftedChatMappedMessages((msgs) =>
        GiftedChat.prepend(
          [],
          historicalMessagesObject.messages
            .map((msg) => mapPNMessageToGChatMessage(msg, undefined))
            .reverse()
        )
      )
    }

    init()
  }, [currentThreadChannel])

  useEffect(() => {
    if (!currentThreadChannel) {
      return
    }

    const disconnect = currentThreadChannel.connect((message) => {
      setGiftedChatMappedMessages((currentMessages) =>
        GiftedChat.append(currentMessages, [mapPNMessageToGChatMessage(message, undefined)])
      )
    })

    return () => {
      disconnect()
    }
  }, [currentThreadChannel])

  const resetInput = () => {
    if (!messageDraft) {
      return
    }
    messageDraft.onChange("")
    messageDraft.removeQuote()
    setText("")
  }

  const onSend = (messages: EnhancedIMessage[] = []) => {
    if (!messageDraft) {
      return
    }

    messageDraft.send()
    resetInput()
  }

  const handleInputChange = useCallback(
    (text: string) => {
      if (!messageDraft || text === "") {
        return
      }

      messageDraft.onChange(text).then((suggestionObject) => {
        setSuggestedUsers(suggestionObject.users.suggestedUsers)
        setLastAffectedNameOccurrenceIndex(suggestionObject.users.nameOccurrenceIndex)
      })

      setText(messageDraft.value)
    },
    [messageDraft, currentThreadChannel]
  )

  const openLink = (link: string) => {
    Linking.openURL(link)
  }

  const loadEarlierMessages = async () => {
    if (!currentThreadChannel) {
      return
    }

    const lastMessageTimetoken = giftedChatMappedMessages.length
      ? giftedChatMappedMessages[giftedChatMappedMessages.length - 1].originalPnMessage.timetoken
      : undefined

    setIsLoadingMoreMessages(true)
    const historicalMessagesObject = await currentThreadChannel.getHistory({
      count: 5,
      startTimetoken: lastMessageTimetoken,
    })

    setIsLoadingMoreMessages(false)

    setGiftedChatMappedMessages(
      GiftedChat.prepend(
        giftedChatMappedMessages,
        historicalMessagesObject.messages
          .map((msg) => mapPNMessageToGChatMessage(msg, undefined))
          .reverse()
      )
    )

    setIsMoreMessages(historicalMessagesObject.isMore)
  }

  const renderMessagePart = useCallback(
    (messagePart: MixedTextTypedElement, index: number, userId: string | number) => {
      if (messagePart.type === "text") {
        return (
          <Text
            variant="body"
            style={[
              styles.text,
              userId === chat?.currentUser.id ? styles.messageText : styles.outgoingText,
            ]}
            key={index}
          >
            {messagePart.content.text}
          </Text>
        )
      }
      if (messagePart.type === "plainLink") {
        return (
          <Text
            variant="body"
            key={index}
            style={styles.link}
            onPress={() => openLink(messagePart.content.link)}
          >
            {messagePart.content.link}
          </Text>
        )
      }
      if (messagePart.type === "textLink") {
        return (
          <Text
            variant="body"
            key={index}
            style={styles.link}
            onPress={() => openLink(messagePart.content.link)}
          >
            {messagePart.content.text}
          </Text>
        )
      }
      if (messagePart.type === "mention") {
        return (
          <Text
            key={index}
            variant="body"
            style={styles.link}
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
            style={styles.link}
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

  const renderMessageText = useCallback(
    (props: Bubble<EnhancedIMessage>["props"]) => {
      if (props.currentMessage?.originalPnMessage.getLinkedText()) {
        return (
          <Text style={styles.linkedMessage} variant="body">
            {props.currentMessage.originalPnMessage
              .getLinkedText()
              .map((msgPart, index) =>
                renderMessagePart(msgPart, index, props.currentMessage?.user._id || "")
              )}
          </Text>
        )
      }

      return (
        <Text variant="body" style={styles.text}>
          {props.currentMessage?.text}
        </Text>
      )
    },
    [renderMessagePart, parentMessage]
  )

  const renderFooter = useCallback(() => {
    if (!typingData.length) {
      return null
    }

    if (typingData.length === 1) {
      return (
        <View>
          <Text variant="body">{typingData[0]} is typing...</Text>
        </View>
      )
    }

    return (
      <View>
        <Text variant="body">
          {typingData.map((typingPoint) => typingPoint).join(", ")} are typing...
        </Text>
      </View>
    )
  }, [typingData])

  const renderMessageBubble = useCallback((props: Bubble<EnhancedIMessage>["props"]) => {
    return (
      <Bubble
        {...props}
        renderMessageText={renderMessageText}
        renderTime={() => null}
        containerToNextStyle={{ right: { marginRight: 0 } }}
        containerStyle={{ right: { marginRight: 0 } }}
        wrapperStyle={{
          right: [styles.ownBubbleBackground, { backgroundColor: theme.colors.teal100 }],
          left: [styles.otherBubbleBackground],
        }}
        textStyle={{ right: [styles.ownBubbleText, theme.textStyles.body] }}
      />
    )
  }, [])

  const renderParentMessageBubble = useCallback(() => {
    return (
      <View style={{ flexGrow: 1, paddingHorizontal: 16 }}>
        <Gap value={24} />
        <Text variant="body">Thread</Text>
        <Gap value={16} />
        <Line />
        <Gap value={24} />
        <View
          style={{
            flexDirection:
              parentMessage.originalPnMessage.userId === chat.currentUser.id ? "column" : "row",
          }}
        >
          <RandomAvatar size={32} />
          <View style={{ marginRight: 8 }} />
          {renderMessageBubble({ currentMessage: parentMessage })}
        </View>
        <TouchableOpacity
          style={styles.collapseButtonContainer}
          onPress={() => setIsParentMessageCollapsed(!isParentMessageCollapsed)}
        >
          <Icon icon="chevron-down" />
          <Text variant="body">{isParentMessageCollapsed ? "Expand" : "Collapse"}</Text>
        </TouchableOpacity>
        <Gap value={32} />
        <Line />
      </View>
    )
  }, [chat, isParentMessageCollapsed])

  if (!messageDraft || !chat) {
    return <Text variant="body">Loading...</Text>
  }

  return (
    <View style={styles.content}>
      {renderParentMessageBubble()}
      <View style={{ flexGrow: 3 }}>
        <GiftedChat
          messages={giftedChatMappedMessages}
          onSend={(messages) => onSend(messages)}
          onInputTextChanged={handleInputChange}
          renderMessageText={renderMessageText}
          renderFooter={renderFooter}
          renderLoadEarlier={() => null}
          renderBubble={renderMessageBubble}
          text={text}
          loadEarlier={isMoreMessages}
          isLoadingEarlier={isLoadingMoreMessages}
          onLoadEarlier={loadEarlierMessages}
          renderDay={() => null}
          renderTime={() => null}
          renderAvatar={() => <RandomAvatar size={36} />}
          user={{
            _id: chat.currentUser.id,
          }}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  content: { backgroundColor: "#ffffff", flex: 1 },
  bubbleContainer: {},
  link: { color: "#1066a4" },
  linkedMessage: { padding: 8 },
  text: { color: "#FFFFFF", padding: 8 },
  messageText: { color: "#000000" },
  outgoingText: { color: "#000000" },
  ownBubbleBackground: { marginRight: 8, padding: 12 },
  otherBubbleBackground: { padding: 12 },
  ownBubbleText: {},
  collapseButtonContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
})
