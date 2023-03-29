import { Chat, Channel } from "../src"

describe("Send message test", () => {
  afterAll(() => setTimeout(() => process.exit(), 1000))
  test("should verify if message sent", async () => {
    const chat = Chat.init({
      publishKey: "demo",
      subscribeKey: "demo",
      userId: "test-user",
    })

    const messages = []
    const response = await chat.getChannel("test-react-channel-C1")
    let receiveTime = 0

    response.connect((message) => {
      receiveTime = Date.now()
      messages.push(message.content)
    })

    const sendTime = Date.now()
    await response.sendText("message")

    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
    await sleep(2000)

    const elapsedTime = receiveTime - sendTime
    console.log(elapsedTime)
    expect(elapsedTime).toBeLessThan(500)
  })
})
