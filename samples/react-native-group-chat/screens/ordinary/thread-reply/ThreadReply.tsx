import React, {useCallback, useContext, useEffect, useState} from "react"
import { NativeStackScreenProps } from "@react-navigation/native-stack"
import { HomeStackParamList } from "../../../types"
import { ChatContext } from "../../../context"
import {EnhancedIMessage, mapPNMessageToGChatMessage} from "../../../utils"
import {MessageDraft, MixedTextTypedElement, ThreadChannel, User} from "@pubnub/chat"
import {Bubble, GiftedChat} from "react-native-gifted-chat";
import {Linking, StyleSheet, Text, View} from "react-native";

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
  const [suggestedUsers, setSuggestedUsers] = useState<User[]>([])
  const [lastAffectedNameOccurrenceIndex, setLastAffectedNameOccurrenceIndex] = useState(-1)

  useEffect(() => {
    async function init() {
      if (!chat) {
        return
      }

      const threadChannel =
        (await parentMessage.originalPnMessage.getThread()) ||
        (await parentMessage.originalPnMessage.createThread())

      setCurrentThreadChannel(threadChannel)
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
        GiftedChat.append(currentMessages, [
          mapPNMessageToGChatMessage(message, undefined),
        ])
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
            style={[styles.text, userId === chat?.currentUser.id ? styles.messageText : styles.outgoingText]}
            key={index}
          >
            {messagePart.content.text}
          </Text>
        )
      }
      if (messagePart.type === "plainLink") {
        return (
          <Text key={index} style={styles.link} onPress={() => openLink(messagePart.content.link)}>
            {messagePart.content.link}
          </Text>
        )
      }
      if (messagePart.type === "textLink") {
        return (
          <Text key={index} style={styles.link} onPress={() => openLink(messagePart.content.link)}>
            {messagePart.content.text}
          </Text>
        )
      }
      if (messagePart.type === "mention") {
        return (
          <Text
            key={index}
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
          <Text style={styles.linkedMessage}>
            {props.currentMessage.originalPnMessage
              .getLinkedText()
              .map((msgPart, index) =>
                renderMessagePart(msgPart, index, props.currentMessage?.user._id || "")
              )}
          </Text>
        )
      }

      return <Text style={styles.text}>{props.currentMessage?.text}</Text>
    },
    [renderMessagePart]
  )

  const renderFooter = useCallback(() => {
    if (!typingData.length) {
      return null
    }

    if (typingData.length === 1) {
      return (
        <View>
          <Text>{typingData[0]} is typing...</Text>
        </View>
      )
    }

    return (
      <View>
        <Text>
          {typingData.map((typingPoint) => typingPoint).join(", ")}{" "}
          are typing...
        </Text>
      </View>
    )
  }, [typingData])

  const renderMessageBubble = useCallback((props: Bubble<EnhancedIMessage>["props"]) => {
    return (
      <Bubble {...props} renderMessageText={renderMessageText} renderTime={() => null} />
    )
  }, [])

  if (!messageDraft || !chat) {
    return <Text>Loading...</Text>
  }

  return (
    <View style={styles.content}>
      {renderMessageBubble({ currentMessage: parentMessage })}
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
        user={{
          _id: chat.currentUser.id,
        }}
      />
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
})
