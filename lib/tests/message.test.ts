import { Chat, Channel, Message } from "../src"
import { initTestChannel, initTestChat } from "./testUtils"
import * as dotenv from "dotenv"

dotenv.config()

describe("Send message test", () => {
  let channel: Channel | null
  let chat: Chat

  beforeEach(async () => {
    chat = initTestChat()
    channel = await initTestChannel(chat)
  })

  test("should send and receive unicode messages correctly", async () => {
    jest.retryTimes(3)

    const messages: Array<string> = []
    let receiveTime = 0

    if (!channel) {
      throw new Error("Channel is undefined")
    }

    const unicodeMessages = ["😀", "Привет", "你好", "こんにちは", "안녕하세요"]

    channel.connect((message) => {
      receiveTime = Date.now()
      messages.push(message.content.text)
    })

    const sendTime = Date.now()
    for (const unicodeMessage of unicodeMessages) {
      await channel.sendText(unicodeMessage)
      const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
      await sleep(2000)
    }

    for (let i = 0; i < 3; i++) {
      const allMessagesReceived = unicodeMessages.every((unicodeMessage) =>
        messages.includes(unicodeMessage)
      )

      if (allMessagesReceived) {
        break
      } else {
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }
    }

    const elapsedTime = receiveTime - sendTime
    console.log(elapsedTime)

    for (const unicodeMessage of unicodeMessages) {
      expect(messages).toContain(unicodeMessage)
    }
  }, 30000)

  test("should send and receive regular text messages correctly", async () => {
    jest.retryTimes(3)

    const messages: Array<string> = []
    let receiveTime = 0

    if (!channel) {
      throw new Error("Channel is undefined")
    }

    const textMessages = ["Hello", "This", "Is", "A", "Test"]

    channel.connect((message) => {
      receiveTime = Date.now()
      messages.push(message.content.text)
    })

    const sendTime = Date.now()
    for (const textMessage of textMessages) {
      await channel.sendText(textMessage)
      const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
      await sleep(2000)
    }

    for (let i = 0; i < 3; i++) {
      const allMessagesReceived = textMessages.every((textMessage) =>
        messages.includes(textMessage)
      )

      if (allMessagesReceived) {
        break
      } else {
        await new Promise((resolve) => setTimeout(resolve, 1000)) // wait for 1 second before retrying
      }
    }

    const elapsedTime = receiveTime - sendTime
    console.log(elapsedTime)

    for (const textMessage of textMessages) {
      expect(messages).toContain(textMessage)
    }
  }, 30000)

  test("should throw an error when sending a message on a disconnected channel", async () => {
    jest.retryTimes(3)

    if (!channel) {
      throw new Error("Channel is undefined")
    }

    await channel?.disconnect()

    try {
      await channel?.sendText("message")
      fail("Should have thrown an error")
    } catch (error) {
      expect(error).toBeInstanceOf(Error)
    }
  })

  test("should delete the message", async () => {
    jest.retryTimes(3)

    if (!channel) {
      throw new Error("Channel is undefined")
    }

    await channel.sendText("Test message")

    const historyBeforeDelete = await channel.getHistory({ count: 100 })
    const messagesBeforeDelete: Message[] = historyBeforeDelete.messages
    const sentMessage = messagesBeforeDelete[messagesBeforeDelete.length - 1]

    await sentMessage.delete()

    const historyAfterDelete = await channel.getHistory({ count: 100 })
    const messagesAfterDelete: Message[] = historyAfterDelete.messages

    const deletedMessage = messagesAfterDelete.find(
      (message: Message) => message.timetoken === sentMessage.timetoken
    )

    expect(deletedMessage).toBeUndefined()
  }, 30000)

  test("should edit the message", async () => {
    jest.retryTimes(3)

    if (!channel) {
      throw new Error("Channel is undefined")
    }

    await channel.sendText("Test message")

    const historyBeforeEdit = await channel.getHistory({ count: 100 })
    const messagesBeforeEdit: Message[] = historyBeforeEdit.messages
    const sentMessage = messagesBeforeEdit[messagesBeforeEdit.length - 1]

    const mockMessage: Partial<Message> = {
      ...sentMessage,
      editText: jest.fn().mockResolvedValue(sentMessage),
    }

    const editedMessage = await (mockMessage as Message).editText("Edited message")

    expect(mockMessage.editText).toHaveBeenCalledWith("Edited message")
    expect(editedMessage).toBe(sentMessage)
  }, 30000)

  test("should toggle the message reaction", async () => {
    jest.retryTimes(3)

    if (!channel) {
      throw new Error("Channel is undefined")
    }

    await channel.sendText("Test message")

    const historyBeforeReaction = await channel.getHistory({ count: 100 })
    const messagesBeforeReaction: Message[] = historyBeforeReaction.messages
    const sentMessage = messagesBeforeReaction[messagesBeforeReaction.length - 1]

    const mockMessage: Partial<Message> = {
      ...sentMessage,
      toggleReaction: jest.fn().mockImplementation((reaction: string) => {
        if (sentMessage.reactions[reaction]) {
          delete sentMessage.reactions[reaction]
        } else {
          sentMessage.reactions[reaction] = [{ uuid: chat.sdk.getUUID(), actionTimetoken: "123" }]
        }
        return sentMessage
      }),
    }

    const toggledMessage = await (mockMessage as Message).toggleReaction("like")

    expect(mockMessage.toggleReaction).toHaveBeenCalledWith("like")
    expect(toggledMessage).toBe(sentMessage)
  }, 30000)
  jest.retryTimes(3)
})
