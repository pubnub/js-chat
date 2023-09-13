import React, { useCallback, useContext, useEffect, useState } from "react"
import { StackScreenProps } from "@react-navigation/stack"
import { HomeStackParamList } from "../../../types"
import { ChatContext } from "../../../context"
import { EnhancedIMessage, mapPNMessageToGChatMessage } from "../../../utils"
import { MessageDraft, ThreadChannel, User } from "@pubnub/chat"
import { Bubble, GiftedChat } from "react-native-gifted-chat"
import { StyleSheet, TouchableOpacity, View } from "react-native"
import {
  Gap,
  Line,
  RandomAvatar,
  usePNTheme,
  Text,
  Icon,
  colorPalette,
} from "../../../ui-components"
import { useNavigation } from "@react-navigation/native"
import { useCommonChatRenderers } from "../../../hooks"

export function ThreadReply({ route }: StackScreenProps<HomeStackParamList, "ThreadReply">) {
  const { parentMessage } = route.params
  const { chat } = useContext(ChatContext)
  const navigation = useNavigation()
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

  const { renderFooter, renderMessageText } = useCommonChatRenderers({
    chat,
    typingData,
    users: new Map(),
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
        setSuggestedUsers(suggestionObject.users.suggestedUsers)
        setLastAffectedNameOccurrenceIndex(suggestionObject.users.nameOccurrenceIndex)
      })

      setText(messageDraft.value)
    },
    [messageDraft, currentThreadChannel]
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
          right: [styles.ownBubbleBackground, { backgroundColor: theme.colors.teal100 }],
          left: [styles.otherBubbleBackground],
        }}
        textStyle={{ right: [styles.ownBubbleText, theme.textStyles.body] }}
      />
    )
  }, [])

  const renderParentMessageBubble = useCallback(() => {
    if (!chat) {
      return null
    }

    return (
      <View style={{ flexGrow: 1, paddingHorizontal: 16 }}>
        <Gap value={24} />
        <Text variant="body">Thread</Text>
        <Gap value={16} />
        <Line />
        <Gap value={24} />
        <View style={{ flexDirection: "row" }}>
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
  container: { flex: 1, backgroundColor: colorPalette.neutral100 },
  content: { backgroundColor: colorPalette.neutral0, flex: 1 },
  bubbleContainer: {},
  ownBubbleBackground: { marginRight: 8, padding: 12 },
  otherBubbleBackground: { padding: 12 },
  ownBubbleText: {},
  collapseButtonContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
})
