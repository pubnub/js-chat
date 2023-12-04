import React, { useCallback, useContext, useEffect, useState } from "react"
import { Bubble } from "react-native-gifted-chat"
import { EnhancedIMessage } from "../../utils"
import { Image, Linking, View } from "react-native"
import { Quote } from "../quote"
import { Text } from "../../ui-components"
import { Message, MixedTextTypedElement } from "@pubnub/chat"
import { ChatContext } from "../../context"
import { useNavigation } from "@react-navigation/native"

type MessageTextProps = {
  onGoToMessage: (message: Message) => void
  messageProps: Bubble<EnhancedIMessage>["props"]
}

export function MessageText({ onGoToMessage, messageProps }: MessageTextProps) {
  const { chat, setCurrentChannel } = useContext(ChatContext)
  const navigation = useNavigation()
  const [imageSrc, setImageSrc] = useState("")

  useEffect(() => {
    const files = messageProps.currentMessage?.originalPnMessage.files
    if (!files || !files.length || files[0].type !== "image/jpeg" || !chat) {
      return
    }
    chat.sdk
      .downloadFile({
        channel: messageProps.currentMessage?.originalPnMessage.channelId,
        id: files[0].id,
        name: files[0].name,
      })
      .then(async (fileParts) => {
        setImageSrc(URL.createObjectURL(await fileParts.toFile()))
      })
      .catch((err) => {
        setImageSrc(files[0].url)
      })
  }, [])

  const openLink = (link: string) => {
    Linking.openURL(link)
  }

  async function openChannel(channelId: string) {
    if (!chat) return
    const channel = await chat.getChannel(channelId)
    if (!channel) {
      alert("This channel no longer exists.")
      return
    }
    navigation.pop()
    setCurrentChannel(channel)
    navigation.navigate("Chat")
  }

  const renderEmojis = useCallback(() => {
    if (!messageProps.currentMessage?.originalPnMessage.reactions) {
      return null
    }

    return (
      <View style={{ flexDirection: "row", position: "absolute", right: 0, bottom: -20 }}>
        {Object.keys(messageProps.currentMessage?.originalPnMessage.reactions).map((key, index) => (
          <Text key={String(index)}>{key}</Text>
        ))}
      </View>
    )
  }, [messageProps.currentMessage?.originalPnMessage.reactions])

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
          <Text
            key={index}
            variant="body"
            onPress={() => openLink(messagePart.content.link)}
            color="sky150"
          >
            {messagePart.content.link}
          </Text>
        )
      }
      if (messagePart.type === "textLink") {
        return (
          <Text
            key={index}
            variant="body"
            onPress={() => openLink(messagePart.content.link)}
            color="sky150"
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
            onPress={() => openLink(`https://pubnub.com/${messagePart.content.id}`)}
            color="sky150"
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
            onPress={() => openChannel(messagePart.content.id)}
            color="sky150"
          >
            #{messagePart.content.name}
          </Text>
        )
      }

      return null
    },
    [chat?.currentUser]
  )

  const renderImage = () => {
    if (!imageSrc) {
      return
    }
    // console.log("src?", imageSrc)
    // display just one image for now
    // return <Image source={{ uri: imageSrc }} style={{ width: 100, height: 100 }} />
    return <img src={imageSrc} style={{ width: 100, height: 100 }} />
  }

  const messageElements = messageProps.currentMessage?.originalPnMessage.getMessageElements()

  if (messageElements) {
    return (
      <View>
        {messageProps.currentMessage?.originalPnMessage.quotedMessage ? (
          <Quote
            message={messageProps.currentMessage?.originalPnMessage.quotedMessage}
            onGoToMessage={() =>
              onGoToMessage(messageProps.currentMessage?.originalPnMessage.quotedMessage)
            }
            charactersLimit={50}
          />
        ) : null}
        <Text variant="body">
          {messageElements.map((msgPart, index) =>
            renderMessagePart(
              msgPart,
              index,
              messageProps.currentMessage?.originalPnMessage.userId || ""
            )
          )}
        </Text>
        {renderImage()}
        {renderEmojis()}
      </View>
    )
  }

  return <Text variant="body">{messageProps.currentMessage?.text}</Text>
}
