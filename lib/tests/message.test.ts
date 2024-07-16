import {
  Channel,
  Chat,
  Message,
  MessageDraft,
  CryptoUtils,
  CryptoModule,
  MessageDTOParams,
} from "../src"
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
import { defaultDeleteActionName, defaultEditActionName } from "../src/default-values"

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

  test("should restore a soft deleted message", async () => {
    await channel.sendText("Test message")
    await sleep(150) // history calls have around 130ms of cache time

    const historyBeforeDelete = await channel.getHistory()
    const messagesBeforeDelete = historyBeforeDelete.messages
    const sentMessage = messagesBeforeDelete[messagesBeforeDelete.length - 1]

    await sentMessage.delete({ soft: true })
    await sleep(150) // history calls have around 130ms of cache time

    const historyAfterDelete = await channel.getHistory()
    const messagesAfterDelete = historyAfterDelete.messages

    const deletedMessage = messagesAfterDelete.find(
      (message: Message) => message.timetoken === sentMessage.timetoken
    )

    expect(deletedMessage.deleted).toBe(true)

    const restoredMessage = await deletedMessage.restore()

    expect(restoredMessage.deleted).toBe(false)

    const historyAfterRestore = await channel.getHistory()
    const messagesAfterRestore = historyAfterRestore.messages

    const historicRestoredMessage = messagesAfterRestore.find(
      (message: Message) => message.timetoken === sentMessage.timetoken
    )

    expect(historicRestoredMessage.deleted).toBe(false)
  })

  test("should restore a soft deleted message together with its thread", async () => {
    await channel.sendText("Test message")
    await sleep(150) // history calls have around 130ms of cache time

    let historyBeforeDelete = await channel.getHistory()
    let messagesBeforeDelete = historyBeforeDelete.messages
    let sentMessage = messagesBeforeDelete[messagesBeforeDelete.length - 1]
    const messageThread = await sentMessage.createThread()
    await messageThread.sendText("Some message in a thread")
    await sleep(150) // history calls have around 130ms of cache time
    historyBeforeDelete = await channel.getHistory()
    messagesBeforeDelete = historyBeforeDelete.messages
    sentMessage = messagesBeforeDelete[messagesBeforeDelete.length - 1]

    await sentMessage.delete({ soft: true })
    await sleep(200) // history calls have around 130ms of cache time

    const historyAfterDelete = await channel.getHistory()
    const messagesAfterDelete = historyAfterDelete.messages

    const deletedMessage = messagesAfterDelete.find(
      (message: Message) => message.timetoken === sentMessage.timetoken
    )

    expect(deletedMessage.deleted).toBe(true)
    expect(deletedMessage.hasThread).toBe(false)

    const restoredMessage = await deletedMessage.restore()

    expect(restoredMessage.deleted).toBe(false)
    expect(restoredMessage.hasThread).toBe(true)
    expect(await restoredMessage.getThread()).toBeDefined()
    expect((await restoredMessage.getThread()).id).toBe(
      chat.getThreadId(restoredMessage.channelId, restoredMessage.timetoken)
    )

    const historyAfterRestore = await channel.getHistory()
    const messagesAfterRestore = historyAfterRestore.messages

    const historicRestoredMessage = messagesAfterRestore.find(
      (message: Message) => message.timetoken === sentMessage.timetoken
    )

    expect(historicRestoredMessage.deleted).toBe(false)
    expect(await historicRestoredMessage.getThread()).toBeDefined()
    expect((await historicRestoredMessage.getThread()).id).toBe(
      chat.getThreadId(historicRestoredMessage.channelId, historicRestoredMessage.timetoken)
    )
  })

  test("should only log a warning if you try to restore an undeleted message", async () => {
    await channel.sendText("Test message")
    await sleep(150) // history calls have around 130ms of cache time

    const historicMessages = (await channel.getHistory()).messages
    const sentMessage = historicMessages[historicMessages.length - 1]
    const logSpy = jest.spyOn(console, "warn")
    await sentMessage.restore()
    expect(sentMessage.deleted).toBe(false)
    expect(logSpy).toHaveBeenCalledWith("This message has not been deleted")
  })

  test("should throw an error if you try to create a thread on a deleted message", async () => {
    await channel.sendText("Test message")
    await sleep(150) // history calls have around 130ms of cache time

    const historyBeforeDelete = await channel.getHistory()
    const messagesBeforeDelete = historyBeforeDelete.messages
    const sentMessage = messagesBeforeDelete[messagesBeforeDelete.length - 1]

    await sentMessage.delete({ soft: true })
    await sleep(150) // history calls have around 130ms of cache time

    const historyAfterDelete = await channel.getHistory()
    const messagesAfterDelete = historyAfterDelete.messages

    const deletedMessage = messagesAfterDelete.find(
      (message: Message) => message.timetoken === sentMessage.timetoken
    )
    let thrownExceptionString = ""

    await deletedMessage.createThread().catch((e) => {
      thrownExceptionString = e
    })

    expect(thrownExceptionString).toBe("You cannot create threads on deleted messages")
  })

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

    expect(sentMessage.actions?.reactions?.like).toBeUndefined()

    const toggledMessage = await sentMessage.toggleReaction("like")

    expect(toggledMessage.actions?.reactions?.like).toBeDefined()

    const likeReaction = toggledMessage.actions?.reactions?.like
    if (likeReaction) {
      expect(likeReaction[0].uuid).toBe("test-user")
    }
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
    let someUser = await chat.getUser("Przemek")
    let someUser2 = await chat.getUser("whatever")
    if (someUser) {
      await someUser.delete({ soft: false })
    }
    if (someUser2) {
      await someUser2.delete({ soft: false })
    }
    someUser = await chat.createUser("Przemek", { name: "Lukasz" })
    someUser2 = await chat.createUser("whatever", { name: "Anton" })

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

    const adminChannelHistory = await channel.getFlaggedMessages({ count: 1 })
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

    let errorMessage = "Message text cannot be empty"
    try {
      await channel.sendText("   ")
    } catch (error) {
      errorMessage = error.message
    }

    expect(errorMessage).toContain("Message text cannot be empty")

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

  test("should toggle the message reaction and then delete the message reaction", async () => {
    await channel.sendText("Test message")
    await sleep(150) // history calls have around 130ms of cache time

    const historyBeforeReaction = await channel.getHistory()
    const messagesBeforeReaction: Message[] = historyBeforeReaction.messages
    const sentMessage = messagesBeforeReaction[messagesBeforeReaction.length - 1]

    expect(sentMessage.actions?.reactions?.like).toBeUndefined()

    const toggledMessage = await sentMessage.toggleReaction("like")

    expect(toggledMessage.actions?.reactions?.like).toBeDefined()

    const messageAfterRemovingReaction = await toggledMessage.toggleReaction("like")

    const likeReactions = messageAfterRemovingReaction.actions?.reactions?.like
    expect(likeReactions === undefined || likeReactions.length === 0).toBeTruthy()
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

    const newThread = await originalMessage.createThread()
    await newThread.sendText("First message")
    history = await channel.getHistory()
    const threadedMessage = history.messages[0]
    expect(threadedMessage.hasThread).toBe(true)
    await sleep(150)

    const thread = await threadedMessage.getThread()

    const firstThreadMessage = (await thread.getHistory()).messages[0]

    const messageDraft = thread.createMessageDraft()

    messageDraft.addQuote(firstThreadMessage)

    await messageDraft.onChange("This is a forwarded message.")
    await messageDraft.send()

    await sleep(150)

    const threadMessages = await thread.getHistory()

    const forwardedMessageText = threadMessages.messages[1].content.text
    const forwardedMessageQuote = threadMessages.messages[1].quotedMessage

    expect(forwardedMessageText).toBe("This is a forwarded message.")
    expect(forwardedMessageQuote.text).toBe("First message")
    expect(forwardedMessageQuote.userId).toBe("test-user")
  })

  test("should pin the message inside the Thread", async () => {
    const messageText = "Test message"
    await channel.sendText(messageText)
    await sleep(150) // history calls have around 130ms of cache time

    let history = await channel.getHistory()
    let sentMessage = history.messages[0]
    expect(sentMessage.hasThread).toBe(false)

    const newThread = await sentMessage.createThread()
    await newThread.sendText("Hello!")

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

  test("should encrypt and decrypt a message", async () => {
    const encryptedChat = await createChatInstance({
      shouldCreateNewInstance: true,
      config: {
        cryptoModule: CryptoModule.aesCbcCryptoModule({ cipherKey: "pubnubenigma" }),
        userId: "another-user",
      },
    })
    const someRandomUser1 = await encryptedChat.createUser(makeid(), { name: "random-1" })

    const someEncryptedGroupChannel = await encryptedChat.createGroupConversation({
      users: [someRandomUser1],
    })
    const sameCipheredGroupChannel = await chat.getChannel(someEncryptedGroupChannel.channel.id)
    let encryptedMessage: Message
    let cipheredMessage: Message | undefined

    const disconnect1 = someEncryptedGroupChannel.channel.connect((msg) => {
      encryptedMessage = msg
    })
    const disconnect2 = sameCipheredGroupChannel.connect((msg) => {
      cipheredMessage = msg
    })

    await someEncryptedGroupChannel.channel.sendText("Random text")
    await sleep(200) // history calls have around 130ms of cache time
    const encryptedHistory = await someEncryptedGroupChannel.channel.getHistory()
    const cipheredHistory = await sameCipheredGroupChannel.getHistory()
    expect(encryptedMessage).toBeDefined()
    expect(cipheredMessage).toBeDefined()
    expect(encryptedMessage.text).toBe("Random text")
    expect(encryptedHistory.messages[0].text).toBe("Random text")
    expect(cipheredHistory.messages[0].text.startsWith("UE5FRAFBQ1JIE")).toBeTruthy()
    await someEncryptedGroupChannel.channel.delete({ soft: false })
    await sameCipheredGroupChannel.delete({ soft: false })
    await someRandomUser1.delete({ soft: false })
    disconnect1()
    disconnect2()
  })

  test("should encrypt and decrypt a file", async () => {
    const file1 = fs.createReadStream("tests/fixtures/pblogo1.png")
    const file2 = fs.createReadStream("tests/fixtures/pblogo2.png")
    const file3 = fs.createReadStream("tests/fixtures/pblogo3.png")

    const filesFromInput = [
      { stream: file1, name: "pblogo1.png", mimeType: "image/png" },
      { stream: file2, name: "pblogo2.png", mimeType: "image/png" },
      { stream: file3, name: "pblogo3.png", mimeType: "image/png" },
    ]

    const encryptedChat = await createChatInstance({
      shouldCreateNewInstance: true,
      config: {
        cryptoModule: CryptoModule.aesCbcCryptoModule({ cipherKey: "pubnubenigma" }),
        userId: "another-user",
      },
    })
    const someRandomUser1 = await encryptedChat.createUser(makeid(), { name: "random-1" })

    const someEncryptedGroupChannel = await encryptedChat.createGroupConversation({
      users: [someRandomUser1],
    })
    const sameCipheredGroupChannel = await chat.getChannel(someEncryptedGroupChannel.channel.id)
    let encryptedMessage: Message
    let cipheredMessage: Message | undefined

    const disconnect1 = someEncryptedGroupChannel.channel.connect((msg) => {
      encryptedMessage = msg
    })
    const disconnect2 = sameCipheredGroupChannel.connect((msg) => {
      cipheredMessage = msg
    })

    await someEncryptedGroupChannel.channel.sendText("Random text", { files: filesFromInput })
    await sleep(200) // history calls have around 130ms of cache time
    const encryptedHistory = await someEncryptedGroupChannel.channel.getHistory()
    const cipheredHistory = await sameCipheredGroupChannel.getHistory()
    expect(encryptedMessage).toBeDefined()
    expect(encryptedMessage.text).toBe("Random text")
    expect(encryptedHistory.messages[0].text).toBe("Random text")
    expect(cipheredHistory.messages[0].text.startsWith("UE5FRAFBQ1JIE")).toBeTruthy()
    expect(encryptedHistory.messages[0].files.length).toBe(3)
    expect(cipheredHistory.messages[0].files.length).toBe(0)
    await someEncryptedGroupChannel.channel.delete({ soft: false })
    await sameCipheredGroupChannel.delete({ soft: false })
    await someRandomUser1.delete({ soft: false })
    disconnect1()
    disconnect2()
  }, 20000)

  test("should still view text messages sent before enabling encryption", async () => {
    const encryptedChat = await createChatInstance({
      shouldCreateNewInstance: true,
      config: {
        cryptoModule: CryptoModule.aesCbcCryptoModule({ cipherKey: "pubnubenigma" }),
        userId: "another-user",
      },
    })
    const someRandomUser1 = await encryptedChat.createUser(makeid(), { name: "random-1" })

    const somePlainGroupChannel = await chat.createGroupConversation({
      users: [someRandomUser1],
    })
    const sameEncryptedGroupChannel = await encryptedChat.getChannel(
      somePlainGroupChannel.channel.id
    )
    let plainMessage: Message
    let cipheredMessage: Message | undefined

    const disconnect1 = somePlainGroupChannel.channel.connect((msg) => {
      plainMessage = msg
    })
    const disconnect2 = sameEncryptedGroupChannel.connect((msg) => {
      cipheredMessage = msg
    })

    await somePlainGroupChannel.channel.sendText("Random text")
    await sleep(200) // history calls have around 130ms of cache time
    const plainHistory = await somePlainGroupChannel.channel.getHistory()
    const cipheredHistory = await sameEncryptedGroupChannel.getHistory()
    expect(plainMessage).toBeDefined()
    expect(cipheredMessage).toBeDefined()
    expect(plainMessage.text).toBe("Random text")
    expect(cipheredMessage.text).toBe("Random text")
    expect(plainHistory.messages[0].text).toBe("Random text")
    expect(cipheredHistory.messages[0].text).toBe("Random text")
    await somePlainGroupChannel.channel.delete({ soft: false })
    await sameEncryptedGroupChannel.delete({ soft: false })
    await someRandomUser1.delete({ soft: false })
    disconnect1()
    disconnect2()
  }, 20000)

  test("should still view files sent before enabling encryption", async () => {
    const file1 = fs.createReadStream("tests/fixtures/pblogo1.png")
    const file2 = fs.createReadStream("tests/fixtures/pblogo2.png")
    const file3 = fs.createReadStream("tests/fixtures/pblogo3.png")

    const filesFromInput = [
      { stream: file1, name: "pblogo1.png", mimeType: "image/png" },
      { stream: file2, name: "pblogo2.png", mimeType: "image/png" },
      { stream: file3, name: "pblogo3.png", mimeType: "image/png" },
    ]

    const encryptedChat = await createChatInstance({
      shouldCreateNewInstance: true,
      config: {
        cryptoModule: CryptoModule.aesCbcCryptoModule({ cipherKey: "pubnubenigma" }),
        userId: "another-user",
      },
    })
    const someRandomUser1 = await encryptedChat.createUser(makeid(), { name: "random-1" })

    const somePlainGroupChannel = await chat.createGroupConversation({
      users: [someRandomUser1],
    })
    const sameEncryptedGroupChannel = await encryptedChat.getChannel(
      somePlainGroupChannel.channel.id
    )
    let plainMessage: Message
    let cipheredMessage: Message | undefined

    const disconnect1 = somePlainGroupChannel.channel.connect((msg) => {
      plainMessage = msg
    })
    const disconnect2 = sameEncryptedGroupChannel.connect((msg) => {
      cipheredMessage = msg
    })

    await somePlainGroupChannel.channel.sendText("Random text", { files: filesFromInput })
    await sleep(200) // history calls have around 130ms of cache time
    const plainHistory = await somePlainGroupChannel.channel.getHistory()
    const cipheredHistory = await sameEncryptedGroupChannel.getHistory()
    expect(plainMessage).toBeDefined()
    expect(cipheredMessage).toBeDefined()
    expect(plainMessage.text).toBe("Random text")
    expect(cipheredMessage.text).toBe("Random text")
    expect(plainHistory.messages[0].text).toBe("Random text")
    expect(cipheredHistory.messages[0].text).toBe("Random text")
    expect(plainHistory.messages[0].files.length).toBe(3)
    expect(cipheredHistory.messages[0].files.length).toBe(3)
    await somePlainGroupChannel.channel.delete({ soft: false })
    await sameEncryptedGroupChannel.delete({ soft: false })
    await someRandomUser1.delete({ soft: false })
    disconnect1()
    disconnect2()
  }, 20000)

  test("should be able to decrypt text and file messages sent using a previous encryption key", async () => {
    const file1 = fs.createReadStream("tests/fixtures/pblogo1.png")
    const file2 = fs.createReadStream("tests/fixtures/pblogo2.png")
    const file3 = fs.createReadStream("tests/fixtures/pblogo3.png")

    const filesFromInput = [
      { stream: file1, name: "pblogo1.png", mimeType: "image/png" },
      { stream: file2, name: "pblogo2.png", mimeType: "image/png" },
      { stream: file3, name: "pblogo3.png", mimeType: "image/png" },
    ]

    const encryptedChat1 = await createChatInstance({
      shouldCreateNewInstance: true,
      config: {
        cryptoModule: CryptoModule.aesCbcCryptoModule({ cipherKey: "pubnubenigma" }),
        userId: "some-user-1",
      },
    })
    const encryptedChat2 = await createChatInstance({
      shouldCreateNewInstance: true,
      config: {
        cryptoModule: CryptoModule.aesCbcCryptoModule({ cipherKey: "another-pubnubenigma" }),
        userId: "some-user-2",
      },
    })
    const someRandomUser1 = await encryptedChat1.createUser(makeid(), { name: "random-1" })

    const someGroupChannel = await encryptedChat1.createGroupConversation({
      users: [someRandomUser1],
    })

    await someGroupChannel.channel.sendText("Random text", { files: filesFromInput })
    await sleep(200) // history calls have around 130ms of cache time
    const firstCypherKeyHistory = await someGroupChannel.channel.getHistory()
    expect(firstCypherKeyHistory.messages[0].text).toBe("Random text")
    expect(firstCypherKeyHistory.messages[0].files.length).toBe(3)

    const sameChannelWithSecondCryptoKey = await encryptedChat2.getChannel(
      someGroupChannel.channel.id
    )
    const secondCypherKeyHistory = await sameChannelWithSecondCryptoKey.getHistory()
    expect(secondCypherKeyHistory.messages[0].text.startsWith("UE5FRAFBQ1JIE")).toBeTruthy()
    expect(secondCypherKeyHistory.messages[0].files.length).toBe(0)

    // decryption with the original key
    const decryptedMessages = secondCypherKeyHistory.messages.map((msg) => {
      if (msg.error && msg.error.startsWith("Error while decrypting message content")) {
        return CryptoUtils.decrypt({
          chat: encryptedChat2,
          message: msg,
          decryptor: (encryptedContent) => {
            const cryptoModule = CryptoModule.aesCbcCryptoModule({
              cipherKey: "pubnubenigma",
            })
            const enc = new TextDecoder("utf-8")
            const decryptedArrayBuffer = cryptoModule.decrypt(encryptedContent) as ArrayBuffer
            if (!decryptedArrayBuffer.byteLength) {
              return {
                type: "text",
                files: [],
                text: "(This message is corrupted)",
              }
            }
            return JSON.parse(enc.decode(decryptedArrayBuffer))
          },
        })
      }

      return msg
    })
    expect(decryptedMessages[0].text).toBe("Random text")
    expect(decryptedMessages[0].files.length).toBe(3)
    filesFromInput.forEach((fileFromInput, index) => {
      expect(decryptedMessages[0].files[index].name).toBe(fileFromInput.name)
      expect(decryptedMessages[0].files[index].type).toBe(fileFromInput.mimeType)
    })

    await someGroupChannel.channel.delete({ soft: false })
    await someRandomUser1.delete({ soft: false })
  }, 20000)

  test("should send a message with custom body and transform it to TextMessageContent when received", async () => {
    const chat = await createChatInstance({
      shouldCreateNewInstance: true,
      config: {
        customPayloads: {
          getMessagePublishBody: ({ type, text, files }) => {
            return {
              body: {
                message: {
                  content: {
                    text,
                  },
                },
                files,
              },
              messageType: type,
            }
          },
          getMessageResponseBody: (messageParams: MessageDTOParams) => {
            return {
              text: messageParams.message.body.message.content.text,
              type: messageParams.message.messageType,
              files: messageParams.message.body.files,
            }
          },
        },
      },
    })

    const someChannel =
      (await chat.getChannel("some-channel-custom-body")) ||
      (await chat.createChannel("some-channel-custom-body", { name: "Custom body channel" }))

    await someChannel.sendText("Hello world!")
    await sleep(200)

    const historyObject = await someChannel.getHistory({ count: 1 })
    expect(historyObject.messages[0].text).toBe("Hello world!")
  })

  test("should send a message with custom body and crash if getMessageResponseBody is incorrect", async () => {
    const chat = await createChatInstance({
      shouldCreateNewInstance: true,
      config: {
        customPayloads: {
          getMessageResponseBody: (messageParams: MessageDTOParams) => {
            return {
              text: messageParams.message.it.does.not.exist,
              type: messageParams.message.messageType,
              files: messageParams.message.body.files,
            }
          },
        },
      },
    })

    const someChannel =
      (await chat.getChannel("some-channel-custom-body")) ||
      (await chat.createChannel("some-channel-custom-body", { name: "Custom body channel" }))

    await someChannel.sendText("Hello world!")
    await sleep(200)
    let thrownErrorMessage = ""

    try {
      await someChannel.getHistory()
    } catch (error) {
      thrownErrorMessage = error.message
    }

    expect(thrownErrorMessage).toBe("Cannot read properties of undefined (reading 'does')")
  })

  test("should be able to pass custom edit and delete action names", async () => {
    const chat = await createChatInstance({
      shouldCreateNewInstance: true,
      config: {
        customPayloads: {
          editMessageActionName: "field-updated",
          deleteMessageActionName: "field-removed",
        },
      },
    })

    const someChannel =
      (await chat.getChannel("some-channel-custom-actions")) ||
      (await chat.createChannel("some-channel-custom-actions", { name: "Custom actions channel" }))

    await someChannel.sendText("Hello world!")
    await sleep(200)
    let historyObject = await someChannel.getHistory({ count: 1 })
    await historyObject.messages[0].editText("Edited text")
    await sleep(200)
    historyObject = await someChannel.getHistory({ count: 1 })
    expect(historyObject.messages[0].text).toBe("Edited text")
    expect(historyObject.messages[0].actions["field-updated"]).toBeDefined()
    expect(historyObject.messages[0].actions[defaultEditActionName]).toBeUndefined()
    expect(historyObject.messages[0].deleted).toBe(false)
    await historyObject.messages[0].delete({ soft: true })
    await sleep(200)
    historyObject = await someChannel.getHistory({ count: 1 })
    expect(historyObject.messages[0].deleted).toBe(true)
    expect(historyObject.messages[0].actions["field-removed"]).toBeDefined()
    expect(historyObject.messages[0].actions[defaultDeleteActionName]).toBeUndefined()
  })

  test("should work fine even for multiple schemas on different channels", async () => {
    const chat = await createChatInstance({
      shouldCreateNewInstance: true,
      config: {
        customPayloads: {
          getMessagePublishBody: ({ type, text, files }, channelId) => {
            if (channelId === "different-schema-for-no-reason") {
              return {
                different: {
                  schema: {
                    for: {
                      no: {
                        reason: text,
                      },
                    },
                  },
                  files,
                },
                messageType: type,
              }
            }

            return {
              body: {
                message: {
                  content: {
                    text,
                  },
                },
                files,
              },
              messageType: type,
            }
          },
          getMessageResponseBody: (messageParams: MessageDTOParams) => {
            if (messageParams.channel === "different-schema-for-no-reason") {
              return {
                text: messageParams.message.different.schema.for.no.reason,
                type: messageParams.message.messageType,
                files: messageParams.message.different.files,
              }
            }

            return {
              text: messageParams.message.body.message.content.text,
              type: messageParams.message.messageType,
              files: messageParams.message.body.files,
            }
          },
        },
      },
    })

    const someChannel =
      (await chat.getChannel("some-channel-custom-body")) ||
      (await chat.createChannel("some-channel-custom-body", { name: "Custom body channel" }))

    await someChannel.sendText("One type of schema")
    await sleep(200)

    const someChannelWithDifferentSchema =
      (await chat.getChannel("different-schema-for-no-reason")) ||
      (await chat.createChannel("different-schema-for-no-reason", {
        name: "Custom body channel with a different schema",
      }))

    await someChannelWithDifferentSchema.sendText("Another type of schema")
    await sleep(200)

    const someChannelHistoryObject = await someChannel.getHistory({ count: 1 })
    const someChannelWithDifferentSchemaHistoryObject =
      await someChannelWithDifferentSchema.getHistory({ count: 1 })
    expect(someChannelHistoryObject.messages[0].text).toBe("One type of schema")
    expect(someChannelWithDifferentSchemaHistoryObject.messages[0].text).toBe(
      "Another type of schema"
    )
  })

  test("should be able to read live messages with custom payloads as well", async () => {
    const chat = await createChatInstance({
      shouldCreateNewInstance: true,
      config: {
        customPayloads: {
          getMessagePublishBody: ({ type, text, files }) => {
            return {
              body: {
                message: {
                  content: {
                    text,
                  },
                },
                files,
              },
              messageType: type,
            }
          },
          getMessageResponseBody: (messageParams: MessageDTOParams) => {
            return {
              text: messageParams.message.body.message.content.text,
              type: messageParams.message.messageType,
              files: messageParams.message.body.files,
            }
          },
        },
      },
    })

    const someChannel =
      (await chat.getChannel("some-channel-custom-body3")) ||
      (await chat.createChannel("some-channel-custom-body3", { name: "Custom body channel" }))

    let liveMessageText = ""

    const disconnect = someChannel.connect((msg) => {
      liveMessageText = msg.text
    })

    await someChannel.sendText("Hello live world!")
    await sleep(500)
    expect(liveMessageText).toBe("Hello live world!")
    await someChannel.sendText("Hello live world! Number 2")
    await sleep(500)
    expect(liveMessageText).toBe("Hello live world! Number 2")
    disconnect()
  })

  test("should be able to read live encrypted messages with custom payloads", async () => {
    const chat = await createChatInstance({
      shouldCreateNewInstance: true,
      config: {
        customPayloads: {
          getMessagePublishBody: ({ type, text, files }) => {
            return {
              body: {
                message: {
                  content: {
                    text,
                  },
                },
                files,
              },
              messageType: type,
            }
          },
          getMessageResponseBody: (messageParams: MessageDTOParams) => {
            return {
              text: messageParams.message.body.message.content.text,
              type: messageParams.message.messageType,
              files: messageParams.message.body.files,
            }
          },
        },
        cryptoModule: CryptoModule.aesCbcCryptoModule({ cipherKey: "pubnubenigma" }),
      },
    })

    const someChannel =
      (await chat.getChannel("some-channel-custom-body3")) ||
      (await chat.createChannel("some-channel-custom-body3", { name: "Custom body channel" }))

    let liveMessageText = ""

    const disconnect = someChannel.connect((msg) => {
      liveMessageText = msg.text
    })

    await someChannel.sendText("Hello encrypted world!")
    await sleep(500)
    expect(liveMessageText).toBe("Hello encrypted world!")
    await someChannel.sendText("Hello encrypted world! Number 2")
    await sleep(500)
    expect(liveMessageText).toBe("Hello encrypted world! Number 2")
    disconnect()
  })

  test("should be able to read historic encrypted messages with custom payloads", async () => {
    const chat = await createChatInstance({
      shouldCreateNewInstance: true,
      config: {
        customPayloads: {
          getMessagePublishBody: ({ type, text, files }) => {
            return {
              body: {
                message: {
                  content: {
                    text,
                  },
                },
                files,
              },
              messageType: type,
            }
          },
          getMessageResponseBody: (messageParams: MessageDTOParams) => {
            return {
              text: messageParams.message.body.message.content.text,
              type: messageParams.message.messageType,
              files: messageParams.message.body.files,
            }
          },
        },
        cryptoModule: CryptoModule.aesCbcCryptoModule({ cipherKey: "pubnubenigma" }),
      },
    })

    const someChannel =
      (await chat.getChannel("some-channel-custom-body3")) ||
      (await chat.createChannel("some-channel-custom-body3", { name: "Custom body channel" }))

    await someChannel.sendText("Hello encrypted world!")
    await someChannel.sendText("Hello encrypted world! Number 2")
    await sleep(500)
    const historyObject = await someChannel.getHistory({ count: 2 })
    expect(historyObject.messages[0].text).toBe("Hello encrypted world!")
    expect(historyObject.messages[1].text).toBe("Hello encrypted world! Number 2")
  })
})
