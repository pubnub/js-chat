// lib/tests/testUtils.ts
import { Chat } from "../src"
import { Channel } from "../src"
import * as dotenv from "dotenv"
import { nanoid } from "nanoid"
import { User } from "../src"

dotenv.config()

export const createRandomUserId = (prefix = "user"): string => {
  return `${prefix}_${nanoid(8)}`
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

export const extractMentionedUserNames = (messageText: string): string[] => {
  const regex = /@"([^"]+)"/g
  let match
  const mentionedUserNames: string[] = []
  while ((match = regex.exec(messageText)) !== null) {
    mentionedUserNames.push(match[1])
  }
  return mentionedUserNames
}
