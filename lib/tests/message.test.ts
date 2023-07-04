import { Chat, Channel, Message, MessageType, ReportMessageContent } from "../src"
import {
  createChatInstance,
  createRandomChannel,
  sleep,
  waitForAllMessagesToBeDelivered,
} from "./utils"
import { INTERNAL_ADMIN_CHANNEL } from "../src"

describe("Send message test", () => {
  jest.retryTimes(3)

  let chat: Chat
  let channel: Channel

  beforeAll(async () => {
    chat = await createChatInstance()
  })

  beforeEach(async () => {
    channel = await createRandomChannel()
  })

  test("should send and receive unicode messages correctly", async () => {
    const messages: string[] = []
    const unicodeMessages = ["😀", "Привет", "你好", "こんにちは", "안녕하세요"]

    const disconnect = channel.connect((message) => {
      if (message.content.text !== undefined) {
        messages.push(message.content.text)
      }
    })

    for (const unicodeMessage of unicodeMessages) {
      await channel.sendText(unicodeMessage)
      const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
      await sleep(2000)
    }

    await waitForAllMessagesToBeDelivered(messages, unicodeMessages)

    for (const unicodeMessage of unicodeMessages) {
      expect(messages).toContain(unicodeMessage)
    }

    disconnect()
  }, 30000)

  test("should send and receive regular text messages correctly", async () => {
    const messages: string[] = []
    const textMessages = ["Hello", "This", "Is", "A", "Test"]

    const disconnect = channel.connect((message) => {
      if (message.content.text !== undefined) {
        messages.push(message.content.text)
      }
    })

    for (const textMessage of textMessages) {
      await channel.sendText(textMessage)
      const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
      await sleep(2000)
    }

    await waitForAllMessagesToBeDelivered(messages, textMessages)

    for (const textMessage of textMessages) {
      expect(messages).toContain(textMessage)
    }

    disconnect()
  }, 30000)

  test("should delete the message", async () => {
    await channel.sendText("Test message")
    await sleep(150) // history calls have around 130ms of cache time

    const historyBeforeDelete = await channel.getHistory()
    const messagesBeforeDelete: Message[] = historyBeforeDelete.messages
    const sentMessage = messagesBeforeDelete[messagesBeforeDelete.length - 1]

    await sentMessage.delete()
    await sleep(150) // history calls have around 130ms of cache time

    const historyAfterDelete = await channel.getHistory()
    const messagesAfterDelete: Message[] = historyAfterDelete.messages

    const deletedMessage = messagesAfterDelete.find(
      (message: Message) => message.timetoken === sentMessage.timetoken
    )

    expect(deletedMessage).toBeUndefined()
  }, 30000)

  test("should edit the message", async () => {
    await channel.sendText("Test message")
    await sleep(150) // history calls have around 130ms of cache time

    const historyBeforeEdit = await channel.getHistory()
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
    await channel.sendText("Test message")
    await sleep(150) // history calls have around 130ms of cache time

    const historyBeforeReaction = await channel.getHistory()
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
    await channel.sendText("Test message")
    await sleep(150) // history calls have around 130ms of cache time

    const historyBeforePin = await channel.getHistory()
    const messagesBeforePin: Message[] = historyBeforePin.messages
    const messageToPin = messagesBeforePin[messagesBeforePin.length - 1]

    const pinnedChannel = await channel.pinMessage(messageToPin)

    expect(pinnedChannel.custom?.["pinnedMessageTimetoken"]).toBe(messageToPin.timetoken)
  }, 30000)

  test("should unpin the message", async () => {
    await channel.sendText("Test message to be pinned and then unpinned")
    await sleep(150) // history calls have around 130ms of cache time

    const historyBeforePin = await channel.getHistory()
    const messagesBeforePin: Message[] = historyBeforePin.messages
    const messageToPin = messagesBeforePin[messagesBeforePin.length - 1]

    const pinnedChannel = await channel.pinMessage(messageToPin)
    expect(pinnedChannel.custom?.["pinnedMessageTimetoken"]).toBe(messageToPin.timetoken)

    const unpinnedChannel = await channel.unpinMessage()
    expect(unpinnedChannel.custom?.["pinnedMessageTimetoken"]).toBeUndefined()
  }, 30000)

  test("should stream message updates and invoke the callback", async () => {
    await channel.sendText("Test message")
    await sleep(150) // history calls have around 130ms of cache time

    const historyBeforeEdit = await channel.getHistory()
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
})
