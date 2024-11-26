import React, { useState, useCallback, useEffect, useContext, useRef, useMemo } from "react"
import {
  StyleSheet,
  View,
  ActivityIndicator,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  Platform,
  Alert,
} from "react-native"
import { GiftedChat, Bubble } from "react-native-gifted-chat"
import { StackScreenProps } from "@react-navigation/stack"
import { User, MessageDraft, Message, Channel, ThreadMessage } from "@pubnub/chat"

import { EnhancedIMessage, mapPNMessageToGChatMessage } from "../../../utils"
import { ChatContext } from "../../../context"
import { HomeStackParamList } from "../../../types"
import { Avatar, useActionsMenu } from "../../../components"
import { colorPalette as colors, Text } from "../../../ui-components"
import { useNavigation } from "@react-navigation/native"
import { useCommonChatRenderers } from "../../../hooks"
import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons"

export function ChatScreen({}: StackScreenProps<HomeStackParamList, "Chat">) {
  const { chat, setCurrentChannel, currentChannel, getUser, currentChannelMembers } =
    useContext(ChatContext)
  const navigation = useNavigation()
  const [isMoreMessages, setIsMoreMessages] = useState(true)
  const [image, setImage] = useState<string>("")
  const [isLoadingMoreMessages, setIsLoadingMoreMessages] = useState(false)
  const [giftedChatMappedMessages, setGiftedChatMappedMessages] = useState<EnhancedIMessage[]>([])
  const [typingData, setTypingData] = useState<string[]>([])
  const [messageDraft, setMessageDraft] = useState<MessageDraft | null>(null)
  const [suggestedData, setSuggestedData] = useState<User[] | Channel[]>([])
  const [showSuggestedData, setShowSuggestedData] = useState(false)
  const [showTextLinkBox, setShowTextLinkBox] = useState(false)
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
    showTextLinkBox,
    setShowTextLinkBox,
    image,
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

  const handleDeleteMessage = useCallback(async (message: Message) => {
    if (message.deleted) {
      await message.restore()
    } else {
      await message.delete({ soft: true })
    }
  }, [])

  const handleEditMessage = useCallback(
    async (message: Message) => {
      if (!currentChannel) {
        return
      }
      const newMessageDraft = currentChannel.createMessageDraft({
        userSuggestionSource: "global",
        isTypingIndicatorTriggered: currentChannel.type !== "public",
      })
      newMessageDraft.value = message.text
      setText(newMessageDraft.value)
      setGiftedChatMappedMessages((curr) =>
        curr.map((m) => {
          return {
            ...m,
            isBeingEdited: m.originalPnMessage.timetoken === message.timetoken,
          }
        })
      )

      setMessageDraft(newMessageDraft)
    },
    [currentChannel]
  )

  const { ActionsMenuComponent, handlePresentModalPress } = useActionsMenu({
    onQuote: handleQuote,
    onPinMessage: handlePin,
    onToggleEmoji: handleEmoji,
    onDeleteMessage: handleDeleteMessage,
    onEditMessage: handleEditMessage,
  })

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
      try {
        if (!currentChannel || !chat) {
          return
        }
        setGiftedChatMappedMessages([])

        const historicalMessagesObject = await currentChannel.getHistory({ count: 10 })

        if (currentChannelMembership && historicalMessagesObject.messages.length) {
          await currentChannelMembership.setLastReadMessageTimetoken(
            historicalMessagesObject.messages[historicalMessagesObject.messages.length - 1]
              .timetoken
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
      } catch (error) {
        const e = error as { status: { errorData: { status: number } } }
        if (e?.status?.errorData?.status !== 403) {
          return
        }
        if (Platform.OS === "web") {
          alert(`You cannot access this channel: ${currentChannel?.id}`)
        } else {
          Alert.alert("You cannot access this channel:", currentChannel?.id)
        }
      }
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

  function resetMessageBeingEdited() {
    setGiftedChatMappedMessages((curr) =>
      curr.map((m) => {
        return {
          ...m,
          isBeingEdited: false,
        }
      })
    )
  }

  const resetInput = () => {
    if (!messageDraft) {
      return
    }
    messageDraft.onChange("")
    messageDraft.removeQuote()
    messageDraft.files = undefined
    setText("")
    setImage("")
    resetMessageBeingEdited()
  }

  function getMessageBeingEdited() {
    return giftedChatMappedMessages.find((m) => m.isBeingEdited)?.originalPnMessage
  }

  const onSend = async () => {
    if (!messageDraft) {
      return
    }

    try {
      const messageBeingEdited = getMessageBeingEdited()
      if (messageBeingEdited) {
        await messageBeingEdited.editText(messageDraft.value)
      } else {
        await messageDraft.send()
      }
    } catch (error) {
      let alertFn = (_: string) => null
      if (Platform.OS === "web") {
        alertFn = alert
      } else {
        alertFn = Alert.alert
      }

      if (typeof error === "string") {
        alertFn(error)
        resetMessageBeingEdited()
      }
      const e = error as { status: { errorData: { status: number } } }
      if (e?.status?.errorData?.status !== 403) {
        return
      }
      alertFn(`You cannot send messages to this channel: ${currentChannel?.id}`)
    }
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && messageDraft) {
      messageDraft.files = [e.target.files[0]]
      setImage(e.target.files[0].name)
    }
  }

  const renderBubble = (props: Bubble<EnhancedIMessage>["props"]) => {
    const isBeingEditedStyles = props.currentMessage.isBeingEdited
      ? {
          borderWidth: 1,
          borderColor: colors.teal700,
        }
      : {}

    return (
      <View>
        <Bubble
          {...props}
          wrapperStyle={{
            left: { padding: 12, backgroundColor: colors.neutral50 },
            right: {
              marginLeft: 0,
              padding: 12,
              backgroundColor: colors.teal100,
              ...isBeingEditedStyles,
            },
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

  const renderActions = () => {
    return (
      <View style={styles.actionsContainer}>
        {Platform.OS === "web" ? (
          <>
            <label htmlFor="fileInput">
              <MaterialIcons
                name="camera-alt"
                size={20}
                style={{ marginRight: 8, cursor: "pointer" }}
                color={colors.neutral600}
              />
            </label>
            <input
              id="fileInput"
              type="file"
              accept="image/png, image/gif, image/jpeg"
              onChange={handleFileChange}
              style={{ display: "none" }}
            />
          </>
        ) : null}
        <MaterialIcons
          name="insert-link"
          size={20}
          style={{ marginRight: 8 }}
          color={colors.neutral600}
          onPress={() => setShowTextLinkBox(true)}
        />
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
        onSend={onSend}
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
        renderActions={renderActions}
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
  actionsContainer: {
    width: Platform.OS === "web" ? 80 : 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
  },
})
