import { Chat, Channel } from "../src"

describe("Typing indicator test", () => {
  let chat: Chat
  let channel: Channel | null

  beforeAll(() => {
    chat = Chat.init({
      publishKey: "pub-c-8a081a4d-b13d-42e7-81a8-fe5bfc090ab5",
      subscribeKey: "sub-c-cee9c6c0-72b1-4a7a-8cb1-4cccb728250a",
      userId: "test-user",
    })
  })

  beforeEach(async () => {
    channel = await chat.getChannel("test-react-channel-C1")
    if (!channel) {
      channel = await chat.createChannel("test-react-channel-C1", {
        name: "test-channel",
      })
    }
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
    await new Promise((resolve) => setTimeout(resolve, 2000))
    expect(callback).toHaveBeenCalled()
  })
})
