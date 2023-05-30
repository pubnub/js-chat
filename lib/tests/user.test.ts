import { Chat, User } from "../src"
import * as dotenv from "dotenv"
import { initTestChat, createRandomUserId } from "./testUtils"

dotenv.config()

describe("User test", () => {
  let chat: Chat

  beforeEach(async () => {
    chat = await initTestChat()
  })

  beforeEach(() => {
    jest.resetAllMocks()
  })

  test("Should be able to create user", async () => {
    jest.retryTimes(3)

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
    jest.retryTimes(3)

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
    jest.retryTimes(3)

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

  test("Should stream user updates and invoke the callback", async () => {
    const chat = await initTestChat()

    const user1 = await chat.createUser("user1", {})
    const user2 = await chat.createUser("user2", {})

    const users = [user1, user2]

    const callback = jest.fn((updatedUsers) => {
      expect(updatedUsers).toEqual(users)
    })

    const unsubscribe = User.streamUpdatesOn(users, callback)

    await new Promise<void>((resolve) => setTimeout(resolve, 1000))

    await Promise.all(users.map(async (user) => await user.delete()))

    unsubscribe()
  })

  jest.retryTimes(3)
})
