import { Chat, Channel, User, Message, Membership, MessageDraft } from "../src"
import * as dotenv from "dotenv"
import {
  initTestChat,
  createRandomUserId,
  extractMentionedUserIds,
  extractMentionedUserNames,
} from "./testUtils"

dotenv.config()

describe("Channel test", () => {
  let chat: Chat
  let channel: Channel | null

  beforeEach(async () => {
    chat = await initTestChat()
  })

  beforeEach(() => {
    jest.resetAllMocks()
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

  test("should create direct conversation and send message", async () => {
    jest.retryTimes(3)

    const user1Id = "testUser1"
    const user1 =
      (await chat.getUser(user1Id)) || (await chat.createUser(user1Id, { name: "Test User 1" }))

    const channelData = {
      name: "Direct Conversation",
      description: "Direct conversation for Test User 1",
    }

    const directConversation = await chat.createDirectConversation({
      user: user1,
      channelData: channelData,
    })

    expect(directConversation).toBeDefined()

    const messageText = "Hello from User1"

    await directConversation.channel.sendText(messageText)

    const history = await directConversation.channel.getHistory()

    const messageInHistory = history.messages.some(
      (message: Message) => message.content.text === messageText
    )
    expect(messageInHistory).toBeTruthy()
  })

  test("should create a thread", async () => {
    jest.retryTimes(3)

    const channelId = createRandomUserId()
    const channelName = "Test Channel"
    const channelDescription = "This is a test channel"

    const channelData = {
      name: channelName,
      description: channelDescription,
    }

    const createdChannel = await chat.createChannel(channelId, channelData)

    const messageText = "Test message"
    await createdChannel.sendText(messageText)

    let history = await createdChannel.getHistory()
    let sentMessage = history.messages[0]

    expect(sentMessage.hasThread).toBe(false)

    if (!sentMessage.hasThread) {
      await sentMessage.createThread()
    }

    history = await createdChannel.getHistory()
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

    if (channel) {
      await channel.sendText(messageText1)
      await channel.sendText(messageText2)

      const membership = await channel.join((message) => {
        // Handle received messages
      })

      const unreadCount = await membership.getUnreadMessagesCount()

      expect(unreadCount).toBe(2)
    } else {
      expect(channel).not.toBeNull()
    }
  })

  test("should mention users in a message and validate mentioned users", async () => {
    jest.retryTimes(3)

    const channelId = createRandomUserId()
    const channelData = {
      name: "Test Channel",
      description: "This is a test channel",
    }
    const createdChannel = await chat.createChannel(channelId, channelData)

    const user1Id = `user1_${Date.now()}`
    const user1 = await chat.createUser(user1Id, { name: "User 1" })

    const user2Id = `user2_${Date.now()}`
    const user2 = await chat.createUser(user2Id, { name: "User 2" })

    const messageText = `Hello, @${user1.id} and @${user2.id} here is my mail test@pubnub.com`

    await createdChannel.sendText(messageText)

    const history = await createdChannel.getHistory()

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

  test("should mention users with multi-word names in a message and validate mentioned users", async () => {
    jest.retryTimes(3)

    const channelId = createRandomUserId()
    const channelData = {
      name: "Test Channel",
      description: "This is a test channel",
    }
    const createdChannel = await chat.createChannel(channelId, channelData)

    const user1Id = `user1_${Date.now()}`
    const user1 = await chat.createUser(user1Id, { name: "User One" })

    const user2Id = `user2_${Date.now()}`
    const user2 = await chat.createUser(user2Id, { name: "User Two" })

    const messageText = `Hello, @"${user1.name}" and @"${user2.name}" here is my mail test@pubnub.com`

    await createdChannel.sendText(messageText)

    const history = await createdChannel.getHistory()

    const messageInHistory = history.messages.find(
      (message: any) => message.content.text === messageText
    )

    expect(messageInHistory).toBeDefined()

    const mentionedUserNames = extractMentionedUserNames(messageText)

    console.log(mentionedUserNames) // <- log

    const mentionedUsers = [user1, user2].filter(
      (user) => user.name && mentionedUserNames.includes(user.name)
    )

    console.log(mentionedUsers) // <- log

    expect(mentionedUsers.length).toBe(2)
    expect(mentionedUsers[0].name).toBe("User One")
    expect(mentionedUsers[1].name).toBe("User Two")

    await chat.deleteUser(user1.id)
    await chat.deleteUser(user2.id)
  })

  test("should send a message with words that start with @ but are not user mentions", async () => {
    jest.retryTimes(3)

    const channelId = createRandomUserId()
    const channelName = "Test Channel"
    const channelDescription = "This is a test channel"

    const channelData = {
      name: channelName,
      description: channelDescription,
    }

    const createdChannel = await chat.createChannel(channelId, channelData)

    const messageText =
      "Hello, this is a test message with words that start with @ but are not user mentions: @test, @example, @check."

    await createdChannel.sendText(messageText)

    const history = await createdChannel.getHistory()

    const messageInHistory = history.messages.find(
      (message: any) => message.content.text === messageText
    )

    expect(messageInHistory).toBeDefined()

    const mentionedUserNames = extractMentionedUserNames(messageText)

    expect(mentionedUserNames.length).toBe(0)
  })

  test("should mention users with incorrect usernames and validate no users are mentioned", async () => {
    jest.retryTimes(3)

    const channelId = createRandomUserId()
    const channelData = {
      name: "Test Channel",
      description: "This is a test channel",
    }
    const createdChannel = await chat.createChannel(channelId, channelData)

    const user1Id = `user1_${Date.now()}`
    const user1 = await chat.createUser(user1Id, { name: "User One" })

    const incorrectUserId = user1Id.substring(0, user1Id.length - 1)

    const messageText = `Hello, @${incorrectUserId}, I tried to mention you`

    await createdChannel.sendText(messageText)

    const history = await createdChannel.getHistory()

    const messageInHistory = history.messages.find(
      (message: any) => message.content.text === messageText
    )

    expect(messageInHistory).toBeDefined()

    const mentionedUserIds = extractMentionedUserIds(messageText)

    const mentionedUsers = [user1].filter((user) => mentionedUserIds.includes(user.id))

    expect(mentionedUsers.length).toBe(0)

    await chat.deleteUser(user1.id)
  })

  test("should mention global users who are not members of the channel", async () => {
    jest.retryTimes(3)

    const channelId = createRandomUserId()
    const channelData = {
      name: "Test Channel",
      description: "This is a test channel",
    }
    const createdChannel = await chat.createChannel(channelId, channelData)

    const user1Id = `user1_${Date.now()}`
    const user1 = await chat.createUser(user1Id, { name: "User 1" })

    const user2Id = `user2_${Date.now()}`
    const user2 = await chat.createUser(user2Id, { name: "User 2" })

    await createdChannel.invite(user1)

    const membersResponse = await createdChannel.getMembers()
    const members = membersResponse.members // Add this line to declare the members array.
    expect(members.some((member: Membership) => member.user.id === user1.id)).toBeTruthy()
    expect(members.some((member: Membership) => member.user.id === user2.id)).toBeFalsy()

    const messageText = `Hello, @${user1.id} and @${user2.id} here is my mail test@pubnub.com`

    await createdChannel.sendText(messageText)

    const history = await createdChannel.getHistory()

    const messageInHistory = history.messages.find(
      (message: any) => message.content.text === messageText
    )

    expect(messageInHistory).toBeDefined()

    const mentionedUserIds = extractMentionedUserIds(messageText)
    const mentionedUsers = [user1, user2].filter((user) => mentionedUserIds.includes(user.id))

    // Expect both users (even the global user) to be mentioned
    expect(mentionedUsers.length).toBe(2)
    expect(mentionedUsers[0].id).toBe(user1.id)
    expect(mentionedUsers[1].id).toBe(user2.id)

    await chat.deleteUser(user1.id)
    await chat.deleteUser(user2.id)
  })

  test("should mention the same user multiple times in a message and validate mentioned users", async () => {
    jest.retryTimes(3)

    const channelId = createRandomUserId()
    const channelData = {
      name: "Test Channel",
      description: "This is a test channel",
    }
    const createdChannel = await chat.createChannel(channelId, channelData)

    const user1Id = `user1_${Date.now()}`
    const user1 = await chat.createUser(user1Id, { name: "User 1" })

    const messageText = `Hello, @${user1.id}, how are you? @${user1.id}, are you there?`

    await createdChannel.sendText(messageText)

    const history = await createdChannel.getHistory()

    const messageInHistory = history.messages.find(
      (message: any) => message.content.text === messageText
    )

    expect(messageInHistory).toBeDefined()

    const mentionedUserIds = extractMentionedUserIds(messageText)
    const mentionedUsers = [user1].filter((user) => mentionedUserIds.includes(user.id))

    expect(mentionedUsers.length).toBe(1)
    expect(mentionedUsers[0].id).toBe(user1.id)

    await chat.deleteUser(user1.id)
  })

  jest.retryTimes(3)
})
