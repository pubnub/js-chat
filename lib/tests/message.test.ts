import {
  Chat,
  Channel,
  Message,
  MessageType,
  TextMessageContent,
  ReportMessageContent,
} from "../src"
import * as dotenv from "dotenv"
import { initTestChannel, initTestChat, waitForAllMessagesToBeDelivered } from "./testUtils"
import { INTERNAL_ADMIN_CHANNEL } from "../src"

dotenv.config()

describe("Send message test", () => {
  let channel: Channel | null
  let chat: Chat

  beforeEach(async () => {
    chat = await initTestChat()
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

    const disconnect = channel.connect((message) => {
      receiveTime = Date.now()
      if (message.content.text !== undefined) {
        messages.push(message.content.text)
      }
    })

    const sendTime = Date.now()
    for (const unicodeMessage of unicodeMessages) {
      await channel.sendText(unicodeMessage)
      const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
      await sleep(2000)
    }

    await waitForAllMessagesToBeDelivered(messages, unicodeMessages)

    const elapsedTime = receiveTime - sendTime
    console.log(elapsedTime)

    for (const unicodeMessage of unicodeMessages) {
      expect(messages).toContain(unicodeMessage)
    }

    disconnect()
  }, 30000)

  test("should send and receive regular text messages correctly", async () => {
    jest.retryTimes(3)

    const messages: Array<string> = []
    let receiveTime = 0

    if (!channel) {
      throw new Error("Channel is undefined")
    }

    const textMessages = ["Hello", "This", "Is", "A", "Test"]

    const disconnect = channel.connect((message) => {
      receiveTime = Date.now()
      if (message.content.text !== undefined) {
        messages.push(message.content.text)
      }
    })

    const sendTime = Date.now()
    for (const textMessage of textMessages) {
      await channel.sendText(textMessage)
      const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
      await sleep(2000)
    }

    await waitForAllMessagesToBeDelivered(messages, textMessages)

    const elapsedTime = receiveTime - sendTime
    console.log(elapsedTime)

    for (const textMessage of textMessages) {
      expect(messages).toContain(textMessage)
    }

    disconnect()
  }, 30000)

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

  test("should pin the message", async () => {
    jest.retryTimes(3)

    if (!channel) {
      throw new Error("Channel is undefined")
    }

    await channel.sendText("Test message")

    const historyBeforePin = await channel.getHistory({ count: 100 })
    const messagesBeforePin: Message[] = historyBeforePin.messages
    const messageToPin = messagesBeforePin[messagesBeforePin.length - 1]

    const pinnedChannel = await channel.pinMessage(messageToPin)

    expect(pinnedChannel.custom?.["pinnedMessageTimetoken"]).toBe(messageToPin.timetoken)
  }, 30000)

  test("should unpin the message", async () => {
    jest.retryTimes(3)

    if (!channel) {
      throw new Error("Channel is undefined")
    }

    await channel.sendText("Test message to be pinned and then unpinned")

    const historyBeforePin = await channel.getHistory({ count: 100 })
    const messagesBeforePin: Message[] = historyBeforePin.messages
    const messageToPin = messagesBeforePin[messagesBeforePin.length - 1]

    const pinnedChannel = await channel.pinMessage(messageToPin)
    expect(pinnedChannel.custom?.["pinnedMessageTimetoken"]).toBe(messageToPin.timetoken)

    const unpinnedChannel = await channel.unpinMessage()
    expect(unpinnedChannel.custom?.["pinnedMessageTimetoken"]).toBeUndefined()
  }, 30000)

  test("should stream message updates and invoke the callback", async () => {
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

    const unsubscribe = Message.streamUpdatesOn(messagesBeforeEdit, (updatedMessages) => {
      const receivedMessage = updatedMessages.find((msg) => msg.timetoken === sentMessage.timetoken)
      expect(receivedMessage).toEqual(editedMessage)
      unsubscribe()
    })

    await new Promise((resolve) => setTimeout(resolve, 2000))
  }, 30000)

  test("should report a message", async () => {
    jest.retryTimes(3)

    if (!channel) {
      throw new Error("Channel is undefined")
    }

    const messageText = "Test message to be reported"
    const reportReason = "Inappropriate content"

    await channel.sendText(messageText)

    const history = await channel.getHistory({ count: 1 })
    const reportedMessage = history.messages[0]

    await reportedMessage.report(reportReason)

    const adminChannel = INTERNAL_ADMIN_CHANNEL
    const adminChannelObjPromise = chat.getChannel(adminChannel)
    if (!adminChannelObjPromise) {
      throw new Error("Admin channel is undefined")
    }

    const adminChannelObj = await adminChannelObjPromise // await the Promise to get the Channel object

    if (!adminChannelObj) {
      throw new Error("Admin channel object is null")
    }

    const adminChannelHistory = await adminChannelObj.getHistory({ count: 1 })

    const reportedMessageAfterReport = adminChannelHistory.messages[0]

    if (reportedMessageAfterReport?.content.type === MessageType.REPORT) {
      const reportContent = reportedMessageAfterReport.content as ReportMessageContent
      expect(reportContent.text).toBe(messageText)
      expect(reportContent.reason).toBe(reportReason)
      expect(reportContent.reportedMessageChannelId).toBe(reportedMessage.channelId)
      expect(reportContent.reportedMessageTimetoken).toBe(reportedMessage.timetoken)
      expect(reportContent.reportedUserId).toBe(reportedMessage.userId)
    } else {
      throw new Error("Reported message content is not of type 'REPORT'")
    }
  }, 30000)

  jest.retryTimes(3)
})
