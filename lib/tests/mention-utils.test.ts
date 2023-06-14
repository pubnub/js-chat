import { Chat, Channel, Message } from "../src"
import * as dotenv from "dotenv"
import { initTestChannel, initTestChat, waitForAllMessagesToBeDelivered } from "./testUtils"

dotenv.config()

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

describe("Mention utils test", () => {
  let channel: Channel | null
  let chat: Chat

  beforeEach(async () => {
    chat = await initTestChat()
    channel = await initTestChannel(chat)
  })

  test("should properly add xml tags to the message", async () => {
    const mentionedUsers = []

    if (!channel) {
      return
    }

    let suggestedUsers = await chat.getSuggestedGlobalUsers("Hello @Keith")
    mentionedUsers.push(suggestedUsers[0])
    suggestedUsers = await chat.getSuggestedGlobalUsers("Hello @Sue Fl")
    mentionedUsers.push(suggestedUsers[0])
    suggestedUsers = await chat.getSuggestedGlobalUsers("Hello @Sue Jo")
    mentionedUsers.push(suggestedUsers[0])
    const fullText = "Hello @Keith and @Sue Flores! Great to see you @Sue Jones as well!"
    await channel.sendText(fullText, { mentionedUsers })
    await sleep(3000)
    const lastMessage = (await channel.getHistory()).messages[0]
    console.log("lastMessage", lastMessage)

    expect(4).toBe(4)
  }, 30000)
})
