import React, { useState, useCallback, useEffect, useContext, useMemo } from "react"
import { Linking, StyleSheet, View, ActivityIndicator, TouchableOpacity } from "react-native"
import { GiftedChat, Bubble } from "react-native-gifted-chat"
import { StackScreenProps } from "@react-navigation/stack"
import {Channel, User, MessageDraft, MixedTextTypedElement, Message} from "@pubnub/chat"

import { EnhancedIMessage, mapPNMessageToGChatMessage } from "../../../utils"
import { ChatContext } from "../../../context"
import { HomeStackParamList } from "../../../types"
import { useActionsMenu } from "../../../components"
import { getRandomAvatar, colorPalette as colors } from "../../../ui-components"
import { useNavigation } from "@react-navigation/native"
import {Icon, Text, usePNTheme} from "../../../ui-components"
import { useCommonChatRenderers } from "../../../hooks"

export function ChatScreen({ route }: StackScreenProps<HomeStackParamList, "Chat">) {
  const { channelId } = route.params
  const navigation = useNavigation()
  const [currentChannel, setCurrentChannel] = useState<Channel | null>(null)
  const [isMoreMessages, setIsMoreMessages] = useState(true)
  const [isLoadingMoreMessages, setIsLoadingMoreMessages] = useState(false)
  const [giftedChatMappedMessages, setGiftedChatMappedMessages] = useState<EnhancedIMessage[]>([])
  const [users, setUsers] = useState(new Map())
  const [typingData, setTypingData] = useState<string[]>([])
  const [messageDraft, setMessageDraft] = useState<MessageDraft | null>(null)
  const [suggestedUsers, setSuggestedUsers] = useState<User[]>([])
  const [lastAffectedNameOccurrenceIndex, setLastAffectedNameOccurrenceIndex] = useState(-1)
  const [text, setText] = useState("")
  const { chat, memberships } = useContext(ChatContext)
  const theme = usePNTheme()
  const currentChannelMembership = useMemo(
    () => memberships.find((membership) => membership.channel.id === channelId),
    [memberships, channelId]
  )
  const { renderFooter, renderMessageText } = useCommonChatRenderers({
    chat,
    typingData,
    users,
  })

  const { ActionsMenuComponent, handlePresentModalPress } = useActionsMenu()

  const updateUsersMap = useCallback((k: string, v: User | User[]) => {
    if (Array.isArray(v)) {
      const newUsers = new Map()

      v.forEach((user) => {
        newUsers.set(user.id, {
          ...user,
          thumbnail: getRandomAvatar(),
        })
      })

      setUsers(newUsers)
      return
    }

    setUsers(new Map(users.set(k, { ...v, thumbnail: getRandomAvatar() })))
  }, [])

  useEffect(() => {
    async function init() {
      if (!chat) {
        return
      }

      const channel =
        (await chat.getChannel(channelId)) ||
        (await chat.createPublicConversation({
          channelId,
          channelData: { name: "Some test channel" },
        }))

      setCurrentChannel(channel)

      chat.getUsers({}).then((usersObject) => {
        updateUsersMap("1", usersObject.users)
      })

      updateUsersMap(chat.currentUser.id, chat.currentUser)
    }

    init()
  }, [channelId])

  useEffect(() => {
    if (!giftedChatMappedMessages.length) {
      return
    }

    const unstream = Message.streamUpdatesOn(
      giftedChatMappedMessages.map((giftedMessage) => giftedMessage.originalPnMessage),
      (newMessages) => {
        setGiftedChatMappedMessages(
          newMessages.map((newMessage) => mapPNMessageToGChatMessage(newMessage, users))
        )
      }
    )

    return unstream
  }, [giftedChatMappedMessages])

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
          .map((msg) => mapPNMessageToGChatMessage(msg, users.get(msg.userId)))
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
        currentChannelMembership.setLastReadMessage(
          historicalMessagesObject.messages[historicalMessagesObject.messages.length - 1]
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
            .map((msg) => mapPNMessageToGChatMessage(msg, users.get(msg.userId)))
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
      if (!users.get(message.userId)) {
        chat?.getUser(message.userId).then((newUser) => {
          if (newUser) {
            updateUsersMap(message.userId, newUser)
          }
        })
      }

      if (currentChannelMembership) {
        currentChannelMembership.setLastReadMessage(message)
      }
      setGiftedChatMappedMessages((currentMessages) =>
        GiftedChat.append(currentMessages, [
          mapPNMessageToGChatMessage(message, users.get(message.userId)),
        ])
      )
    })

    return () => {
      disconnect()
    }
  }, [currentChannel, users, currentChannelMembership])

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
    [messageDraft, currentChannel]
  )

  const renderBubble = (props: Bubble<EnhancedIMessage>["props"]) => {
    return (
      <View>
        <Bubble
          {...props}
          wrapperStyle={{
            left: { padding: 12, backgroundColor: theme.colors.neutral50 },
            right: { marginLeft: 0, padding: 12, backgroundColor: theme.colors.teal100 },
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
            <Icon icon="chevron-down" iconColor="teal700" />
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
    <View style={styles.content}>
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
        onLoadEarlier={loadEarlierMessages}
        user={{
          _id: chat.currentUser.id,
        }}
        onLongPress={(_, giftedMessage: EnhancedIMessage) => {
          handlePresentModalPress({ message: giftedMessage })
        }}
      />
      <ActionsMenuComponent />
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
  outgoingText: { color: "#000000" },
  threadRepliesContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
})
