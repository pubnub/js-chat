import { Chat, Channel, Message } from "../src"
import * as dotenv from "dotenv"
import { initTestChannel, initTestChat, waitForAllMessagesToBeDelivered } from "./testUtils"

dotenv.config()

describe("Mention utils test", () => {
  let channel: Channel | null
  let chat: Chat

  beforeEach(async () => {
    chat = await initTestChat()
    channel = await initTestChannel(chat)
  })

  test("should properly add xml tags to the message", async () => {
    const mentionedUsers = []
  }, 30000)
})
