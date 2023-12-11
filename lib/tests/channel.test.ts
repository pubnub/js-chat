import { Channel, Message, Chat, MessageDraft } from "../src"
import {
  sleep,
  extractMentionedUserIds,
  createRandomUser,
  createRandomChannel,
  createChatInstance,
  sendMessageAndWaitForHistory,
  makeid,
} from "./utils"

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
    jest.clearAllMocks()
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
    const { membership } = await channel.join(() => null)
    const updatedMembership = await membership.update({
      custom: { role: "admin" },
    })
    expect(updatedMembership.custom?.role).toBe("admin")

    await channel.leave()
  })

  test("should create a direct, group and public chats with a predefined ID", async () => {
    const someFakeDirectId = "someFakeDirectId"
    const someFakeGroupId = "someFakeGroupId"
    const someFakePublicId = "someFakePublicId"

    const existingChannels = await Promise.all(
      [someFakeDirectId, someFakeGroupId, someFakePublicId].map((id) => chat.getChannel(id))
    )

    for (const existingChannel of existingChannels) {
      if (existingChannel) {
        await existingChannel.delete({ soft: false })
      }
    }

    const user = await createRandomUser()

    const newChannels = await Promise.all([
      chat.createDirectConversation({
        user,
        channelId: someFakeDirectId,
        channelData: {},
      }),
      chat.createGroupConversation({
        users: [user],
        channelId: someFakeGroupId,
        channelData: {},
      }),
      chat.createPublicConversation({
        channelId: someFakePublicId,
        channelData: {},
      }),
    ])

    expect(newChannels[0].channel.id).toBe(someFakeDirectId)
    expect(newChannels[1].channel.id).toBe(someFakeGroupId)
    expect(newChannels[2].id).toBe(someFakePublicId)

    await newChannels[0].channel.delete({ soft: false })
    await newChannels[1].channel.delete({ soft: false })
    await newChannels[2].delete({ soft: false })
  })

  test("should create a direct, group and public chats with default IDs", async () => {
    const user = await createRandomUser()

    const newChannels = await Promise.all([
      chat.createDirectConversation({
        user,
        channelData: {},
      }),
      chat.createGroupConversation({
        users: [user],
        channelData: {},
      }),
      chat.createPublicConversation({
        channelData: {},
      }),
    ])

    expect(newChannels[0].channel.id.startsWith("direct.")).toBeTruthy()
    expect(newChannels[1].channel.id).toBeDefined()
    expect(newChannels[2].id).toBeDefined()

    await newChannels[0].channel.delete({ soft: false })
    await newChannels[1].channel.delete({ soft: false })
    await newChannels[2].delete({ soft: false })
  })

  test("should create direct conversation and send message", async () => {
    const user = await createRandomUser()
    expect(user).toBeDefined()
    const inviteCallback = jest.fn()

    const removeInvitationListener = chat.listenForEvents({
      channel: user.id,
      type: "invite",
      callback: inviteCallback,
    })

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
    expect(inviteCallback).toHaveBeenCalledTimes(1)
    expect(inviteCallback).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: {
          channelType: "direct",
          channelId: directConversation.channel.id,
        },
      })
    )
    await user.delete()
    removeInvitationListener()
  })

  test("should create group conversation", async () => {
    const [user1, user2, user3] = await Promise.all([
      createRandomUser(),
      createRandomUser(),
      createRandomUser(),
    ])
    const inviteCallback = jest.fn()

    const removeInvitationListener = chat.listenForEvents({
      channel: user1.id,
      type: "invite",
      callback: inviteCallback,
    })

    const channelId = "group_channel_1234"
    const channelData = {
      name: "Test Group Channel",
      description: "This is a test group channel.",
      custom: {
        groupInfo: "Additional group information",
      },
    }

    const membershipData = {
      custom: {
        role: "member",
      },
    }

    const result = await chat.createGroupConversation({
      users: [user1, user2, user3],
      channelId,
      channelData,
      membershipData,
    })

    const { channel, hostMembership, inviteesMemberships } = result

    expect(channel).toBeDefined()
    expect(hostMembership).toBeDefined()
    expect(inviteesMemberships).toBeDefined()
    expect(channel.name).toEqual("Test Group Channel")
    expect(channel.description).toEqual("This is a test group channel.")
    expect(channel.custom.groupInfo).toEqual("Additional group information")
    expect(inviteesMemberships.length).toEqual(3)
    await sleep(150) // history calls have around 130ms of cache time
    expect(inviteCallback).toHaveBeenCalledTimes(1)
    expect(inviteCallback).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: {
          channelType: "group",
          channelId: result.channel.id,
        },
      })
    )

    await Promise.all([
      user1.delete(),
      user2.delete(),
      user3.delete(),
      channel.delete({ soft: false }),
    ])
    removeInvitationListener()
  })

  test("should create a thread", async () => {
    const messageText = "Test message"
    await channel.sendText(messageText)
    await sleep(150) // history calls have around 130ms of cache time

    let history = await channel.getHistory()
    let sentMessage = history.messages[0]
    expect(sentMessage.hasThread).toBe(false)

    const threadDraft = await sentMessage.createThread()

    await threadDraft.sendText("Some random text in a thread")

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

  test("should not be able to create an empty Thread without any message", async () => {
    let errorOccurred = false
    try {
      await channel.createThread()
    } catch (error) {
      errorOccurred = true

      //Should to be clarified
      // expect(error.message).toBe("Cannot create an empty thread")
    }

    expect(errorOccurred).toBe(true)
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
    const { membership } = await channel.join(() => null)
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

    let { membership } = await channel.join(() => null)
    let unreadCount = await membership.getUnreadMessagesCount()
    expect(unreadCount).toBe(0)

    const { messages } = await channel.getHistory()
    membership = await membership.setLastReadMessageTimetoken(messages[0].timetoken)
    unreadCount = await membership.getUnreadMessagesCount()
    expect(unreadCount).toBe(1)

    await channel.leave()
  })

  test("should mention users in a message and validate mentioned users", async () => {
    const user1Id = `user1_${Date.now()}`
    const user1 = await chat.createUser(user1Id, { name: "User1" })

    const user2Id = `user2_${Date.now()}`
    const user2 = await chat.createUser(user2Id, { name: "User2" })

    const messageText = `Hello, @${user1.name} and @${user2.name} here is my mail test@pubnub.com`

    await messageDraft.onChange("Hello, @Use")
    messageDraft.addMentionedUser(user1, 0)
    await messageDraft.onChange(`Hello, @${user1.name} and @Use`)
    messageDraft.addMentionedUser(user2, 1)
    await messageDraft.onChange(
      `Hello, @${user1.name} and @${user2.name} here is my mail test@pubnub.com`
    )

    await messageDraft.send()
    await sleep(150) // history calls have around 130ms of cache time

    const history = await channel.getHistory()

    const messageInHistory = history.messages.find(
      (message: any) => message.content.text === messageText
    )

    expect(messageInHistory).toBeDefined()

    expect(Object.keys(messageInHistory.mentionedUsers).length).toBe(2)
    expect(messageInHistory.mentionedUsers["0"].id).toEqual(user1.id)
    expect(messageInHistory.mentionedUsers["1"].id).toEqual(user2.id)

    const extractedNamesFromText = extractMentionedUserIds(messageText)
    expect(messageInHistory.mentionedUsers["0"].name).toEqual(extractedNamesFromText[0])
    expect(messageInHistory.mentionedUsers["1"].name).toEqual(extractedNamesFromText[1])

    await chat.deleteUser(user1.id)
    await chat.deleteUser(user2.id)
  })

  test("should mention users with multi-word names in a message and validate mentioned users", async () => {
    jest.retryTimes(3)

    const user1Id = `user1_${Date.now()}`
    const user1 = await chat.createUser(user1Id, { name: "User One" })

    const user2Id = `user2_${Date.now()}`
    const user2 = await chat.createUser(user2Id, { name: "User Two" })

    const messageText = `Hello, @${user1.name} and @${user2.name} here is my mail test@pubnub.com`

    await messageDraft.onChange("Hello, @Use")
    messageDraft.addMentionedUser(user1, 0)
    await messageDraft.onChange(`Hello, @${user1.name} and @Use`)
    messageDraft.addMentionedUser(user2, 1)
    await messageDraft.onChange(
      `Hello, @${user1.name} and @${user2.name} here is my mail test@pubnub.com`
    )

    await messageDraft.send()
    await sleep(150) // history calls have around 130ms of cache time

    const history = await channel.getHistory()

    const messageInHistory = history.messages.find(
      (message: any) => message.content.text === messageText
    )

    expect(messageInHistory).toBeDefined()

    expect(Object.keys(messageInHistory.mentionedUsers).length).toBe(2)
    expect(messageInHistory.mentionedUsers["0"].id).toEqual(user1.id)
    expect(messageInHistory.mentionedUsers["1"].id).toEqual(user2.id)

    await chat.deleteUser(user1.id)
    await chat.deleteUser(user2.id)
  })

  test("should send a message with words that start with @ but are not user mentions", async () => {
    jest.retryTimes(3)

    const messageText =
      "Hello, this is a test message with words that start with @ but are not user mentions: @test, @example, @check."

    const messageInHistory = await sendMessageAndWaitForHistory(
      channel.createMessageDraft(messageText),
      channel
    )

    expect(messageInHistory).toBeDefined()

    expect(Object.keys(messageInHistory.mentionedUsers).length).toBe(0)
  })

  test("should try to mention users with incorrect usernames and validate no users are mentioned", async () => {
    jest.retryTimes(3)

    const user1Id = `user1_${Date.now()}`
    const user1 = await chat.createUser(user1Id, { name: "User One" })

    const incorrectUserId = user1Id.substring(0, user1Id.length - 1)

    await messageDraft.onChange("Hello, @Use")
    messageDraft.addMentionedUser(user1, 0)
    await messageDraft.onChange(`Hello, @${user1.name}, I tried to mention you`)
    const finalMessageTextToSend = `Hello, @${incorrectUserId}, I tried to mention you`
    await messageDraft.onChange(finalMessageTextToSend)

    const messageInHistory = await sendMessageAndWaitForHistory(messageDraft, channel)

    expect(messageInHistory).toBeDefined()

    expect(Object.keys(messageInHistory.mentionedUsers).length).toBe(0)

    await chat.deleteUser(user1.id)
  })

  test("should suggest global users who are not members of the channel", async () => {
    jest.retryTimes(3)

    const user1Id = `user1_${Date.now()}`
    const user1 = await chat.createUser(user1Id, { name: "User 1" })

    const user2Id = `user2_${Date.now()}`
    const user2 = await chat.createUser(user2Id, { name: "User 2" })

    await channel.invite(user1)

    messageDraft = channel.createMessageDraft({ userSuggestionSource: "global", userLimit: 100 })

    const originalGetUserSuggestions = Chat.prototype.getUserSuggestions
    const getUserSuggestionsSpy = jest.spyOn(Chat.prototype, "getUserSuggestions")

    getUserSuggestionsSpy.mockImplementation(originalGetUserSuggestions)

    const onChangeResponse = await messageDraft.onChange("Hello, @Use")

    // verification that users inside the keyset were suggested
    expect(getUserSuggestionsSpy).toHaveBeenCalledTimes(1)

    const foundUser1AmongSuggestedUsers = onChangeResponse.users.suggestedUsers.find(
      (suggestedUser) => suggestedUser.id === user1.id
    )

    expect(foundUser1AmongSuggestedUsers).toBeTruthy()
    // get members of the channel and verify if user that is member of channel exists in keyset
    const membersResponse = await channel.getMembers()
    const members = membersResponse.members
    expect(
      onChangeResponse.users.suggestedUsers.some(
        (suggestedUser) => !members.includes(suggestedUser.id)
      )
    ).toBeTruthy()

    await chat.deleteUser(user1.id)
    await chat.deleteUser(user2.id)
  })

  test("should mention the same user multiple times in a message and validate mentioned users", async () => {
    jest.retryTimes(3)

    const user1Id = `user1_${Date.now()}`
    const user1 = await chat.createUser(user1Id, { name: "User 1" })

    const messageText = `Hello, @${user1.name}, how are you? @${user1.name}, are you there?`

    await messageDraft.onChange("Hello, @Use")
    messageDraft.addMentionedUser(user1, 0)
    await messageDraft.onChange(`Hello, @${user1.name}, how are you? @Use`)
    messageDraft.addMentionedUser(user1, 1)
    await messageDraft.onChange(messageText)

    const messageInHistory = await sendMessageAndWaitForHistory(messageDraft, channel)

    expect(messageInHistory).toBeDefined()

    expect(Object.keys(messageInHistory.mentionedUsers).length).toBe(2)
    expect(messageInHistory.mentionedUsers["0"].id).toEqual(user1.id)
    expect(messageInHistory.mentionedUsers["1"].id).toEqual(user1.id)

    await chat.deleteUser(user1.id)
  })

  test("should correctly add and remove mentioned user", async () => {
    jest.retryTimes(3)

    const user1Id = `user1_${Date.now()}`
    const user1 = await chat.createUser(user1Id, { name: "User 1" })
    const user2Id = `user2_${Date.now()}`
    const user2 = await chat.createUser(user2Id, { name: "User 2" })

    const messageDraft = channel.createMessageDraft()

    const originalMessage = `Hello, @${user1.name}, how are you? @${user2.name}, are you there?`
    await messageDraft.onChange("Hello, @Use")
    messageDraft.addMentionedUser(user1, 0)
    await messageDraft.onChange(`Hello, @${user1.name}, how are you? @Use`)
    messageDraft.addMentionedUser(user2, 1)
    await messageDraft.onChange(originalMessage)

    const expectedMessage = `Hello, @${user1.name}, how are you? @User 2, are you there?`

    expect(messageDraft.value).toEqual(expectedMessage)

    messageDraft.removeMentionedUser(1)

    const messageInHistory = await sendMessageAndWaitForHistory(messageDraft, channel)

    expect(messageInHistory).toBeDefined()

    expect(Object.keys(messageInHistory.mentionedUsers).length).toBe(1)
    expect(messageInHistory.mentionedUsers["0"].id).toBe(user1.id)

    await chat.deleteUser(user1.id)
  })

  test("should correctly add and remove the middle mentioned user", async () => {
    jest.retryTimes(3)

    const user1Id = `user1_${Date.now()}`
    const user1 = await chat.createUser(user1Id, { name: "User 1" })
    const user2Id = `user2_${Date.now()}`
    const user2 = await chat.createUser(user2Id, { name: "User 2" })
    const user3Id = `user3_${Date.now()}`
    const user3 = await chat.createUser(user3Id, { name: "User 3" })

    const messageDraft = channel.createMessageDraft()

    await messageDraft.onChange("Hello, @Use")
    messageDraft.addMentionedUser(user1, 0)
    await messageDraft.onChange(`Hello, @${user1.name}, how are you? @Use`)
    messageDraft.addMentionedUser(user2, 1)
    await messageDraft.onChange(
      `Hello, @${user1.name}, how are you? @${user2.name}, are you there? Test: @Use`
    )
    messageDraft.addMentionedUser(user3, 2)

    const expectedMessage = `Hello, @${user1.name}, how are you? @User 2, are you there? Test: @${user3.name}`

    expect(messageDraft.value).toEqual(expectedMessage)

    messageDraft.removeMentionedUser(1)

    const messageInHistory = await sendMessageAndWaitForHistory(messageDraft, channel)

    expect(messageInHistory).toBeDefined()

    expect(Object.keys(messageInHistory.mentionedUsers).length).toBe(2)
    expect(messageInHistory.mentionedUsers["0"].id).toBe(user1.id)
    expect(messageInHistory.mentionedUsers["1"]).toBeUndefined()
    expect(messageInHistory.mentionedUsers["2"].id).toBe(user3.id)

    await chat.deleteUser(user1.id)
    await chat.deleteUser(user2.id)
    await chat.deleteUser(user3.id)
  })

  test.skip("should mention user in a message and validate cache", async () => {
    jest.retryTimes(3)

    const user1Id = `user1_${Date.now()}`
    const user1 = await chat.createUser(user1Id, { name: "User 1" })

    messageDraft = channel.createMessageDraft({ userSuggestionSource: "global" })

    const originalGetUsers = Chat.prototype.getUsers
    const getUsersSpy = jest.spyOn(Chat.prototype, "getUsers")
    getUsersSpy.mockImplementation(originalGetUsers)

    await messageDraft.onChange("Hello, @Use")
    await messageDraft.onChange("Hello, @User")
    await messageDraft.onChange("Hello, @Use")
    await messageDraft.onChange("Hello, @User")
    expect(getUsersSpy).toHaveBeenCalledTimes(2)

    await chat.deleteUser(user1.id)
  })

  test("should add and remove a quote", async () => {
    jest.retryTimes(3)

    const messageText = "Test message"
    await channel.sendText(messageText)
    await sleep(150) // history calls have around 130ms of cache time
    const history = await channel.getHistory()
    const sentMessage: Message = history.messages[0]

    messageDraft.addQuote(sentMessage)

    expect(messageDraft.quotedMessage).toEqual(sentMessage)

    messageDraft.removeQuote()

    expect(messageDraft.quotedMessage).toBeUndefined()
  })

  test("should throw an error when trying to quote a message from another channel", async () => {
    jest.retryTimes(3)

    const otherChannel = await createRandomChannel()

    try {
      const messageText = "Test message"
      await otherChannel.sendText(messageText)
      await sleep(150) // history calls have around 130ms of cache time
      const history = await otherChannel.getHistory()
      const otherMessage: Message = history.messages[0]

      messageDraft.addQuote(otherMessage)

      fail("Should have thrown an error")
    } catch (error) {
      expect(error).toEqual("You cannot quote messages from other channels")
    } finally {
      await otherChannel.delete()
    }
  })

  test("should quote multiple messages", async () => {
    const messageText1 = "Test message 1"
    const messageText2 = "Test message 2"
    const messageText3 = "Test message 3"

    await channel.sendText(messageText1)
    await channel.sendText(messageText2)
    await channel.sendText(messageText3)
    await sleep(150) // history calls have around 130ms of cache time

    const history = await channel.getHistory()

    const messageDraft = channel.createMessageDraft()

    messageDraft.addQuote(history.messages[0])

    messageDraft.addQuote(history.messages[1])

    messageDraft.addQuote(history.messages[2])

    expect(messageDraft.quotedMessage).toEqual(history.messages[2])

    messageDraft.removeQuote()
    expect(messageDraft.quotedMessage).toBeUndefined()
  })

  test("should correctly stream read receipts", async () => {
    const { membership, disconnect } = await channel.join(() => null)
    disconnect()

    const mockCallback = jest.fn()
    const stopReceipts = await channel.streamReadReceipts(mockCallback)
    expect(mockCallback).toHaveBeenCalledTimes(1)
    expect(mockCallback).toHaveBeenCalledWith({
      [membership.lastReadMessageTimetoken]: ["test-user"],
    })

    const { timetoken } = await channel.sendText("New message")
    await sleep(150) // history calls have around 130ms of cache time
    const message = await channel.getMessage(timetoken)
    await membership.setLastReadMessageTimetoken(message.timetoken)
    await sleep(150) // history calls have around 130ms of cache time

    expect(mockCallback).toHaveBeenCalledWith({ [timetoken]: ["test-user"] })

    stopReceipts()
  })

  test("should invite a user to the channel", async () => {
    const userToInvite = await createRandomUser()
    const membership = await channel.invite(userToInvite)

    expect(membership).toBeDefined()
    expect(membership.user.id).toEqual(userToInvite.id)
    expect(membership.channel.id).toEqual(channel.id)

    await userToInvite.delete()
  })

  test("should invite multiple users to the channel", async () => {
    const usersToInvite = await Promise.all([createRandomUser(), createRandomUser()])

    const invitedMemberships = await channel.inviteMultiple(usersToInvite)

    expect(invitedMemberships).toBeDefined()

    invitedMemberships.forEach((membership, index) => {
      const invitedUser = usersToInvite[index]
      expect(membership.user.id).toEqual(invitedUser.id)
      expect(membership.channel.id).toEqual(channel.id)
    })

    await Promise.all(usersToInvite.map((user) => user.delete()))
  })

  test("should verify if user is a member of a channel", async () => {
    const user = await createRandomUser()
    const channel = await createRandomChannel()

    const membership = await channel.invite(user)

    const membersData = await channel.getMembers()

    expect(membership).toBeDefined()
    expect(membersData.members.find((member) => member.user.id === user.id)).toBeTruthy()

    await user.delete()
  })

  test("should verify if user is online on a channel", async () => {
    const chat2 = await createChatInstance({
      userId: "user-one",
      shouldCreateNewInstance: true,
    })

    const channel = await chat2.createChannel(`channel_${makeid()}`, {
      name: "Test Channel",
      description: "This is a test channel",
    })
    const disconnect = channel.connect(() => null)
    // wait till PN decides this user is online
    await sleep(2000)

    expect(await chat2.currentUser.isPresentOn(channel.id)).toBe(true)
    expect(await channel.isPresent(chat2.currentUser.id)).toBe(true)
    expect(await chat2.isPresent(chat2.currentUser.id, channel.id)).toBe(true)
    expect(await chat2.whoIsPresent(channel.id)).toContain(chat2.currentUser.id)

    disconnect()
    await sleep(2000)
    expect(await chat2.currentUser.isPresentOn(channel.id)).toBe(false)

    const usedUser = await chat2.getUser("user-one")

    if (usedUser) {
      await usedUser.delete()
    }
  })

  test("should verify all user-related mentions using getCurrentUserMentions()", async () => {
    const user1Id = `user1_${Date.now()}`
    const user1 = await chat.createUser(user1Id, { name: "User1" })

    const user2Id = `user2_${Date.now()}`
    const user2 = await chat.createUser(user2Id, { name: "User2" })

    const messageText = `Hello, @${user1.name} and @${user2.name} here is a test mention`
    await messageDraft.onChange("Hello, @Use")
    messageDraft.addMentionedUser(user1, 0)
    await messageDraft.onChange(`Hello, @${user1.name} and @Use`)
    messageDraft.addMentionedUser(user2, 1)
    await messageDraft.onChange(messageText)
    await messageDraft.send()

    await sleep(150) // history calls have around 130ms of cache time

    const mentionsResult = await chat.getCurrentUserMentions({ count: 10 })

    expect(mentionsResult).toBeDefined()

    await chat.deleteUser(user1.id)
    await chat.deleteUser(user2.id)
  })

  test("Should fail when trying to edit membership metadata of a non-existent channel", async () => {
    const nonExistentChannelId = "nonexistentchannelid"

    try {
      const nonExistentChannel = await chat.getChannel(nonExistentChannelId)
      const membership = await nonExistentChannel.join(() => null)
      await membership.update({ custom: { role: "admin" } })
      fail("Editing membership metadata of a non-existent channel should fail")
    } catch (error) {
      expect(error.message).toContain("Cannot read properties of null (reading 'join')")
    }
  })

  test("Should create direct conversation, edit, and delete a message", async () => {
    const user1 = await createRandomUser()

    const directConversation = await chat.createDirectConversation({
      user: user1,
      channelData: { name: "Test Convo" },
    })

    const messageText = "Hello from User1"
    await directConversation.channel.sendText(messageText)

    await sleep(150)

    const history = await directConversation.channel.getHistory()
    const sentMessage = history.messages.find((message) => message.content.text === messageText)

    const editedMessageText = "Edited message from User1"
    const editedMessage = await sentMessage.editText(editedMessageText)

    expect(editedMessage.text).toEqual(editedMessageText)

    const deletionResult = await editedMessage.delete()

    expect(deletionResult).toBe(true)

    await user1.delete()
  })

  test("should create, reply to, and delete a thread", async () => {
    const messageText = "Test message for thread creation"
    await channel.sendText(messageText)
    await sleep(150) // history calls have around 130ms of cache time

    let history = await channel.getHistory()
    let sentMessage = history.messages[0]
    expect(sentMessage.hasThread).toBe(false)

    const threadDraft = await sentMessage.createThread()
    await threadDraft.sendText("Initial message in the thread")
    history = await channel.getHistory()
    sentMessage = history.messages[0]
    expect(sentMessage.hasThread).toBe(true)

    const thread = await sentMessage.getThread()
    const replyText = "Replying to the thread"
    await thread.sendText(replyText)
    await sleep(150) // history calls have around 130ms of cache time
    const threadMessages = await thread.getHistory()
    expect(threadMessages.messages.some((message) => message.text === replyText)).toBe(true)

    await sentMessage.removeThread()
    history = await channel.getHistory()
    sentMessage = history.messages[0]
    expect(sentMessage.hasThread).toBe(false)
  })

  test("should create, reply to, delete a thread, and recreate the deleted thread", async () => {
    const messageText = "Test message for thread recreation"
    await channel.sendText(messageText)
    await sleep(150) // history calls have around 130ms of cache time

    let history = await channel.getHistory()
    let sentMessage = history.messages[0]
    expect(sentMessage.hasThread).toBe(false)

    let threadDraft = await sentMessage.createThread()
    await threadDraft.sendText("Initial message in the thread")
    history = await channel.getHistory()
    sentMessage = history.messages[0]
    expect(sentMessage.hasThread).toBe(true)

    const thread = await sentMessage.getThread()
    const replyText = "Replying to the thread"
    await thread.sendText(replyText)
    await sleep(150) // history calls have around 130ms of cache time
    let threadMessages = await thread.getHistory()
    expect(threadMessages.messages.some((message) => message.text === replyText)).toBe(true)

    await sentMessage.removeThread()
    history = await channel.getHistory()
    sentMessage = history.messages[0]
    expect(sentMessage.hasThread).toBe(false)

    threadDraft = await sentMessage.createThread()
    await threadDraft.sendText("Recreated thread after deletion")
    history = await channel.getHistory()
    sentMessage = history.messages[0]
    expect(sentMessage.hasThread).toBe(true)

    const newReplyText = "Replying to the recreated thread"
    await thread.sendText(newReplyText)
    await sleep(150)
    threadMessages = await thread.getHistory()
    expect(threadMessages.messages.some((message) => message.text === newReplyText)).toBe(true)
  })

  test("Should mention users with special characters in their names and validate mentioned users", async () => {
    const specialChar1 = ":-)"
    const specialChar2 = "V$$ap_}><{"

    const user1Id = `user1_${Date.now()}`
    const user2Id = `user2_${Date.now()}`

    const user1 = await chat.createUser(user1Id, { name: `User${specialChar1}1` })
    const user2 = await chat.createUser(user2Id, { name: `User${specialChar2}2` })

    const messageText = `Hello, @${user1.name} and @${user2.name} here is my mail test@pubnub.com`

    await messageDraft.onChange("Hello, @Use")
    messageDraft.addMentionedUser(user1, 0)
    await messageDraft.onChange(`Hello, @${user1.name} and @Use`)
    messageDraft.addMentionedUser(user2, 1)
    await messageDraft.onChange(
      `Hello, @${user1.name} and @${user2.name} here is my mail test@pubnub.com`
    )

    await messageDraft.send()
    await sleep(150) // Wait for the message to be sent and cached

    const history = await channel.getHistory()

    const messageInHistory = history.messages.find(
      (message: any) => message.content.text === messageText
    )

    expect(messageInHistory).toBeDefined()

    expect(Object.keys(messageInHistory.mentionedUsers).length).toBe(2)
    expect(messageInHistory.mentionedUsers["0"].id).toEqual(user1.id)
    expect(messageInHistory.mentionedUsers["1"].id).toEqual(user2.id)

    await chat.deleteUser(user1.id)
    await chat.deleteUser(user2.id)
  })

  test("should create a group chat channel", async () => {
    const user1 = await createRandomUser()
    const user2 = await createRandomUser()
    const user3 = await createRandomUser()

    const channelId = "tg5984fd"
    const channelData = {
      name: "Group Chat Channel",
      description: "A channel for team collaboration",
      custom: {
        key: "value",
      },
    }

    const { channel, hostMembership, inviteesMemberships } = await chat.createGroupConversation({
      users: [user1, user2, user3],
      channelId,
      channelData,
    })

    expect(channel).toBeDefined()
    expect(channel.name).toEqual(channelData.name)
    expect(channel.description).toEqual(channelData.description)

    expect(hostMembership).toBeDefined()

    expect(inviteesMemberships).toBeDefined()
    expect(inviteesMemberships.length).toBe(3)

    expect(channel.custom).toEqual(channelData.custom)

    await channel.delete()
    await chat.deleteUser(user1.id)
    await chat.deleteUser(user2.id)
    await chat.deleteUser(user3.id)
  })

  test("should create a public chat channel", async () => {
    const channelData = {
      name: "Public Chat Channel",
      description: "A channel for open conversations",
      custom: {
        key: "value",
      },
    }

    const publicChannel = await chat.createPublicConversation({
      channelId: "public-channel-1",
      channelData,
    })

    expect(publicChannel).toBeDefined()
    expect(publicChannel.name).toEqual(channelData.name)
    expect(publicChannel.description).toEqual(channelData.description)

    expect(publicChannel.custom).toEqual(channelData.custom)

    await publicChannel.delete()
  })

  test("should set (or lift) restrictions on a user", async () => {
    const moderationEventCallback = jest.fn()

    const removeModerationListener = chat.listenForEvents({
      channel: chat.currentUser.id,
      type: "moderation",
      callback: moderationEventCallback,
    })

    await chat.setRestrictions(chat.currentUser.id, "some-channel", { mute: true })
    await sleep(150) // Wait for the message to be sent and cached
    expect(moderationEventCallback).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: {
          channelId: "PUBNUB_INTERNAL_MODERATION_some-channel",
          restriction: "muted",
        },
      })
    )
    moderationEventCallback.mockReset()

    await chat.setRestrictions(chat.currentUser.id, "some-channel", { ban: true })
    await sleep(150) // Wait for the message to be sent and cached
    expect(moderationEventCallback).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: {
          channelId: "PUBNUB_INTERNAL_MODERATION_some-channel",
          restriction: "banned",
        },
      })
    )
    moderationEventCallback.mockReset()

    await chat.setRestrictions(chat.currentUser.id, "some-channel", { ban: true, mute: true })
    await sleep(150) // Wait for the message to be sent and cached
    expect(moderationEventCallback).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: {
          channelId: "PUBNUB_INTERNAL_MODERATION_some-channel",
          restriction: "banned",
        },
      })
    )
    moderationEventCallback.mockReset()

    await chat.setRestrictions(chat.currentUser.id, "some-channel", {})
    await sleep(150) // Wait for the message to be sent and cached
    expect(moderationEventCallback).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: {
          channelId: "PUBNUB_INTERNAL_MODERATION_some-channel",
          restriction: "lifted",
        },
      })
    )

    removeModerationListener()
  })
})
