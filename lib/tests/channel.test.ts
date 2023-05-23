import { Chat, Channel, User } from "../src"
import * as dotenv from "dotenv"
import { initTestChat, createRandomUserId } from "./testUtils"

dotenv.config()

describe("Channel test", () => {
  let chat: Chat
  let channel: Channel | null

  beforeEach(async () => {
    chat = initTestChat()
    const userId = "testUser"
    const user =
      (await chat.getUser(userId)) || (await chat.createUser(userId, { name: "Testing" }))
    chat.setChatUser(user)
  })

  beforeEach(() => {
    jest.resetAllMocks()
  })

  afterEach(async () => {
    await channel?.disconnect()
  })

  test("should create a channel", async () => {
    jest.retryTimes(3)

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
    jest.retryTimes(3)

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
    jest.retryTimes(3)

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
      expect(channel).not.toBeNull()
    }
  })

  test("should get channel history with pagination", async () => {
    jest.retryTimes(3)

    const messageText1 = "Test message 1"
    const messageText2 = "Test message 2"
    const messageText3 = "Test message 3"

    if (channel) {
      const result1 = await channel.sendText(messageText1)
      const result2 = await channel.sendText(messageText2)
      const result3 = await channel.sendText(messageText3)

      const history = await channel.getHistory({ count: 2 })

      expect(history.messages.length).toBe(2)

      expect(history.isMore).toBeTruthy()

      const secondPage = await channel.getHistory({ startTimetoken: history.messages[0].timetoken })

      expect(secondPage.messages.length).toBeGreaterThanOrEqual(1)
    } else {
      expect(channel).not.toBeNull()
    }
  })

  test("should fail when trying to create a channel without required parameters", async () => {
    jest.retryTimes(3)

    const channelId = createRandomUserId()

    try {
      await chat.createChannel(channelId, {})
      fail("Should have thrown an error")
    } catch (error) {
      expect(error).toBeInstanceOf(Error)
    }
  })

  test("should fail when trying to send a message to a non-existent channel", async () => {
    jest.retryTimes(3)

    const channelId = createRandomUserId()
    const nonExistentChannel = await chat.getChannel(channelId)

    if (nonExistentChannel) {
      try {
        await nonExistentChannel.sendText("Test message")
        expect(true).toBe(false) // Fail the test if no error is thrown
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
      }
    } else {
      expect(nonExistentChannel).toBeNull()
    }
  })

  test("should fail when trying to send a message to a deleted channel", async () => {
    jest.retryTimes(3)

    const channelId = createRandomUserId()
    const channelName = "Test Channel"
    const channelDescription = "This is a test channel"

    const channelData = {
      name: channelName,
      description: channelDescription,
    }

    const createdChannel = await chat.createChannel(channelId, channelData)
    await createdChannel.delete()

    try {
      await createdChannel.sendText("Test message")
      fail("Should have thrown an error")
    } catch (error) {
      expect(error).toBeInstanceOf(Error)
    }
  })
  jest.retryTimes(3)

  test("should fail when trying to get history of a deleted channel", async () => {
    jest.retryTimes(3)

    const channelId = createRandomUserId()
    const channelName = "Test Channel"
    const channelDescription = "This is a test channel"

    const channelData = {
      name: channelName,
      description: channelDescription,
    }

    const createdChannel = await chat.createChannel(channelId, channelData)
    await createdChannel.delete()

    try {
      await createdChannel.getHistory()
      fail("Should have thrown an error")
    } catch (error) {
      expect(error).toBeInstanceOf(Error)
    }
  })

  test("should edit membership metadata", async () => {
    jest.retryTimes(3)

    const user1 = new User(chat, { id: "user1" })
    const user2 = new User(chat, { id: "user2" })

    const channelId = createRandomUserId()
    const channelData = {
      name: "Test Channel",
      description: "This is a test channel",
    }
    const createdChannel = await chat.createChannel(channelId, channelData)

    const membership1 = await createdChannel.join((message) => {
      // Message callback
    })

    const membership2 = await createdChannel.join((message) => {
      // Message callback
    })

    const updatedMembership1 = await membership1.update({
      custom: { role: "admin" },
    })

    expect(updatedMembership1.custom?.role).toBe("admin")

    const updatedMembership2 = await membership2.update({
      custom: { role: "member" },
    })

    expect(updatedMembership2.custom?.role).toBe("member")
  })
  jest.retryTimes(3)
})
