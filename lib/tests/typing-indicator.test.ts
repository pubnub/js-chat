import { Channel } from "../src"
import { createChatInstance, createRandomChannel, sleep } from "./utils"

describe("Typing indicator test", () => {
  jest.retryTimes(3)

  let channel: Channel

  beforeAll(async () => {
    await createChatInstance()
  })

  beforeEach(async () => {
    channel = await createRandomChannel()
  })

  test("should call the callback with the typing value when a typing signal is received", async () => {
    const callback = jest.fn()

    const unsubscribe = await channel?.getTyping(callback)
    await channel?.startTyping()
    await sleep(2000)

    expect(callback).toHaveBeenCalledWith(["test-user"])

    unsubscribe()
  })

  test("should not call the callback when no typing signal is received", async () => {
    const callback = jest.fn()

    const unsubscribe = await channel?.getTyping(callback)
    await sleep(2000)

    expect(callback).not.toHaveBeenCalled()

    unsubscribe()
  })
})
