import { Chat, Channel } from "../src"

describe("Typing indicator test", () => {
  let chat: Chat
  let channel: Channel

  beforeAll(() => {
    chat = Chat.init({
      publishKey: "demo",
      subscribeKey: "demo",
      userId: "test-user",
    })
    console.log("chat initialized", chat)
  })

  beforeEach(async () => {
    channel = await chat.getChannel("test-react-channel-C1")
  })

  beforeEach(() => {
    jest.resetAllMocks()
  })

  afterEach(async () => {
    await channel.disconnect()
  })

  test("should call the callback with the typing value when a typing signal is received", async () => {
    const callback = jest.fn()
    await channel.getTyping(callback)
    await channel.sendTyping(true)
    await new Promise((resolve) => setTimeout(resolve, 2000))
    expect(callback).toHaveBeenCalled()
  })
})
