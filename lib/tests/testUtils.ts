// lib/tests/testUtils.ts
import { Chat } from "../src"
import { Channel } from "../src"
import * as dotenv from "dotenv"
import { nanoid } from "nanoid"

dotenv.config()

export const createRandomUserId = (prefix = "user"): string => {
  return `${prefix}_${nanoid(8)}`
}

export const initTestChat = (): Chat => {
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
