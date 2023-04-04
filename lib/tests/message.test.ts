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
    expect(elapsedTime).toBeLessThan(500)
  })
})
