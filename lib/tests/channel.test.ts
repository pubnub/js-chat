import { Chat, Channel } from "../src"
import * as dotenv from "dotenv"
import { initTestChannel, initTestChat, createRandomUserId } from "./testUtils"

dotenv.config()

describe("Channel test", () => {
  let chat: Chat
  let channel: Channel | null

  beforeEach(async () => {
    chat = initTestChat()
    channel = await initTestChannel(chat)
  })

  beforeEach(() => {
    jest.resetAllMocks()
  })

  afterEach(async () => {
    await channel?.disconnect()
  })

  test("should create a channel", async () => {
    const channelId = createRandomUserId()
    const channelName = "Test Channel"
    const channelDescription = "This is a test channel"

    const channelData = {
      name: channelName,
      description: channelDescription,
    }

    const createdChannel = await chat.createChannel(channelId, channelData)

    expect(createdChannel).toBeDefined()
    expect(createdChannel.id).toEqual(channelId)
    expect(createdChannel.name).toEqual(channelName)
    expect(createdChannel.description).toEqual(channelDescription)
  })

  test("should soft delete a channel", async () => {
    const channelId = createRandomUserId()
    const channelName = "Test Channel"
    const channelDescription = "This is a test channel"

    const channelData = {
      name: channelName,
      description: channelDescription,
    }

    const createdChannel = await chat.createChannel(channelId, channelData)

    const deleteOptions = {
      soft: true,
    }

    const isDeleted = await createdChannel.delete(deleteOptions)

    expect(isDeleted).toBeTruthy()
  })

  test("should get channel history", async () => {
    const messageText1 = "Test message 1"
    const messageText2 = "Test message 2"

    if (channel) {
      await channel.sendText(messageText1)
      await channel.sendText(messageText2)

      const history = await channel.getHistory()

      const message1InHistory = history.messages.some(
        (message) => message.content.text === messageText1
      )
      const message2InHistory = history.messages.some(
        (message) => message.content.text === messageText2
      )

      expect(message1InHistory).toBeTruthy()
      expect(message2InHistory).toBeTruthy()
    } else {
      fail("Channel is null")
    }
  })
})
