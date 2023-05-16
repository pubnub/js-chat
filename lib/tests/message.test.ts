import { Chat, Channel } from "../src"
import * as dotenv from "dotenv"
import { initTestChannel, initTestChat } from "./testUtils"

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

    console.log(`Messages: ${messages}`)

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
  jest.retryTimes(3)
})
