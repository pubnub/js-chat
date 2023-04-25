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
    const callback = jest.fn()
    await channel?.getTyping(callback)
    await channel?.startTyping()
    await new Promise((resolve) => setTimeout(resolve, 5000))
    expect(callback).toHaveBeenCalledWith(["test-user"])
  })
  jest.retryTimes(3)
})
