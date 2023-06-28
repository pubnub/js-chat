import { Chat, User, ReportMessageContent, MessageType } from "../src"
import * as dotenv from "dotenv"
import { initTestChat, createRandomUserId } from "./testUtils"
import { INTERNAL_ADMIN_CHANNEL } from "../src"

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

    const user1 = await chat.createUser(createRandomUserId(), {})
    const user2 = await chat.createUser(createRandomUserId(), {})

    const users = [user1, user2]

    const callback = jest.fn((updatedUsers) => {
      expect(updatedUsers).toEqual(users)
    })

    const unsubscribe = User.streamUpdatesOn(users, callback)

    await new Promise<void>((resolve) => setTimeout(resolve, 1000))

    await Promise.all(users.map(async (user) => await user.delete()))

    unsubscribe()
  })

  test("should report a user", async () => {
    jest.retryTimes(3)

    const userToReport = await chat.createUser(createRandomUserId(), {
      name: "User to be Reported",
      profileUrl: "https://randomuser.me/api/portraits/men/66.jpg",
      custom: {
        title: "User Role",
      },
    })

    const reportReason = "Inappropriate behavior"

    await userToReport.report(reportReason)

    const adminChannel = INTERNAL_ADMIN_CHANNEL
    const adminChannelObjPromise = chat.getChannel(adminChannel)
    if (!adminChannelObjPromise) {
      throw new Error("Admin channel is undefined")
    }

    const adminChannelObj = await adminChannelObjPromise

    if (!adminChannelObj) {
      throw new Error("Admin channel object is null")
    }

    const adminChannelHistory = await adminChannelObj.getHistory({ count: 1 })

    const reportedUserAfterReport = adminChannelHistory.messages[0]

    if (reportedUserAfterReport?.content.type === MessageType.REPORT) {
      const reportContent = reportedUserAfterReport.content as ReportMessageContent
      expect(reportContent.reportedUserId).toBe(userToReport.id)
      expect(reportContent.reason).toBe(reportReason)
    } else {
      throw new Error("Reported message content is not of type 'REPORT'")
    }
  }, 30000)

  jest.retryTimes(3)
})
