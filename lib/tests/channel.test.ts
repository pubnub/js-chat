import { Chat, Channel, User, Message, Membership } from "../src"
import * as dotenv from "dotenv"
import { initTestChat, createRandomUserId, extractMentionedUserIds } from "./testUtils"

dotenv.config()

describe("Channel test", () => {
  let chat: Chat
  let channel: Channel
  const channelData = {
    name: "Test Channel",
    description: "This is a test channel",
  }

  beforeEach(async () => {
    chat = await initTestChat()
    channel = await chat.createChannel(createRandomUserId(), channelData)
    jest.resetAllMocks()
  })

  afterEach(async () => {
    await channel.delete()
  })

  test("should create a channel", async () => {
    jest.retryTimes(3)
    expect(channel).toBeDefined()
    expect(channel.name).toEqual(channelData.name)
    expect(channel.description).toEqual(channelData.description)
  })

  test("should soft delete a channel", async () => {
    jest.retryTimes(3)
    const deleteOptions = {
      soft: true,
    }

    const { status } = (await channel.delete(deleteOptions)) as Channel
    expect(status).toBe("deleted")
  })

  test.only("should get channel history", async () => {
    jest.retryTimes(3)

    const messageText1 = "Test message 1"
    const messageText2 = "Test message 2"

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
  })

  test.skip("should get channel history with pagination", async () => {
    jest.retryTimes(3)

    const messageText1 = "Test message 1"
    const messageText2 = "Test message 2"
    const messageText3 = "Test message 3"

    await channel.sendText(messageText1)
    await channel.sendText(messageText2)
    await channel.sendText(messageText3)

    const history = await channel.getHistory({ count: 2 })

    expect(history.messages.length).toBe(2)
    expect(history.isMore).toBeTruthy()

    const secondPage = await channel.getHistory({ startTimetoken: history.messages[0].timetoken })

    expect(secondPage.messages.length).toBeGreaterThanOrEqual(1)
  })

  test("should fail when trying to send a message to a non-existent channel", async () => {
    jest.retryTimes(3)

    const channelId = createRandomUserId()
    const nonExistentChannel = (await chat.getChannel(channelId)) as Channel

    try {
      await nonExistentChannel.sendText("Test message")
      fail("Should have thrown an error")
    } catch (error) {
      expect(error).toBeInstanceOf(Error)
    }
  })

  test("should fail when trying to send a message to a deleted channel", async () => {
    jest.retryTimes(3)

    const channelId = createRandomUserId()
    const createdChannel = await chat.createChannel(channelId, channelData)
    await createdChannel.delete()

    try {
      await createdChannel.sendText("Test message")
      fail("Should have thrown an error")
    } catch (error) {
      expect(error).toBeInstanceOf(Error)
    }
  })

  test("should fail when trying to get history of a deleted channel", async () => {
    jest.retryTimes(3)

    await channel.delete()

    try {
      await channel.getHistory()
      fail("Should have thrown an error")
    } catch (error) {
      expect(error).toBeInstanceOf(Error)
    }
  })

  test("should edit membership metadata", async () => {
    jest.retryTimes(3)

    const membership = await channel.join(() => {
      //
    })

    const updatedMembership = await membership.update({
      custom: { role: "admin" },
    })

    expect(updatedMembership.custom?.role).toBe("admin")

    channel.leave()
  })

  test("should create direct conversation and send message", async () => {
    jest.retryTimes(3)

    const userId = "testUser1"
    const user =
      (await chat.getUser(userId)) || (await chat.createUser(userId, { name: "Test User 1" }))

    const directConversation = await chat.createDirectConversation({ user, channelData })

    expect(directConversation).toBeDefined()

    const messageText = "Hello from User1"

    await directConversation.channel.sendText(messageText)

    const history = await directConversation.channel.getHistory()

    const messageInHistory = history.messages.some(
      (message: Message) => message.content.text === messageText
    )
    expect(messageInHistory).toBeTruthy()
  })

  test.skip("should create a thread", async () => {
    jest.retryTimes(3)

    const messageText = "Test message"
    await channel.sendText(messageText)

    let history = await channel.getHistory()

    expect(history.messages.length).toBeGreaterThan(0)

    let sentMessage = history.messages[0]

    expect(sentMessage.hasThread).toBe(false)

    if (!sentMessage.hasThread) {
      await sentMessage.createThread()
    }

    history = await channel.getHistory()
    sentMessage = history.messages[0]

    expect(sentMessage.hasThread).toBe(true)

    const thread = await sentMessage.getThread()
    const threadText = "Whatever text"

    // Use sendText in thread
    await thread.sendText(threadText)

    const threadMessages = await thread.getHistory()

    expect(threadMessages.messages.some((message) => message.text === threadText)).toBe(true)
  })

  test("should stream channel updates and invoke the callback", async () => {
    const channel1Id = `channel1_${Date.now()}`
    const channel2Id = `channel2_${Date.now()}`

    const channel1 = await chat.createChannel(channel1Id, {})
    const channel2 = await chat.createChannel(channel2Id, {})

    const channels = [channel1, channel2]

    const callback = jest.fn((updatedChannels) => {
      expect(updatedChannels).toEqual(channels)

      Promise.all(channels.map((channel) => channel.delete())).catch((error) => {
        throw error
      })
    })

    const unsubscribe = Channel.streamUpdatesOn(channels, callback)

    await Promise.all(channels.map((channel) => channel.update({ name: "Updated Name" })))

    await new Promise((resolve) => setTimeout(resolve, 5000))

    unsubscribe()
  }, 10000)

  test("should stream membership updates and invoke the callback", async () => {
    const channel1Id = `channel1_${Date.now()}`
    const channel2Id = `channel2_${Date.now()}`

    const channel1 = await chat.createChannel(channel1Id, {})
    const channel2 = await chat.createChannel(channel2Id, {})

    const channels = [channel1, channel2]

    const callback = jest.fn((updatedMemberships) => {
      expect(updatedMemberships).toEqual(memberships)

      Promise.all(channels.map((channel) => channel.delete())).catch((error) => {
        throw error
      })
    })

    const user1 = new User(chat, { id: "user1" })
    const user2 = new User(chat, { id: "user2" })

    const memberships = channels.map((channel) => {
      const membershipData = {
        channel,
        user: channel === channel1 ? user1 : user2,
        custom: null,
      }
      return new Membership(chat, membershipData)
    })

    const unsubscribe = Membership.streamUpdatesOn(memberships, callback)

    await Promise.all(channels.map((channel) => channel.update({ name: "Updated Name" })))

    await new Promise((resolve) => setTimeout(resolve, 5000))

    unsubscribe()
  }, 10000)

  test("should get unread messages count", async () => {
    jest.retryTimes(3)

    const messageText1 = "Test message 1"
    const messageText2 = "Test message 2"

    await channel.sendText(messageText1)
    await channel.sendText(messageText2)

    let membership = await channel.join((message) => {
      //
    })
    let unreadCount = await membership.getUnreadMessagesCount()

    expect(unreadCount).toBe(false)

    const { messages } = await channel.getHistory()
    membership = await membership.setLastReadMessage(messages[0])
    unreadCount = await membership.getUnreadMessagesCount()

    expect(unreadCount).toBe(1)

    channel.leave()
  })

  test.skip("should mention users in a message and validate mentioned users", async () => {
    jest.retryTimes(3)

    const user1Id = `user1_${Date.now()}`
    const user1 = await chat.createUser(user1Id, { name: "User 1" })

    const user2Id = `user2_${Date.now()}`
    const user2 = await chat.createUser(user2Id, { name: "User 2" })

    const messageText = `Hello, @${user1.id} and @${user2.id} here is my mail test@pubnub.com`

    await channel.sendText(messageText)

    const history = await channel.getHistory()

    const messageInHistory = history.messages.find(
      (message: any) => message.content.text === messageText
    )

    expect(messageInHistory).toBeDefined()

    const mentionedUserIds = extractMentionedUserIds(messageText)
    const mentionedUsers = [user1, user2].filter((user) => mentionedUserIds.includes(user.id))

    expect(mentionedUsers.length).toBe(2)
    expect(mentionedUsers[0].id).toBe(user1.id)
    expect(mentionedUsers[1].id).toBe(user2.id)

    await chat.deleteUser(user1.id)
    await chat.deleteUser(user2.id)
  })

  jest.retryTimes(3)
})
