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

  test("should verify if message sent", async () => {
    jest.retryTimes(3)

    const messages = []
    let receiveTime = 0

    if (!channel) {
      throw new Error("Channel is undefined")
    }

    channel.connect((message) => {
      receiveTime = Date.now()
      messages.push(message.content)
    })

    const sendTime = Date.now()
    await channel?.sendText("message")

    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
    await sleep(2000)

    const elapsedTime = receiveTime - sendTime
    console.log(elapsedTime)
  })

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

  //Issue: Emoticon in UNICODE is not sent randomly.
  // Test case: "should send and receive unicode messages correctly"
  //Steps to  reproduce:
  // 1. Run test suite locally with - yarn test --forceExit
  // 2. Wait untill test cases will be executed
  // 3. If all test cases passed - run again untill test below will fail with erorr message:
  // Expected value: "😀"
  //     Received array: ["Привет", "你好", "こんにちは", "안녕하세요"]

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
      console.log(`Received message: ${message.content.text}`)
      messages.push(message.content.text)
    })

    const sendTime = Date.now()
    for (const unicodeMessage of unicodeMessages) {
      await channel.sendText(unicodeMessage)
    }

    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
    await sleep(2000)

    const elapsedTime = receiveTime - sendTime
    console.log(elapsedTime)

    console.log(`Messages: ${messages}`)

    for (const unicodeMessage of unicodeMessages) {
      expect(messages).toContain(unicodeMessage)
    }
  })
})
