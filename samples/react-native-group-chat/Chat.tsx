import React, {useState, useCallback, useEffect, useContext} from "react"
import { GiftedChat, Bubble } from "react-native-gifted-chat"
import { StatusBar } from "expo-status-bar"
import { Linking, StyleSheet, Text, View } from "react-native"
import { SafeAreaView, SafeAreaProvider } from "react-native-safe-area-context"
import { Chat, Channel, User, MessageDraft, Message, MixedTextTypedElement } from "@pubnub/chat"
import { EnhancedIMessage, mapPNMessageToGChatMessage } from "./utils"
import {ChatContext} from "./context";

const publishKey = "pub-c-0457cb83-0786-43df-bc70-723b16a6e816"
const subscribeKey = "sub-c-e654122d-85b5-49a6-a3dd-8ebc93c882de"

export default function ChatScreen({ navigation }) {
  const [chat, setChat] = useState<Chat | null>(null)
  const [currentChannel, setCurrentChannel] = useState<Channel | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [giftedChatMappedMessages, setGiftedChatMappedMessages] = useState<EnhancedIMessage[]>([])
  const [users, setUsers] = useState(new Map())
  const [typingData, setTypingData] = useState<string[]>([])
  const [messageDraft, setMessageDraft] = useState<MessageDraft | null>(null)
  const [suggestedUsers, setSuggestedUsers] = useState<User[]>([])
  const [lastAffectedNameOccurrenceIndex, setLastAffectedNameOccurrenceIndex] = useState(-1)
  const [text, setText] = useState("")
  const chatContext = useContext(ChatContext)

  const updateUsersMap = useCallback((k: string, v: User | User[]) => {
    if (Array.isArray(v)) {
      const newUsers = new Map()

      v.forEach((user) => {
        newUsers.set(user.id, {
          ...user,
          thumbnail: `https://loremflickr.com/40/40?random=${user.id}`,
        })
      })

      setUsers(newUsers)
      return
    }

    setUsers(
      new Map(users.set(k, { ...v, thumbnail: `https://loremflickr.com/40/40?random=${k}` }))
    )
  }, [])

  useEffect(() => {
    async function init() {
      const chat = await Chat.init({
        publishKey,
        subscribeKey,
        userId: "test-user",
        typingTimeout: 2000,
      })

      setChat(chat)
      chatContext.setChat(chat)

      const channel =
        (await chat.getChannel("test-channel")) ||
        (await chat.createPublicConversation({
          channelId: "test-channel",
          channelData: { name: "Some test channel" },
        }))

      setCurrentChannel(channel)

      chat.getUsers({}).then((usersObject) => {
        updateUsersMap("1", usersObject.users)
      })

      updateUsersMap(chat.currentUser.id, chat.currentUser)
    }

    init()
  }, [])

  useEffect(() => {
    async function switchChannelImplementation() {
      if (!currentChannel) {
        return
      }

      const historicalMessagesObject = await currentChannel.getHistory({ count: 5 })

      setMessageDraft(currentChannel.createMessageDraft({ userSuggestionSource: "global" }))

      currentChannel.getTyping((value) => {
        setTypingData(value)
      })

      setMessages(historicalMessagesObject.messages)
      // setMessages((msgs) => [...historicalMessagesObject.messages, ...msgs])
      setGiftedChatMappedMessages((msgs) =>
        GiftedChat.append(
          [],
          historicalMessagesObject.messages
            .map((msg) => mapPNMessageToGChatMessage(msg, users.get(msg.userId)))
            .reverse()
        )
      )

      currentChannel.getTyping((value) => {
        setTypingData(value)
      })
    }

    switchChannelImplementation()
  }, [currentChannel])

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
      setMessages((currentMessages) => [...currentMessages, message])
      setGiftedChatMappedMessages((currentMessages) =>
        GiftedChat.append(currentMessages, [
          mapPNMessageToGChatMessage(message, users.get(message.userId)),
        ])
      )
    })

    return () => {
      disconnect()
      setMessages([])
    }
  }, [currentChannel, users])

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

  const openLink = (link: string) => {
    Linking.openURL(link)
  }

  const renderMessagePart = useCallback(
    (messagePart: MixedTextTypedElement, index: number, userId: string | number) => {
      if (messagePart.type === "text") {
        return (
          <Text
            style={[styles.text, userId === chat?.currentUser.id ? {} : styles.outgoingText]}
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
      if (props.currentMessage?.linkedText) {
        return (
          <Text style={styles.linkedMessage}>
            {props.currentMessage.linkedText.map((msgPart, index) =>
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
          <Text>{users.get(typingData[0])?.name || typingData[0]} is typing...</Text>
        </View>
      )
    }

    return (
      <View>
        <Text>
          {typingData.map((typingPoint) => users.get(typingPoint)?.name || typingPoint).join(", ")}{" "}
          are typing...
        </Text>
      </View>
    )
  }, [typingData, users])

  if (!messageDraft || !chat) {
    return <Text>Loading...</Text>
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <View>
          <Text onPress={() => navigation.navigate('ChannelList')}>
            Open Channel List
          </Text>
        </View>
        <View style={styles.content}>
          <GiftedChat
            messages={giftedChatMappedMessages}
            onSend={(messages) => onSend(messages)}
            onInputTextChanged={handleInputChange}
            renderMessageText={renderMessageText}
            renderFooter={renderFooter}
            text={text}
            user={{
              _id: "test-user",
            }}
          />
        </View>
        <StatusBar style="auto" />
      </SafeAreaView>
    </SafeAreaProvider>
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
})