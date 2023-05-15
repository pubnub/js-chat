import { Chat, Channel } from "../src"
import * as dotenv from "dotenv"
import { initTestChannel, initTestChat } from "./testUtils"

dotenv.config()

describe("Typing indicator test", () => {
  let chat: Chat
  let channel: Channel | null

  jest.setTimeout(10000)
  beforeEach(async () => {
    chat = initTestChat()
    channel = await initTestChannel(chat)
  })

  beforeEach(() => {
    jest.resetAllMocks()
  })

  afterEach(async () => {
    await channel?.disconnect()
  })

  test("should call the callback with the typing value when a typing signal is received", async () => {
    jest.retryTimes(3)
    const callback = jest.fn()
    await channel?.getTyping(callback)
    await channel?.startTyping()
    await new Promise((resolve) => setTimeout(resolve, 5000))
    expect(callback).toHaveBeenCalledWith(["test-user"])
  })

  test("should fail when trying to get typing indicator of a disconnected channel", async () => {
    jest.retryTimes(3)
    const callback = jest.fn()

    await channel?.disconnect()

    try {
      await channel?.getTyping(callback)
      fail("Should have thrown an error")
    } catch (error) {
      expect(error).toBeInstanceOf(Error)
    }
  })

  test("should not call the callback when no typing signal is received", async () => {
    jest.retryTimes(3)
    const callback = jest.fn()

    await channel?.getTyping(callback)
    await new Promise((resolve) => setTimeout(resolve, 5000))

    expect(callback).not.toHaveBeenCalled()
  })

  test("should fail when trying to start typing on a disconnected channel", async () => {
    jest.retryTimes(3)

    await channel?.disconnect()

    try {
      await channel?.startTyping()
      fail("Should have thrown an error")
    } catch (error) {
      expect(error).toBeInstanceOf(Error)
    }
  })
})
