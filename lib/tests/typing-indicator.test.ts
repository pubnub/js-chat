import { Channel, Chat } from "../src"
import { createChatInstance, createRandomChannel, createRandomUser, sleep } from "./utils"

describe("Typing indicator test", () => {
  jest.retryTimes(3)

  let channel: Channel
  let chat: Chat

  beforeAll(async () => {
    chat = await createChatInstance()
  })

  beforeEach(async () => {
    channel = await createRandomChannel()
  })

  test("should call the callback with the typing value when a typing signal is received", async () => {
    const callback = jest.fn()

    const unsubscribe = await channel?.getTyping(callback)
    await channel?.startTyping()
    await sleep(2000)

    expect(callback).toHaveBeenCalledWith(["test-user"])

    unsubscribe()
  })

  test("should not call the callback when no typing signal is received", async () => {
    const callback = jest.fn()

    const unsubscribe = await channel?.getTyping(callback)
    await sleep(2000)

    expect(callback).not.toHaveBeenCalled()

    unsubscribe()
  })
  //to be clarified regarding chat instance issue
  test("should handle multiple simultaneous typing signals from different users", async () => {
    const callback = jest.fn()

    const unsubscribe = await channel?.getTyping(callback)
    await channel?.startTyping()
    await sleep(2000)

    expect(callback).toHaveBeenCalledWith(["test-user"])

    unsubscribe()
  })
  //to be clarified regarding chat instance issue
  test("should not call the callback when the typing signal is from the same user as the recipient", async () => {
    const callback = jest.fn()

    const unsubscribe = await channel?.getTyping(callback)
    await channel?.startTyping()
    await sleep(2000)

    expect(callback).toHaveBeenCalledWith(["test-user"])

    unsubscribe()
  })
  //to be clarified regarding chat instance issue
  test("should handle and recover from a lost connection to the typing signal server", async () => {
    const chatMock = {
      sdk: {
        getUUID: jest.fn().mockReturnValue("test-user-uuid"),
      },
      createChannel: jest.fn().mockImplementation((channelId, channelData) => {
        // Simulate channel creation
        return new Channel(chatMock, { id: channelId, ...channelData })
      }),
    }

    const channel = new Channel(chatMock, { id: "test-channel" })

    const originalGetTyping = channel.getTyping
    const mockGetTyping = jest.fn(() => {
      throw new Error("Connection lost")
    })
    channel.getTyping = mockGetTyping

    const callback = jest.fn()

    const unsubscribe = await channel.getTyping(callback)

    await channel.startTyping()
    await sleep(2000)

    expect(callback).toHaveBeenCalledWith(["test-user-uuid"])

    channel.getTyping = originalGetTyping

    await channel.startTyping()
    await sleep(2000)

    expect(callback).toHaveBeenCalledWith(["test-user-uuid"])

    await channel.stopTyping()
    await sleep(2000)

    expect(callback).toHaveBeenCalledWith([])

    unsubscribe()
  })
  //to be clarified regarding chat instance issue
  test("should handle typing in a group chat with multiple recipients", async () => {
    const user1 = await createRandomUser()
    const user2 = await createRandomUser()
    const user3 = await createRandomUser()

    const { channel, hostMembership, inviteesMemberships } = await chat.createGroupConversation({
      users: [user1, user2, user3],
      channelId: "your_unique_channel_id",
      channelData: {
        name: "test-one",
        description: "testing",
        custom: "ObjectCustom",
      },
    })

    expect(channel).toBeDefined()
    expect(hostMembership).toBeDefined()
    expect(inviteesMemberships).toBeDefined()
    expect(inviteesMemberships.length).toBe(3)

    const typingCallback = jest.fn()

    const unsubscribe = await channel.getTyping(typingCallback)

    await user1.startTyping()
    await user2.startTyping()
    await user3.startTyping()

    expect(typingCallback).toHaveBeenCalledWith([user1.id, user2.id, user3.id])

    await user1.stopTyping()
    await user2.stopTyping()
    await user3.stopTyping()

    expect(typingCallback).toHaveBeenCalledWith([])

    unsubscribe()

    await channel.delete()
    await chat.deleteUser(user1.id)
    await chat.deleteUser(user2.id)
    await chat.deleteUser(user3.id)
  })
  //to be clarified regarding chat instance issue
  test.only("should handle multiple users starting and stopping typing", async () => {
    const user1 = await createRandomUser()
    const user2 = await createRandomUser()

    const channelId = "group_channel_typing_test"
    const channelData = {
      name: "Typing Test Group Channel",
      description: "This is a test group channel for typing.",
    }

    const membershipData = {
      custom: {
        role: "member",
      },
    }

    const result = await chat.createGroupConversation({
      users: [user1, user2],
      channelId,
      channelData,
      membershipData,
    })

    const { channel } = result

    const callbackUser1 = jest.fn()
    const callbackUser2 = jest.fn()

    const unsubscribeUser1 = channel.getTyping(callbackUser1)
    const unsubscribeUser2 = channel.getTyping(callbackUser2)

    await channel.startTyping()
    await sleep(2000) // Allow the typing signal to propagate

    expect(callbackUser2).toHaveBeenCalledWith(["test-user"])

    await channel.startTyping()
    await sleep(2000) // Allow the typing signal to propagate

    expect(callbackUser1).toHaveBeenCalledWith(["test-user"])

    await channel.stopTyping()
    await sleep(2000) // Allow the typing signal to propagate

    expect(callbackUser2).toHaveBeenCalledWith([])

    await channel.stopTyping()
    await sleep(2000) // Allow the typing signal to propagate

    expect(callbackUser1).toHaveBeenCalledWith([])

    unsubscribeUser1()
    unsubscribeUser2()
    await user1.delete()
    await user2.delete()
    await channel.delete()
  })

  //done
  test("should properly handle typing and stopping typing", async () => {
    const callback = jest.fn()

    const unsubscribe = await channel.getTyping(callback)

    await channel.startTyping()
    await sleep(2000)

    expect(callback).toHaveBeenCalledWith(["test-user"])

    await channel.stopTyping()
    await sleep(2000)

    expect(callback).toHaveBeenCalledWith([])

    unsubscribe()
  })
})
