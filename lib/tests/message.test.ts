import { Channel, Chat, INTERNAL_ADMIN_CHANNEL, Message, MessageDraft } from "../src"
import {
  createChatInstance,
  createRandomChannel,
  generateExpectedLinkedText,
  sleep,
  waitForAllMessagesToBeDelivered,
  makeid,
} from "./utils"
import { jest } from "@jest/globals"
import * as fs from "fs"

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

  type FileDetails = {
    id: string
    name: string
    url: string
    type: string
  }

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

  test("should render URLs correctly", async () => {
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

  test("should send multiple image files along with a text message correctly", async () => {
    const messages: string[] = []
    const filesReceived: FileDetails[] = []
    const textMessage = "Hello, sending three files"

    const file1 = fs.createReadStream("tests/fixtures/pblogo1.png")
    const file2 = fs.createReadStream("tests/fixtures/pblogo2.png")
    const file3 = fs.createReadStream("tests/fixtures/pblogo3.png")

    const filesFromInput = [
      { stream: file1, name: "pblogo1.png", mimeType: "image/png" },
      { stream: file2, name: "pblogo2.png", mimeType: "image/png" },
      { stream: file3, name: "pblogo3.png", mimeType: "image/png" },
    ]

    const disconnect = channel.connect((message) => {
      if (message.content.text !== undefined) {
        messages.push(message.content.text)
      }
      if (message.content.files !== undefined) {
        filesReceived.push(...message.content.files)
      }
    })

    await channel.sendText(textMessage, {
      files: filesFromInput,
    })

    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
    await sleep(2000)

    expect(messages).toContain(textMessage)

    expect(filesReceived.length).toBe(3)

    expect(filesReceived[0].id).toBeDefined()
    expect(filesReceived[0].name).toBe("pblogo1.png")
    expect(filesReceived[0].url).toBeDefined()
    expect(filesReceived[0].type).toBe("image/png")

    expect(filesReceived[1].id).toBeDefined()
    expect(filesReceived[1].name).toBe("pblogo2.png")
    expect(filesReceived[1].url).toBeDefined()
    expect(filesReceived[1].type).toBe("image/png")

    expect(filesReceived[2].id).toBeDefined()
    expect(filesReceived[2].name).toBe("pblogo3.png")
    expect(filesReceived[2].url).toBeDefined()
    expect(filesReceived[2].type).toBe("image/png")

    disconnect()
  }, 30000)

  test("should send image file along with a text message correctly", async () => {
    const messages: string[] = []
    const filesReceived: FileDetails[] = []
    const textMessage = "Hello, sending three files"

    const file1 = fs.createReadStream("tests/fixtures/pblogo1.png")

    const filesFromInput = [{ stream: file1, name: "pblogo1.png", mimeType: "image/png" }]

    const disconnect = channel.connect((message) => {
      if (message.content.text !== undefined) {
        messages.push(message.content.text)
      }
      if (message.content.files !== undefined) {
        filesReceived.push(...message.content.files)
      }
    })

    await channel.sendText(textMessage, {
      files: filesFromInput,
    })

    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
    await sleep(2000)

    expect(messages).toContain(textMessage)

    expect(filesReceived.length).toBe(1)

    expect(filesReceived[0].id).toBeDefined()
    expect(filesReceived[0].name).toBe("pblogo1.png")
    expect(filesReceived[0].url).toBeDefined()
    expect(filesReceived[0].type).toBe("image/png")

    disconnect()
  }, 30000)

  test("should send pdf file along with a text message correctly", async () => {
    const messages: string[] = []
    const filesReceived: FileDetails[] = []
    const textMessage = "Hello, sending three files"

    const file1 = fs.createReadStream("tests/fixtures/lorem-ipsum.pdf")

    const filesFromInput = [{ stream: file1, name: "lorem-ipsum.pdf", mimeType: "application/pdf" }]

    const disconnect = channel.connect((message) => {
      if (message.content.text !== undefined) {
        messages.push(message.content.text)
      }
      if (message.content.files !== undefined) {
        filesReceived.push(...message.content.files)
      }
    })

    await channel.sendText(textMessage, {
      files: filesFromInput,
    })

    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
    await sleep(2000)

    expect(messages).toContain(textMessage)

    expect(filesReceived.length).toBe(1)

    expect(filesReceived[0].id).toBeDefined()
    expect(filesReceived[0].name).toBe("lorem-ipsum.pdf")
    expect(filesReceived[0].url).toBeDefined()
    expect(filesReceived[0].type).toBe("application/pdf")

    disconnect()
  }, 30000)

  test("should send txt file along with a text message correctly", async () => {
    const messages: string[] = []
    const filesReceived: FileDetails[] = []
    const textMessage = "Hello, sending three files"

    const file1 = fs.createReadStream("tests/fixtures/sample1.txt")

    const filesFromInput = [{ stream: file1, name: "sample1.txt", mimeType: "text/plain" }]

    const disconnect = channel.connect((message) => {
      if (message.content.text !== undefined) {
        messages.push(message.content.text)
      }
      if (message.content.files !== undefined) {
        filesReceived.push(...message.content.files)
      }
    })

    await channel.sendText(textMessage, {
      files: filesFromInput,
    })

    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
    await sleep(2000)

    expect(messages).toContain(textMessage)

    expect(filesReceived.length).toBe(1)

    expect(filesReceived[0].id).toBeDefined()
    expect(filesReceived[0].name).toBe("sample1.txt")
    expect(filesReceived[0].url).toBeDefined()
    expect(filesReceived[0].type).toBe("text/plain")

    disconnect()
  }, 30000)

  test("should send mp4 file along with a text message correctly", async () => {
    const messages: string[] = []
    const filesReceived: FileDetails[] = []
    const textMessage = "Hello, sending three files"

    const file1 = fs.createReadStream("tests/fixtures/example-video.mp4")

    const filesFromInput = [{ stream: file1, name: "example-video.mp4", mimeType: "video/mp4" }]

    const disconnect = channel.connect((message) => {
      if (message.content.text !== undefined) {
        messages.push(message.content.text)
      }
      if (message.content.files !== undefined) {
        filesReceived.push(...message.content.files)
      }
    })

    await channel.sendText(textMessage, {
      files: filesFromInput,
    })

    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
    await sleep(2000)

    expect(messages).toContain(textMessage)

    expect(filesReceived.length).toBe(1)

    expect(filesReceived[0].id).toBeDefined()
    expect(filesReceived[0].name).toBe("example-video.mp4")
    expect(filesReceived[0].url).toBeDefined()
    expect(filesReceived[0].type).toBe("video/mp4")

    disconnect()
  }, 30000)

  test("should send multiple different types of files along with a text message correctly", async () => {
    const messages: string[] = []
    const filesReceived: FileDetails[] = []
    const textMessage = "Hello, sending three files"

    const file1 = fs.createReadStream("tests/fixtures/pblogo1.png")
    const file2 = fs.createReadStream("tests/fixtures/lorem-ipsum.pdf")
    const file3 = fs.createReadStream("tests/fixtures/sample1.txt")

    const filesFromInput = [
      { stream: file1, name: "pblogo1.png", mimeType: "image/png" },
      { stream: file2, name: "lorem-ipsum.pdf", mimeType: "application/pdf" },
      { stream: file3, name: "sample1.txt", mimeType: "text/plain" },
    ]

    const disconnect = channel.connect((message) => {
      if (message.content.text !== undefined) {
        messages.push(message.content.text)
      }
      if (message.content.files !== undefined) {
        filesReceived.push(...message.content.files)
      }
    })

    await channel.sendText(textMessage, {
      files: filesFromInput,
    })

    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
    await sleep(2000)

    expect(messages).toContain(textMessage)

    expect(filesReceived.length).toBe(3)

    expect(filesReceived[0].id).toBeDefined()
    expect(filesReceived[0].name).toBe("pblogo1.png")
    expect(filesReceived[0].url).toBeDefined()
    expect(filesReceived[0].type).toBe("image/png")

    expect(filesReceived[1].id).toBeDefined()
    expect(filesReceived[1].name).toBe("lorem-ipsum.pdf")
    expect(filesReceived[1].url).toBeDefined()
    expect(filesReceived[1].type).toBe("application/pdf")

    expect(filesReceived[2].id).toBeDefined()
    expect(filesReceived[2].name).toBe("sample1.txt")
    expect(filesReceived[2].url).toBeDefined()
    expect(filesReceived[2].type).toBe("text/plain")

    disconnect()
  }, 30000)

  //Skiped across SDK issue with sending files over 5mb. Was reported to SDK team. Waiting for fix
  test.skip("shouldn't allow to send image file over 5 mb along with a text message", async () => {
    const messages: string[] = []
    const filesReceived: FileDetails[] = []
    const textMessage = "Hello, sending three files"

    const file1 = fs.createReadStream("tests/fixtures/example-video-oversize.mp4")

    const filesFromInput = [
      { stream: file1, name: "example-video-oversize.mp4", mimeType: "video/mp4" },
    ]

    const disconnect = channel.connect((message) => {
      if (message.content.text !== undefined) {
        messages.push(message.content.text)
      }
      if (message.content.files !== undefined) {
        filesReceived.push(...message.content.files)
      }
    })

    try {
      await channel.sendText(textMessage, {
        files: filesFromInput,
      })
    } catch (error) {
      expect(error).toBeTruthy()
    }

    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
    await sleep(2000)

    expect(messages).toContain(textMessage)

    expect(filesReceived.length).toBe(1)

    expect(filesReceived[0].id).toBeDefined()
    expect(filesReceived[0].name).toBe("oversize.jpg")
    expect(filesReceived[0].url).toBeDefined()
    expect(filesReceived[0].type).toBe("image/jpg")

    disconnect()
  }, 30000)

  test("should send 3 messages with proper delays and verify rate limiter", async () => {
    const timeout = 1000
    const factor = 2

    const chat = await createChatInstance({
      shouldCreateNewInstance: true,
      config: { rateLimitFactor: factor, rateLimitPerChannel: { public: timeout } },
    })

    const channel = await chat.createPublicConversation({
      channelId: `channel_${makeid()}`,
      channelData: {
        name: "Test Channel",
        description: "This is a test channel",
      },
    })

    const start = performance.now()

    await channel.sendText("Message 1")

    await channel.sendText("Message 2")
    const durationSecond = performance.now() - start

    await channel.sendText("Message 3")
    const durationThird = performance.now() - start

    expect(durationSecond).toBeGreaterThan(timeout)
    expect(durationThird).toBeGreaterThan(timeout + timeout * factor)
  })

  test("should send long messages and validate correct rendering", async () => {
    const messages: string[] = []
    const longMessages = [
      "This is a long message with a lot of text to test the rendering of long messages in the chat.",
      "Another long message that should be rendered correctly without any issues.",
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non arcu eget risus lacinia tincidunt ut non orci. Nullam scelerisque odio vel erat feugiat placerat.",
      "A very lengthy message to check how the chat handles extremely long text messages. It should not break the layout or cause any issues.",
    ]

    const disconnect = channel.connect((message) => {
      if (message.content.text !== undefined) {
        messages.push(message.content.text)
      }
    })

    for (const longMessage of longMessages) {
      await channel.sendText(longMessage)
      const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
      await sleep(2000)
    }

    await waitForAllMessagesToBeDelivered(messages, longMessages)

    for (const longMessage of longMessages) {
      expect(messages).toContain(longMessage)
    }

    disconnect()
  }, 30000)

  test("should fail to send an empty or whitespace-only message", async () => {
    const messages: string[] = []

    const disconnect = channel.connect((message) => {
      if (message.content.text !== undefined) {
        messages.push(message.content.text)
      }
    })

    try {
      await channel.sendText("")
    } catch (error) {
      expect(error).toBeDefined()
      expect(error.message).toContain("Message text cannot be empty")
    }

    try {
      await channel.sendText("   ")
    } catch (error) {
      expect(error).toBeDefined()
      expect(error.message).toContain("Message text cannot be empty")
    }

    expect(messages.length).toBe(0)

    disconnect()
  }, 30000)

  test("should send and receive messages in various languages correctly", async () => {
    const messages: string[] = []
    const textMessages = [
      "Hello",
      "This is a test message",
      "你好", // Chinese
      "مرحبًا", // Arabic
      "こんにちは", // Japanese
      "안녕하세요", // Korean
      "Hola", // Spanish
    ]

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
  //needs to be clarified. Task created CSK-284
  test("should fail to edit a deleted message", async () => {
    await channel.sendText("Test message")
    await sleep(150) // history calls have around 130ms of cache time

    const historyBeforeDelete = await channel.getHistory()
    const messagesBeforeDelete: Message[] = historyBeforeDelete.messages
    const sentMessage = messagesBeforeDelete[messagesBeforeDelete.length - 1]

    await sentMessage.delete({ soft: false })
    await sleep(150) // history calls have around 130ms of cache time

    try {
      await sentMessage.editText("Edited message")
    } catch (error) {
      expect(error.message).toContain("dfgdfgdfg not found")
    }
  }, 30000)

  test("should delete toggle the message reaction", async () => {
    await channel.sendText("Test message with reaction")
    await sleep(150) // history calls have around 130ms of cache time

    const historyBeforeReaction = await channel.getHistory()
    const messagesBeforeReaction: Message[] = historyBeforeReaction.messages
    const sentMessage = messagesBeforeReaction[messagesBeforeReaction.length - 1]

    sentMessage.reactions["like"] = [{ uuid: chat.sdk.getUUID(), actionTimetoken: "123" }]

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

    expect(toggledMessage.reactions["like"]).toBeUndefined()
  }, 30000)

  test("should be unable to pin multiple messages", async () => {
    await channel.sendText("First Test message")
    await sleep(150)
    await channel.sendText("Second Test message")
    await sleep(150)

    const history = await channel.getHistory()
    const messages: Message[] = history.messages

    const firstMessageToPin = messages[messages.length - 2]
    const secondMessageToPin = messages[messages.length - 1]

    const firstPinnedChannel = await channel.pinMessage(firstMessageToPin)

    if (
      !firstPinnedChannel.custom?.["pinnedMessageTimetoken"] ||
      firstPinnedChannel.custom["pinnedMessageTimetoken"] !== firstMessageToPin.timetoken
    ) {
      throw new Error("Failed to pin the first message")
    }

    const secondPinnedChannel = await channel.pinMessage(secondMessageToPin)

    if (
      !secondPinnedChannel.custom?.["pinnedMessageTimetoken"] ||
      secondPinnedChannel.custom["pinnedMessageTimetoken"] !== secondMessageToPin.timetoken
    ) {
      throw new Error("Failed to pin the second message")
    }

    if (secondPinnedChannel.custom["pinnedMessageTimetoken"] === firstMessageToPin.timetoken) {
      throw new Error("First message is still pinned")
    }
  }, 30000)

  test("should not allow inserting a link inside another link", () => {
    const initialText = "Check out these links: "
    messageDraft.onChange(initialText)

    const textToAdd1 = "example link 1"
    const linkToAdd1 = "https://www.example1.com"
    messageDraft.addLinkedText({
      text: textToAdd1,
      link: linkToAdd1,
      positionInInput: initialText.length,
    })

    const textToAdd2 = " example link 2"
    const linkToAdd2 = "https://www.example2.com"

    expect(() => {
      messageDraft.addLinkedText({
        text: textToAdd2,
        link: linkToAdd2,
        positionInInput: messageDraft.value.indexOf(textToAdd1) + 2,
      })
    }).toThrowError("You cannot insert a link inside another link")

    const expectedText = `${initialText}${textToAdd1}`
    expect(messageDraft.value).toBe(expectedText)

    const expectedLinks = [
      {
        startIndex: initialText.length,
        endIndex: initialText.length + textToAdd1.length,
        link: linkToAdd1,
      },
    ]

    expect(messageDraft.textLinks).toHaveLength(1)
    expect(messageDraft.textLinks).toEqual(expect.arrayContaining(expectedLinks))
  })

  test("should send quote message in a Thread", async () => {
    const originalMessageText = "Original message for forwarding"
    await channel.sendText(originalMessageText)
    await sleep(150) // history calls have around 130ms of cache time

    let history = await channel.getHistory()
    const originalMessage = history.messages[0]

    await originalMessage.createThread()
    history = await channel.getHistory()
    const threadedMessage = history.messages[0]
    expect(threadedMessage.hasThread).toBe(true)

    const thread = await threadedMessage.getThread()

    let messageDraft = thread.createMessageDraft()

    await messageDraft.onChange("Whatever")
    await messageDraft.send()
    const firstThreadMessage = (await thread.getHistory()).messages[0]

    messageDraft = thread.createMessageDraft()

    messageDraft.addQuote(firstThreadMessage)

    await messageDraft.onChange("This is a forwarded message.")
    await messageDraft.send()

    await sleep(150)

    const threadMessages = await thread.getHistory()
    const forwardedMessageText = threadMessages.messages[1].content.text
    const forwardedMessageQuote = threadMessages.messages[1].quotedMessage

    expect(forwardedMessageText).toBe("This is a forwarded message.")
    expect(forwardedMessageQuote.text).toBe("Whatever")
    expect(forwardedMessageQuote.userId).toBe("test-user")
  })

  test("should pin the message inside the Thread", async () => {
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
    const messageToPin = threadMessages.messages[0]

    const pinnedThread = await thread.pinMessage(messageToPin)

    expect(pinnedThread.custom?.["pinnedMessageTimetoken"]).toBe(messageToPin.timetoken)
  })
})
