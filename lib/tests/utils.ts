// lib/tests/testUtils.ts
import { Chat, MessageDraft, Channel, Message } from "../src"
import * as dotenv from "dotenv"

dotenv.config()

let chat: Chat | undefined

function makeid(length = 8) {
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

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function createChatInstance() {
  const keysetError = `
    #######################################################
    # Could not read the PubNub keyset from the .env file #
    #######################################################
  `

  if (!process.env.PUBLISH_KEY || !process.env.SUBSCRIBE_KEY || !process.env.USER_ID)
    throw keysetError

  if (!chat) {
    chat = await Chat.init({
      publishKey: process.env.PUBLISH_KEY,
      subscribeKey: process.env.SUBSCRIBE_KEY,
      userId: process.env.USER_ID,
    })
  }

  return chat
}

export function createRandomChannel() {
  return chat.createChannel(`channel_${makeid()}`, {
    name: "Test Channel",
    description: "This is a test channel",
  })
}

export function createRandomUser() {
  return chat.createUser(`user_${makeid()}`, {
    name: "Test User",
  })
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

export const sendMessageAndWaitForHistory = async (
  messageDraft: MessageDraft,
  channel: Channel,
  waitTimeMs = 150
): Promise<Message | undefined> => {
  await messageDraft.send()
  await sleep(waitTimeMs)

  const history = await channel.getHistory()
  const messageInHistory = history.messages.find(
    (message: any) => message.content.text === messageDraft.value
  )
  return messageInHistory
}
