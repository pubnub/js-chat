import React, { useCallback, useContext, useEffect, useRef, useState } from "react"
import { StackScreenProps } from "@react-navigation/stack"
import { HomeStackParamList } from "../../../types"
import { ChatContext } from "../../../context"
import { EnhancedIMessage, mapPNMessageToGChatMessage } from "../../../utils"
import { Channel, Message, MessageDraft, ThreadChannel, ThreadMessage, User } from "@pubnub/chat"
import { Bubble, GiftedChat } from "react-native-gifted-chat"
import { FlatList, StyleSheet, TouchableOpacity, View } from "react-native"
import { Gap, Line, Text, defaultTheme } from "../../../ui-components"
import { useNavigation } from "@react-navigation/native"
import { useCommonChatRenderers } from "../../../hooks"
import { Avatar, useActionsMenu } from "../../../components"
import { MaterialCommunityIcons } from "@expo/vector-icons"

const { colors, textStyles } = defaultTheme

export function ThreadReply({ route }: StackScreenProps<HomeStackParamList, "ThreadReply">) {
  const { parentMessage } = route.params
  const { chat, getUser } = useContext(ChatContext)
  const navigation = useNavigation()
  const [currentThreadChannel, setCurrentThreadChannel] = useState<ThreadChannel | null>(null)
  const [messageDraft, setMessageDraft] = useState<MessageDraft | null>(null)
  const [isMoreMessages, setIsMoreMessages] = useState(true)
  const [isLoadingMoreMessages, setIsLoadingMoreMessages] = useState(false)
  const [giftedChatMappedMessages, setGiftedChatMappedMessages] = useState<EnhancedIMessage[]>([])
  const [text, setText] = useState("")
  const giftedChatRef = useRef<FlatList<EnhancedIMessage>>(null)
  const [typingData, setTypingData] = useState<string[]>([])
  const [isParentMessageCollapsed, setIsParentMessageCollapsed] = useState(false)
  const [suggestedData, setSuggestedData] = useState<User[] | Channel[]>([])
  const [showSuggestedData, setShowSuggestedData] = useState(false)
  const [lastAffectedNameOccurrenceIndex, setLastAffectedNameOccurrenceIndex] = useState(-1)

  const { renderFooter, renderMessageText, renderChatFooter } = useCommonChatRenderers({
    typingData,
    setText,
    messageDraft,
    suggestedData,
    showSuggestedData,
    setShowSuggestedData,
    giftedChatMappedMessages,
    giftedChatRef,
    lastAffectedNameOccurrenceIndex,
  })

  const handleQuote = useCallback(
    (message: Message) => {
      if (!messageDraft) {
        return
      }

      messageDraft.addQuote(message)
      setMessageDraft(messageDraft)
    },
    [messageDraft]
  )

  const handlePin = useCallback(
    async (message: ThreadMessage | Message) => {
      if (!chat) {
        return
      }
      if (message instanceof ThreadMessage) {
        await message.pinToParentChannel()
      }
    },
    [chat]
  )

  const { ActionsMenuComponent, handlePresentModalPress } = useActionsMenu({
    onQuote: handleQuote,
    removeThreadReply: true,
    onPinMessage: handlePin,
  })

  useEffect(() => {
    async function init() {
      if (!chat) {
        return
      }

      navigation.setOptions({ title: "Reply in thread" })

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
        setSuggestedData(
          suggestionObject.users.suggestedUsers.length
            ? suggestionObject.users.suggestedUsers
            : suggestionObject.channels.suggestedChannels
        )
        setLastAffectedNameOccurrenceIndex(
          suggestionObject.users.suggestedUsers.length
            ? suggestionObject.users.nameOccurrenceIndex
            : suggestionObject.channels.channelOccurrenceIndex
        )
      })

      setText(messageDraft.value)
      setShowSuggestedData(true)
    },
    [messageDraft]
  )

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

  const renderMessageBubble = useCallback((props: Bubble<EnhancedIMessage>["props"]) => {
    return (
      <Bubble
        {...props}
        user={{
          _id: props.currentMessage?.originalPnMessage.userId as string,
        }}
        renderMessageText={renderMessageText}
        renderTime={() => null}
        containerToNextStyle={{ right: { marginRight: 0 } }}
        containerStyle={{ right: { marginRight: 0 } }}
        wrapperStyle={{
          right: [styles.ownBubbleBackground, { backgroundColor: colors.teal100 }],
          left: [styles.otherBubbleBackground],
        }}
        textStyle={{ right: [styles.ownBubbleText, textStyles.body] }}
      />
    )
  }, [])

  const renderParentMessageBubble = useCallback(() => {
    if (!chat) return null
    const sender = getUser(parentMessage.originalPnMessage.userId)

    return (
      <View style={{ flexGrow: 1, paddingHorizontal: 16 }}>
        <Gap value={24} />
        <Text variant="body">Thread</Text>
        <Gap value={16} />
        <Line />
        <Gap value={24} />
        <View style={{ flexDirection: "row" }}>
          {sender && <Avatar source={sender} size="md" />}
          <View style={{ marginRight: 8 }} />
          {renderMessageBubble({ currentMessage: parentMessage })}
        </View>
        <TouchableOpacity
          style={styles.collapseButtonContainer}
          onPress={() => setIsParentMessageCollapsed(!isParentMessageCollapsed)}
        >
          <MaterialCommunityIcons name="chevron-down" size={24} />
          <Text variant="body">{isParentMessageCollapsed ? "Expand" : "Collapse"}</Text>
        </TouchableOpacity>
        <Gap value={32} />
        <Line />
        <Gap value={12} />
        <Text variant="body" color="neutral900">
          Thread reply
        </Text>
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
          renderAvatar={(props) => {
            const user = getUser(props.currentMessage?.originalPnMessage.userId)
            return user && <Avatar source={user} size="md" />
          }}
          user={{
            _id: chat.currentUser.id,
          }}
          messageContainerRef={giftedChatRef}
          onLongPress={(_, giftedMessage: EnhancedIMessage) => {
            handlePresentModalPress({ message: giftedMessage })
          }}
          renderChatFooter={renderChatFooter}
        />
        <ActionsMenuComponent />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.neutral100 },
  content: { backgroundColor: colors.neutral0, flex: 1 },
  bubbleContainer: {},
  ownBubbleBackground: { marginRight: 8, padding: 12 },
  otherBubbleBackground: { padding: 12 },
  ownBubbleText: {},
  collapseButtonContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
})
