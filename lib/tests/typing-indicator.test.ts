// @ts-nocheck
import { Channel, Chat } from "../src"
import { createChatInstance, createRandomChannel, sleep } from "./utils"

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
  //needs to be clarified. Task created CSK-285
  test.skip("should not call the callback when the typing signal is from the same user as the recipient", async () => {
    const chat1 = await createChatInstance({
      userId: "testing",
      shouldCreateNewInstance: true,
    })

    const channelId = "group_channel_typing_test_same_user"
    const channelData = {
      name: "Typing Test Group Channel for Same User",
      description: "This is a test group channel for typing by the same user.",
    }

    const membershipData = {
      custom: {
        role: "member",
      },
    }

    const result = await chat.createGroupConversation({
      users: [chat1.currentUser],
      channelId,
      channelData,
      membershipData,
    })

    const { channel } = result

    const callback = jest.fn()

    const channelFromUser1 =
      (await chat1.getChannel(channelId)) ||
      (await chat1.createChannel(channelId, { name: "hello" }))
    const unsubscribe = channelFromUser1.getTyping(callback)

    await channelFromUser1.startTyping()
    await sleep(1000)

    expect(callback).not.toHaveBeenCalled()

    await channelFromUser1.stopTyping()
    await sleep(2000)

    unsubscribe()
    await chat1.currentUser.delete()
    await channel.delete()
  })

  test("should handle multiple users starting and stopping typing", async () => {
    const chat1 = await createChatInstance({
      userId: "testing",
      shouldCreateNewInstance: true,
    })
    const chat2 = await createChatInstance({
      userId: "testing2",
      shouldCreateNewInstance: true,
    })

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
      users: [chat1.currentUser, chat2.currentUser],
      channelId,
      channelData,
      membershipData,
    })

    const { channel } = result

    const callback = jest.fn()
    const channelFromUser1 =
      (await chat1.getChannel(channelId)) ||
      (await chat1.createChannel(channelId, { name: "hello" }))
    const channelFromUser2 =
      (await chat2.getChannel(channelId)) ||
      (await chat2.createChannel(channelId, { name: "hello" }))

    const unsubscribe = channel.getTyping(callback)

    await channel.startTyping()
    await channelFromUser1.startTyping()
    await channelFromUser2.startTyping()
    await sleep(1000)

    expect(callback).toHaveBeenCalledWith(
      expect.arrayContaining(["testing", "testing2", "test-user"])
    )

    await channel.stopTyping()
    await channelFromUser1.stopTyping()
    await channelFromUser2.stopTyping()
    await sleep(2000)

    expect(callback).toHaveBeenCalledWith([])

    unsubscribe()
    await chat1.currentUser.delete()
    await chat2.currentUser.delete()
    await channel.delete()
  }, 30000)

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
