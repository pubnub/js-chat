import { Channel, Message, Chat, MessageDraft } from "../src"
import {
  sleep,
  extractMentionedUserIds,
  createRandomUser,
  createRandomChannel,
  createChatInstance,
} from "./utils"
import { extractMentionedUserNames } from "./testUtils"
import { jest } from "@jest/globals"

describe("Channel test", () => {
  jest.retryTimes(3)

  let chat: Chat
  let channel: Channel
  let messageDraft: MessageDraft

  beforeAll(async () => {
    chat = await createChatInstance()
  })

  beforeEach(async () => {
    channel = await createRandomChannel()
    messageDraft = channel.createMessageDraft()
  })

  afterEach(async () => {
    await channel.delete()
  })

  test("should create a channel", async () => {
    expect(channel).toBeDefined()
    const fetchedChannel = await chat.getChannel(channel.id)
    expect(fetchedChannel).toBeDefined()
    expect(fetchedChannel.name).toEqual(channel.name)
    expect(fetchedChannel.description).toEqual(channel.description)
  })

  test("Should be able to delete channel", async () => {
    const deleteOptions = { soft: true }
    const { status } = (await channel.delete(deleteOptions)) as Channel
    expect(status).toBe("deleted")

    const deleteResult = await channel.delete()
    expect(deleteResult).toBe(true)
    const fetchedChannel = await chat.getChannel(channel.id)
    expect(fetchedChannel).toBeNull()
  })

  test("should get channel history", async () => {
    const messageText1 = "Test message 1"
    const messageText2 = "Test message 2"

    await channel.sendText(messageText1)
    await channel.sendText(messageText2)
    await sleep(150) // history calls have around 130ms of cache time

    const history = await channel.getHistory()
    expect(history.messages.length).toBe(2)

    const message1InHistory = history.messages.some(
      (message) => message.content.text === messageText1
    )
    const message2InHistory = history.messages.some(
      (message) => message.content.text === messageText2
    )
    expect(message1InHistory).toBeTruthy()
    expect(message2InHistory).toBeTruthy()
  })

  test("should get channel history with pagination", async () => {
    const messageText1 = "Test message 1"
    const messageText2 = "Test message 2"
    const messageText3 = "Test message 3"

    await channel.sendText(messageText1)
    await channel.sendText(messageText2)
    await channel.sendText(messageText3)
    await sleep(150) // history calls have around 130ms of cache time

    const history = await channel.getHistory({ count: 2 })
    expect(history.messages.length).toBe(2)
    expect(history.isMore).toBeTruthy()

    const secondPage = await channel.getHistory({ startTimetoken: history.messages[0].timetoken })
    expect(secondPage.messages.length).toBeGreaterThanOrEqual(1)
  })

  test("should fail when trying to send a message to a non-existent channel", async () => {
    const nonExistentChannel = (await chat.getChannel("non-existing-channel")) as Channel

    try {
      await nonExistentChannel.sendText("Test message")
      fail("Should have thrown an error")
    } catch (error) {
      expect(error).toBeInstanceOf(Error)
    }
  })

  test("should fail when trying to send a message to a deleted channel", async () => {
    await channel.delete()

    try {
      await channel.sendText("Test message")
      fail("Should have thrown an error")
    } catch (error) {
      expect(error).toBeInstanceOf(Error)
    }
  })

  test("should fail when trying to get history of a deleted channel", async () => {
    await channel.delete()

    try {
      await channel.getHistory()
      fail("Should have thrown an error")
    } catch (error) {
      expect(error).toBeInstanceOf(Error)
    }
  })

  test("should edit membership metadata", async () => {
    const membership = await channel.join(() => null)
    const updatedMembership = await membership.update({
      custom: { role: "admin" },
    })
    expect(updatedMembership.custom?.role).toBe("admin")

    await channel.leave()
  })

  test("should create direct conversation and send message", async () => {
    const user = await createRandomUser()
    expect(user).toBeDefined()

    const directConversation = await chat.createDirectConversation({
      user,
      channelData: { name: "Test Convo" },
    })
    expect(directConversation).toBeDefined()

    const messageText = "Hello from User1"
    await directConversation.channel.sendText(messageText)
    await sleep(150) // history calls have around 130ms of cache time
    const history = await directConversation.channel.getHistory()
    const messageInHistory = history.messages.some(
      (message: Message) => message.content.text === messageText
    )
    expect(messageInHistory).toBeTruthy()
    await user.delete()
  })

  test("should create a thread", async () => {
    const messageText = "Test message"
    await channel.sendText(messageText)
    await sleep(150) // history calls have around 130ms of cache time

    let history = await channel.getHistory()
    let sentMessage = history.messages[0]
    expect(sentMessage.hasThread).toBe(false)

    await sentMessage.createThread()

    history = await channel.getHistory()
    sentMessage = history.messages[0]
    expect(sentMessage.hasThread).toBe(true)

    const thread = await sentMessage.getThread()
    const threadText = "Whatever text"
    await thread.sendText(threadText)
    await sleep(150) // history calls have around 130ms of cache time
    const threadMessages = await thread.getHistory()
    expect(threadMessages.messages.some((message) => message.text === threadText)).toBe(true)
  })

  test("should stream channel updates and invoke the callback", async () => {
    let updatedChannel
    const name = "Updated Channel"
    const callback = jest.fn((chanel) => (updatedChannel = chanel))

    const stopUpdates = channel.streamUpdates(callback)
    await channel.update({ name })
    await sleep(150)

    expect(callback).toHaveBeenCalled()
    expect(callback).toHaveBeenCalledWith(updatedChannel)
    expect(updatedChannel.name).toEqual(name)

    stopUpdates()
  })

  test("should stream membership updates and invoke the callback", async () => {
    const membership = await channel.join(() => null)
    expect(membership).toBeDefined()

    let updatedMembership
    const role = "admin"
    const callback = jest.fn((membership) => (updatedMembership = membership))

    const stopUpdates = membership.streamUpdates(callback)
    await membership.update({ custom: { role } })
    await sleep(150)

    expect(callback).toHaveBeenCalled()
    expect(callback).toHaveBeenCalledWith(updatedMembership)
    expect(updatedMembership.custom.role).toEqual(role)

    await channel.leave()
    stopUpdates()
  })

  test("should get unread messages count", async () => {
    const messageText1 = "Test message 1"
    const messageText2 = "Test message 2"

    await channel.sendText(messageText1)
    await channel.sendText(messageText2)
    await sleep(150) // history calls have around 130ms of cache time

    let membership = await channel.join(() => null)
    let unreadCount = await membership.getUnreadMessagesCount()
    expect(unreadCount).toBe(false)

    const { messages } = await channel.getHistory()
    membership = await membership.setLastReadMessage(messages[0])
    unreadCount = await membership.getUnreadMessagesCount()
    expect(unreadCount).toBe(1)

    await channel.leave()
  })

  test("should mention users in a message and validate mentioned users", async () => {
    const user1Id = `user1_${Date.now()}`
    const user1 = await chat.createUser(user1Id, { name: "User 1" })

    const user2Id = `user2_${Date.now()}`
    const user2 = await chat.createUser(user2Id, { name: "User 2" })

    const messageText = `Hello, @${user1.id} and @${user2.id} here is my mail test@pubnub.com`
    await channel.sendText(messageText)
    await sleep(150) // history calls have around 130ms of cache time

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

  test.only("should mention users with multi-word names in a message and validate mentioned users", async () => {
    // jest.retryTimes(3)

    const user1Id = `user1_${Date.now()}`
    const user1 = await chat.createUser(user1Id, { name: "User One" })

    const user2Id = `user2_${Date.now()}`
    const user2 = await chat.createUser(user2Id, { name: "User Two" })

    const messageText = `Hello, @${user1.name} and @${user2.name} here is my mail test@pubnub.com`

    await messageDraft.onChange("Hello, @User One")
    messageDraft.addMentionedUser(user1, 0)
    await messageDraft.onChange(" and @User Two")
    messageDraft.addMentionedUser(user2, 1)
    await messageDraft.onChange(" here is my mail test@pubnub.com")

    await messageDraft.send()
    await sleep(150) // history calls have around 130ms of cache time

    const history = await channel.getHistory()
    console.log("history", history.messages[0].content)

    const messageInHistory = history.messages.find(
      (message: any) => message.content.text === messageText
    )

    expect(messageInHistory).toBeDefined()

    console.log("mentioned users: ", messageInHistory.mentionedUsers)

    const mentionedUserNames = extractMentionedUserNames(messageText)

    const mentionedUsers = [user1, user2].filter(
      (user) => user.name && mentionedUserNames.includes(user.name)
    )

    expect(mentionedUsers.length).toBe(2)
    expect(mentionedUsers[0].name).toBe("User One")
    expect(mentionedUsers[1].name).toBe("User Two")

    await chat.deleteUser(user1.id)
    await chat.deleteUser(user2.id)
  })

  test("should send a message with words that start with @ but are not user mentions", async () => {
    jest.retryTimes(3)

    const messageText =
      "Hello, this is a test message with words that start with @ but are not user mentions: @test, @example, @check."

    await channel.sendText(messageText)
    await sleep(150) // history calls have around 130ms of cache time

    const history = await channel.getHistory()

    const messageInHistory = history.messages.find(
      (message: any) => message.content.text === messageText
    )

    expect(messageInHistory).toBeDefined()

    const mentionedUserNames = extractMentionedUserNames(messageText)

    expect(mentionedUserNames.length).toBe(0)
  })

  test("should mention users with incorrect usernames and validate no users are mentioned", async () => {
    jest.retryTimes(3)

    const user1Id = `user1_${Date.now()}`
    const user1 = await chat.createUser(user1Id, { name: "User One" })

    const incorrectUserId = user1Id.substring(0, user1Id.length - 1)

    const messageText = `Hello, @${incorrectUserId}, I tried to mention you`

    await channel.sendText(messageText)
    await sleep(150) // history calls have around 130ms of cache time

    const history = await channel.getHistory()

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

    const user1Id = `user1_${Date.now()}`
    const user1 = await chat.createUser(user1Id, { name: "User 1" })

    const user2Id = `user2_${Date.now()}`
    const user2 = await chat.createUser(user2Id, { name: "User 2" })

    await channel.invite(user1)

    const membersResponse = await channel.getMembers()
    const members = membersResponse.members
    expect(members.some((member: Membership) => member.user.id === user1.id)).toBeTruthy()
    expect(members.some((member: Membership) => member.user.id === user2.id)).toBeFalsy()

    const messageText = `Hello, @${user1.id} and @${user2.id} here is my mail test@pubnub.com`

    await channel.sendText(messageText)
    await sleep(150) // history calls have around 130ms of cache time

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

  test("should mention the same user multiple times in a message and validate mentioned users", async () => {
    jest.retryTimes(3)

    const user1Id = `user1_${Date.now()}`
    const user1 = await chat.createUser(user1Id, { name: "User 1" })

    const messageText = `Hello, @${user1.id}, how are you? @${user1.id}, are you there?`

    await channel.sendText(messageText)
    await sleep(150) // history calls have around 130ms of cache time

    const history = await channel.getHistory()

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

  test("should correctly add and remove mentioned user", async () => {
    jest.retryTimes(3)

    const user1Id = `user1_${Date.now()}`
    const user1 = await chat.createUser(user1Id, { name: "User 1" })

    const messageDraft = new MessageDraft(chat, channel)
    messageDraft.value = `Hello, @${user1Id}, how are you? @${user1Id}, are you there?`

    messageDraft.addMentionedUser(user1, 1)

    const expectedMessage = `Hello, @${user1Id}, how are you? @User 1 are you there?`
    expect(messageDraft.value).toEqual(expectedMessage)

    expect(messageDraft.mentionedUsers[1]).toEqual(user1)

    messageDraft.removeMentionedUser(1)

    expect(messageDraft.mentionedUsers[0]).toBeUndefined()

    expect(messageDraft.value).toEqual(expectedMessage)

    await chat.deleteUser(user1.id)
  })

  test("should mention user in a message and validate cache", async () => {
    jest.retryTimes(3)

    const user1Id = `user1_${Date.now()}`
    const user1 = await chat.createUser(user1Id, { name: "User 1" })

    const messageText = `Hello, @${user1.id}, how are you? @${user1.id}, are you there?`

    const getUserSpy = jest.spyOn(chat, "getUser")

    await channel.sendText(messageText)
    await sleep(150) // history calls have around 130ms of cache time

    const history = await channel.getHistory()

    const messageInHistory = history.messages.find(
      (message: any) => message.content.text === messageText
    )

    expect(messageInHistory).toBeDefined()

    const mentionedUserIds = extractMentionedUserIds(messageText)
    const mentionedUsers = [user1].filter((user) => mentionedUserIds.includes(user.id))

    expect(mentionedUsers.length).toBe(1)
    expect(mentionedUsers[0].id).toBe(user1.id)

    expect(getUserSpy).toHaveBeenCalled()

    expect(getUserSpy).toHaveBeenCalledTimes(1)

    await chat.deleteUser(user1.id)
  })

  jest.retryTimes(3)
})
