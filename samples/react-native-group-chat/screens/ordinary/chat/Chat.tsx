import React, { useState, useCallback, useEffect, useContext, useRef, useMemo } from "react"
import {
  StyleSheet,
  View,
  ActivityIndicator,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
} from "react-native"
import { GiftedChat, Bubble } from "react-native-gifted-chat"
import { StackScreenProps } from "@react-navigation/stack"
import { User, MessageDraft, Message, Channel } from "@pubnub/chat"

import { EnhancedIMessage, mapPNMessageToGChatMessage } from "../../../utils"
import { ChatContext } from "../../../context"
import { HomeStackParamList } from "../../../types"
import { Avatar, useActionsMenu } from "../../../components"
import { colorPalette as colors, Text } from "../../../ui-components"
import { useNavigation } from "@react-navigation/native"
import { useCommonChatRenderers } from "../../../hooks"
import { MaterialCommunityIcons } from "@expo/vector-icons"

export function ChatScreen({}: StackScreenProps<HomeStackParamList, "Chat">) {
  const { chat, setCurrentChannel, currentChannel, getUser, currentChannelMembers } =
    useContext(ChatContext)
  const navigation = useNavigation()
  const [isMoreMessages, setIsMoreMessages] = useState(true)
  const [isLoadingMoreMessages, setIsLoadingMoreMessages] = useState(false)
  const [giftedChatMappedMessages, setGiftedChatMappedMessages] = useState<EnhancedIMessage[]>([])
  const [typingData, setTypingData] = useState<string[]>([])
  const [messageDraft, setMessageDraft] = useState<MessageDraft | null>(null)
  const [suggestedData, setSuggestedData] = useState<User[] | Channel[]>([])
  const [showSuggestedData, setShowSuggestedData] = useState(false)
  const giftedChatRef = useRef<FlatList<EnhancedIMessage>>(null)
  const [lastAffectedNameOccurrenceIndex, setLastAffectedNameOccurrenceIndex] = useState(-1)
  const [text, setText] = useState("")
  const currentChannelMembership = useMemo(
    () => currentChannelMembers.find((m) => m.user.id === chat?.currentUser.id),
    [chat?.currentUser.id, currentChannelMembers]
  )
  const { renderFooter, renderMessageText, renderChatFooter } = useCommonChatRenderers({
    typingData,
    messageDraft,
    lastAffectedNameOccurrenceIndex,
    setText,
    giftedChatRef,
    giftedChatMappedMessages,
    setShowSuggestedData,
    showSuggestedData,
    suggestedData,
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
    async (message: Message) => {
      if (!chat || !currentChannel) {
        return
      }

      await message.pin()
      await currentChannel.update({ name: "Grupa chatowa 23" + Math.random() })
      // const refreshedChannel = await chat.getChannel(currentChannel.id)
      // if (refreshedChannel) {
      //   setCurrentChannel(refreshedChannel)
      // }
    },
    [chat, currentChannel, setCurrentChannel]
  )

  const handleEmoji = useCallback(
    (message: Message) => {
      const copiedMessages = [...giftedChatMappedMessages]

      const index = copiedMessages.findIndex(
        (msg) => msg.originalPnMessage.timetoken === message.timetoken
      )

      if (index === -1) {
        return
      }

      copiedMessages[index].originalPnMessage = message

      setGiftedChatMappedMessages(copiedMessages)
    },
    [giftedChatMappedMessages]
  )

  const { ActionsMenuComponent, handlePresentModalPress } = useActionsMenu({
    onQuote: handleQuote,
    onPinMessage: handlePin,
    onToggleEmoji: handleEmoji,
  })

  useEffect(() => {
    if (!currentChannel) {
      return
    }
    console.log("hello", currentChannel)
    const unstream = currentChannel.streamUpdates((ch) => {
      console.log("ch", ch)
    })

    return unstream
  }, [currentChannel])

  useEffect(() => {
    if (!giftedChatMappedMessages.length) {
      return
    }

    const unstream = Message.streamUpdatesOn(
      giftedChatMappedMessages.map((giftedMessage) => giftedMessage.originalPnMessage),
      (newMessages) => {
        setGiftedChatMappedMessages(
          newMessages.map((newMessage) =>
            mapPNMessageToGChatMessage(newMessage, getUser(newMessage.userId))
          )
        )
      }
    )

    return unstream
  }, [getUser, giftedChatMappedMessages])

  const loadEarlierMessages = async () => {
    if (!currentChannel) {
      return
    }

    const lastMessageTimetoken = giftedChatMappedMessages.length
      ? giftedChatMappedMessages[giftedChatMappedMessages.length - 1].originalPnMessage.timetoken
      : undefined

    setIsLoadingMoreMessages(true)
    const historicalMessagesObject = await currentChannel.getHistory({
      count: 5,
      startTimetoken: lastMessageTimetoken,
    })

    setIsLoadingMoreMessages(false)

    setGiftedChatMappedMessages(
      GiftedChat.prepend(
        giftedChatMappedMessages,
        historicalMessagesObject.messages
          .map((msg) => mapPNMessageToGChatMessage(msg, getUser(msg.userId)))
          .reverse()
      )
    )

    setIsMoreMessages(historicalMessagesObject.isMore)
  }

  useEffect(() => {
    async function switchChannelImplementation() {
      if (!currentChannel) {
        return
      }
      setGiftedChatMappedMessages([])

      const historicalMessagesObject = await currentChannel.getHistory({ count: 5 })

      if (currentChannelMembership && historicalMessagesObject.messages.length) {
        await currentChannelMembership.setLastReadMessageTimetoken(
          historicalMessagesObject.messages[historicalMessagesObject.messages.length - 1].timetoken
        )
      }

      setMessageDraft(
        currentChannel.createMessageDraft({
          userSuggestionSource: "global",
          isTypingIndicatorTriggered: currentChannel.type !== "public",
        })
      )

      if (currentChannel.type !== "public") {
        currentChannel.getTyping((value) => {
          setTypingData(value)
        })
      }

      setGiftedChatMappedMessages((msgs) =>
        GiftedChat.prepend(
          [],
          historicalMessagesObject.messages
            .map((msg) => mapPNMessageToGChatMessage(msg, getUser(msg.userId)))
            .reverse()
        )
      )
      setGiftedChatMappedMessages((msgs) =>
        GiftedChat.prepend(
          [],
          historicalMessagesObject.messages
            .map((msg) => mapPNMessageToGChatMessage(msg, getUser(msg.userId)))
            .reverse()
        )
      )
    }

    switchChannelImplementation()
  }, [currentChannel, currentChannelMembership])

  useEffect(() => {
    if (!currentChannel) {
      return
    }

    const disconnect = currentChannel.connect((message) => {
      if (currentChannelMembership) {
        currentChannelMembership.setLastReadMessageTimetoken(message.timetoken)
      }
      setGiftedChatMappedMessages((currentMessages) =>
        GiftedChat.append(currentMessages, [
          mapPNMessageToGChatMessage(message, getUser(message.userId)),
        ])
      )
    })

    return () => {
      disconnect()
    }
  }, [currentChannel, currentChannelMembership])

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
    (giftedChatText: string) => {
      if (!messageDraft || giftedChatText === "") {
        setText("")
        return
      }

      messageDraft.onChange(giftedChatText).then((suggestionObject) => {
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

  const renderBubble = (props: Bubble<EnhancedIMessage>["props"]) => {
    return (
      <View>
        <Bubble
          {...props}
          wrapperStyle={{
            left: { padding: 12, backgroundColor: colors.neutral50 },
            right: { marginLeft: 0, padding: 12, backgroundColor: colors.teal100 },
          }}
        />
        {props.currentMessage?.originalPnMessage.hasThread ? (
          <TouchableOpacity
            onPress={() =>
              navigation.navigate("ThreadReply", {
                parentMessage: props.currentMessage,
              })
            }
            style={styles.threadRepliesContainer}
          >
            <MaterialCommunityIcons name="chevron-down" color={colors.teal700} size={24} />
            <Text variant="body" color="teal700">
              replies
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>
    )
  }

  if (!messageDraft || !chat) {
    return (
      <View style={{ justifyContent: "center", flex: 1 }}>
        <ActivityIndicator size="large" color={colors.navy700} />
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.content}>
      <GiftedChat
        messages={giftedChatMappedMessages}
        onSend={(messages) => onSend(messages)}
        onInputTextChanged={handleInputChange}
        renderMessageText={renderMessageText}
        renderFooter={renderFooter}
        text={text}
        loadEarlier={isMoreMessages}
        renderTime={() => null}
        isLoadingEarlier={isLoadingMoreMessages}
        renderBubble={renderBubble}
        renderChatFooter={renderChatFooter}
        onLoadEarlier={loadEarlierMessages}
        renderAvatar={(props) => {
          const user = getUser(props.currentMessage?.originalPnMessage.userId)
          return user && <Avatar source={user} size="md" />
        }}
        user={{
          _id: chat.currentUser.id,
        }}
        onLongPress={(_, giftedMessage: EnhancedIMessage) => {
          handlePresentModalPress({ message: giftedMessage })
        }}
        messageContainerRef={giftedChatRef}
      />
      <ActionsMenuComponent />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  content: { backgroundColor: "#ffffff", flex: 1 },
  bubbleContainer: {},
  link: { color: "#1066a4" },
  linkedMessage: { padding: 8 },
  text: { color: "#FFFFFF", padding: 8 },
  outgoingText: { color: "#000000" },
  threadRepliesContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
})
