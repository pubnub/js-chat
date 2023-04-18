import { Chat, Channel } from "../src"
import * as dotenv from "dotenv"
import { initTestChannel, initTestChat, createRandomUserId } from "./testUtils"

dotenv.config()

describe("User test", () => {
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

  test("Should be able to create user", async () => {
    const userId = createRandomUserId()
    const userData = {
      name: "John Smith",
      profileUrl: "https://randomuser.me/api/portraits/men/1.jpg",
      custom: {
        title: "VP Marketing",
        linkedInUrl: "https://www.linkedin.com/mkelly_vp",
      },
    }

    const createdUser = await chat.createUser(userId, userData)

    expect(createdUser).toBeDefined()
    expect(createdUser.id).toBe(userId)
    expect(createdUser.name).toEqual(userData.name)
    expect(createdUser.profileUrl).toEqual(userData.profileUrl)
    expect(createdUser.custom).toEqual(userData.custom)
  })

  test("Should be able to update user", async () => {
    const userId = createRandomUserId()
    const initialUserData = {
      name: "John Smith",
      profileUrl: "https://randomuser.me/api/portraits/men/1.jpg",
      custom: {
        title: "VP Marketing",
        linkedInUrl: "https://www.linkedin.com/mkelly_vp",
      },
    }
    await chat.createUser(userId, initialUserData)

    const updatedUserData = {
      name: "Jane Smith",
      profileUrl: "https://randomuser.me/api/portraits/women/1.jpg",
      custom: {
        title: "VP Sales",
        linkedInUrl: "https://www.linkedin.com/jsmith_vp",
      },
    }
    await chat.updateUser(userId, updatedUserData)

    const fetchedUser = await chat.getUser(userId)

    if (fetchedUser) {
      expect(fetchedUser.id).toBe(userId)
      expect(fetchedUser.name).toEqual(updatedUserData.name)
      expect(fetchedUser.profileUrl).toEqual(updatedUserData.profileUrl)
      expect(fetchedUser.custom).toEqual(updatedUserData.custom)
    } else {
      fail("fetchedUser is null")
    }
  })

  test("Should be able to delete (archive) user", async () => {
    // Create a new user
    const userId = createRandomUserId()
    const initialUserData = {
      name: "John Smith",
      profileUrl: "https://randomuser.me/api/portraits/men/1.jpg",
      custom: {
        title: "VP Marketing",
        linkedInUrl: "https://www.linkedin.com/mkelly_vp",
      },
    }
    await chat.createUser(userId, initialUserData)

    const userToDelete = await chat.getUser(userId)
    if (!userToDelete) {
      fail("User to delete is null")
    }
    if (userToDelete) {
      const deleteResult = await chat.deleteUser(userId, { soft: false })
      expect(deleteResult).toBe(true)
    }

    const fetchedUser = await chat.getUser(userId)
    expect(fetchedUser).toBeNull()
  })
})
