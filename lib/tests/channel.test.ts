import { Chat, Channel } from "../src"
import * as dotenv from "dotenv"
import { initTestChannel, initTestChat, createRandomUserId } from "./testUtils"

dotenv.config()

describe("Channel test", () => {
  let chat: Chat
  let channel: Channel | null

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

  test("should create a channel", async () => {
    const channelId = createRandomUserId()
    const channelName = "Test Channel"
    const channelDescription = "This is a test channel"

    const channelData = {
      name: channelName,
      description: channelDescription,
    }

    const createdChannel = await chat.createChannel(channelId, channelData)

    expect(createdChannel).toBeDefined()
    expect(createdChannel.id).toEqual(channelId)
    expect(createdChannel.name).toEqual(channelName)
    expect(createdChannel.description).toEqual(channelDescription)
  })

  test("should soft delete a channel", async () => {
    const channelId = createRandomUserId()
    const channelName = "Test Channel"
    const channelDescription = "This is a test channel"

    const channelData = {
      name: channelName,
      description: channelDescription,
    }

    const createdChannel = await chat.createChannel(channelId, channelData)

    const deleteOptions = {
      soft: true,
    }

    const isDeleted = await createdChannel.delete(deleteOptions)

    expect(isDeleted).toBeTruthy()
  })

  test("should list channels", async () => {
    // Create two channels
    const channelId1 = createRandomUserId()
    const channelId2 = createRandomUserId()

    const channelName1 = "Test Channel 1"
    const channelName2 = "Test Channel 2"

    const channelData1 = {
      name: channelName1,
    }

    const channelData2 = {
      name: channelName2,
    }

    const createdChannel1 = await chat.createChannel(channelId1, channelData1)
    const createdChannel2 = await chat.createChannel(channelId2, channelData2)

    // List channels
    const listedChannels = await chat.listChannels()

    // Check if both created channels are listed
    const channel1InList = listedChannels.some((channel) => channel.id === channelId1)
    const channel2InList = listedChannels.some((channel) => channel.id === channelId2)

    expect(channel1InList).toBeTruthy()
    expect(channel2InList).toBeTruthy()
  })
})
