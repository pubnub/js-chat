// lib/tests/testUtils.ts
import { Chat } from "../src"
import { Channel } from "../src"
import * as dotenv from "dotenv"
import { User } from "../src"

dotenv.config()

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function makeid(length) {
  let result = ""
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  const charactersLength = characters.length
  let counter = 0
  while (counter < length) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength))
    counter += 1
  }
  return result
}

export const createRandomUserId = () => {
  return `user_${makeid()}`
}

export const createRandomChannelId = () => {
  return `channel_${makeid()}`
}

export const initTestChat = (): Promise<Chat> => {
  return Chat.init({
    publishKey: process.env.PUBLISH_KEY!,
    subscribeKey: process.env.SUBSCRIBE_KEY!,
    userId: process.env.USER_ID!,
  })
}

export const initTestChannel = async (
  chat: Chat,
  channelName = "test-react-channel-C1"
): Promise<Channel> => {
  let channel = await chat.getChannel(channelName)

  if (!channel) {
    channel = await chat.createChannel(channelName, {
      name: "test-channel",
    })
  }

  return channel
}

export const initTestUser = async (chat: Chat, userId = createRandomUserId()): Promise<User> => {
  let user = await chat.getUser(userId)

  if (!user) {
    user = await chat.createUser(userId, {
      name: "Test User",
    })
  }

  return user
}

export const waitForAllMessagesToBeDelivered = async (
  textMessages: string[],
  messages: string[]
): Promise<void> => {
  await new Promise<void>(async (resolveMainFunction) => {
    for (let i = 0; i < 3; i++) {
      const allMessagesReceived = textMessages.every((textMessage) =>
        messages.includes(textMessage)
      )

      if (allMessagesReceived) {
        break
      } else {
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }
    }

    resolveMainFunction()
  })
}

export const extractMentionedUserIds = (messageText: string): string[] => {
  const regex = /@(\w+)(?!\.[^\s@])\b/g
  const matches = messageText.match(regex)
  if (matches) {
    return matches.map((match) => match.slice(1))
  }
  return []
}
