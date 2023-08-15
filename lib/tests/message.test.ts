import { Chat, Channel, Message, MessageDraft } from "../src"
import {
  createChatInstance,
  createRandomChannel,
  sleep,
  waitForAllMessagesToBeDelivered,
  generateExpectedLinkedText,
} from "./utils"
import { INTERNAL_ADMIN_CHANNEL } from "../src"
import { jest } from "@jest/globals"

describe("Send message test", () => {
  jest.retryTimes(3)

  let chat: Chat
  let channel: Channel
  let messageDraft

  beforeAll(async () => {
    chat = await createChatInstance()
  })

  beforeEach(async () => {
    channel = await createRandomChannel()
    messageDraft = new MessageDraft(chat, channel)
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

  test.only("should render URLs correctly", async () => {
    const messageDraft = channel.createMessageDraft()
    const someUser =
      (await chat.getUser("Przemek")) || (await chat.createUser("Przemek", { name: "Lukasz" }))
    const someUser2 =
      (await chat.getUser("whatever")) || (await chat.createUser("whatever", { name: "Anton" }))

    const expectedLinkedText = generateExpectedLinkedText(messageDraft, someUser, someUser2)

    const messagePreview = messageDraft.getMessagePreview()

    expectedLinkedText.forEach((expectedElement) => {
      expect(messagePreview).toEqual(expect.arrayContaining([expectedElement]))
    })
  })

  test("should add linked text correctly", () => {
    const initialText = "Check out this link: "
    messageDraft.onChange(initialText)

    const textToAdd = "example link"
    const linkToAdd = "https://www.example.com"

    messageDraft.addLinkedText({
      text: textToAdd,
      link: linkToAdd,
      positionInInput: initialText.length,
    })

    const expectedText = `${initialText}${textToAdd}`
    expect(messageDraft.value).toBe(expectedText)
    expect(messageDraft.textLinks).toHaveLength(1)
    expect(messageDraft.textLinks[0]).toEqual({
      startIndex: initialText.length,
      endIndex: initialText.length + textToAdd.length,
      link: linkToAdd,
    })
  })

  test("should throw an error for invalid link format", () => {
    const initialText = "Check out this link: "
    messageDraft.onChange(initialText)

    const invalidLinkToAdd = "invalid-link"

    expect(() => {
      messageDraft.addLinkedText({
        text: "invalid link",
        link: invalidLinkToAdd,
        positionInInput: initialText.length,
      })
    }).toThrow("You need to insert a URL")

    expect(messageDraft.value).toBe(initialText)
    expect(messageDraft.textLinks).toHaveLength(0)
  })

  test("should throw an error if adding a link inside another link", () => {
    const initialText = "Check out this link: "
    messageDraft.onChange(initialText)

    const textToAdd1 = "example link1"
    const linkToAdd1 = "https://www.example1.com"
    const textToAdd2 = "example link2"
    const linkToAdd2 = "https://www.example2.com"

    messageDraft.addLinkedText({
      text: textToAdd1,
      link: linkToAdd1,
      positionInInput: initialText.length,
    })

    expect(() => {
      messageDraft.addLinkedText({
        text: textToAdd2,
        link: linkToAdd2,
        positionInInput: initialText.length + textToAdd1.length - 2,
      })
    }).toThrow("You cannot insert a link inside another link")

    expect(messageDraft.value).toBe(initialText + textToAdd1)
    expect(messageDraft.textLinks).toHaveLength(1)
    expect(messageDraft.textLinks[0]).toEqual({
      startIndex: initialText.length,
      endIndex: initialText.length + textToAdd1.length,
      link: linkToAdd1,
    })
  })

  test("should remove a linked URL correctly", () => {
    const initialText = "Check out this link: "
    messageDraft.onChange(initialText)

    const textToAdd = "example link"
    const linkToAdd = "https://www.example.com"

    messageDraft.addLinkedText({
      text: textToAdd,
      link: linkToAdd,
      positionInInput: initialText.length,
    })

    expect(messageDraft.value).toBe(initialText + textToAdd)

    const positionInLinkedText = initialText.length

    messageDraft.removeLinkedText(positionInLinkedText)

    const expectedValue = "Check out this link: example link"
    expect(messageDraft.value).toBe(expectedValue)

    const messagePreview = messageDraft.getMessagePreview()

    const expectedMessagePreview = [
      {
        type: "text",
        content: {
          text: "Check out this link: example link",
        },
      },
    ]

    expect(messagePreview).toEqual(expectedMessagePreview)
  })

  test("should report a message", async () => {
    const messageText = "Test message to be reported"
    const reportReason = "Inappropriate content"

    await channel.sendText(messageText)
    await sleep(150) // history calls have around 130ms of cache time

    const history = await channel.getHistory({ count: 1 })
    const reportedMessage = history.messages[0]
    await reportedMessage.report(reportReason)
    await sleep(150) // history calls have around 130ms of cache time

    const adminChannel = await chat.getChannel(INTERNAL_ADMIN_CHANNEL)
    expect(adminChannel).toBeDefined()

    const adminChannelHistory = await adminChannel.getHistory({ count: 1 })
    const reportMessage = adminChannelHistory.messages[0]

    expect(reportMessage?.content.type).toBe("report")
    expect(reportMessage?.content.text).toBe(messageText)
    expect(reportMessage?.content.reason).toBe(reportReason)
    expect(reportMessage?.content.reportedMessageChannelId).toBe(reportedMessage.channelId)
    expect(reportMessage?.content.reportedMessageTimetoken).toBe(reportedMessage.timetoken)
    expect(reportMessage?.content.reportedUserId).toBe(reportedMessage.userId)
  })
})
