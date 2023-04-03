import { Chat, Channel } from "../src"

describe("Send message test", () => {
  let channel: Channel | null
  let chat: Chat

  beforeEach(async () => {
    chat = Chat.init({
      publishKey: "pub-c-8a081a4d-b13d-42e7-81a8-fe5bfc090ab5",
      subscribeKey: "sub-c-cee9c6c0-72b1-4a7a-8cb1-4cccb728250a",
      userId: "test-user",
    })
    channel = await chat.getChannel("test-react-channel-C1")
    if (!channel) {
      channel = await chat.createChannel("test-react-channel-C1", {
        name: "test-channel",
      })
    }
  })

  test("should verify if message sent", async () => {
    const messages = []
    let receiveTime = 0

    channel?.connect((message) => {
      receiveTime = Date.now()
      messages.push(message.content)
    })

    const sendTime = Date.now()
    await channel?.sendText("message")

    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
    await sleep(2000)

    const elapsedTime = receiveTime - sendTime
    console.log(elapsedTime)
    expect(elapsedTime).toBeLessThan(500)
  })
})
