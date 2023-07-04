import { Chat, User, ReportMessageContent, MessageType } from "../src"
import { createChatInstance, createRandomUser, sleep } from "./utils"
import { createRandomUserId } from "./testUtils"
import { INTERNAL_ADMIN_CHANNEL } from "../src"

describe("User test", () => {
  jest.retryTimes(3)

  let chat: Chat
  let user: User

  beforeAll(async () => {
    chat = await createChatInstance()
  })

  beforeEach(async () => {
    user = await createRandomUser()
  })

  test("Should automatically create chat user while initializing", () => {
    expect(chat.currentUser).toBeDefined()
    expect(chat.currentUser.id).toBe(chat.sdk.getUUID())
  })

  test("Should be able to create and fetch user", async () => {
    expect(user).toBeDefined()
    const fetchedUser = await chat.getUser(user.id)
    expect(fetchedUser).toBeDefined()
    expect(fetchedUser.name).toEqual(user.name)
  })

  test("Should be able to update user", async () => {
    const name = "Updated User"
    const updatedUser = await user.update({ name })
    expect(updatedUser.id).toBe(user.id)
    expect(updatedUser.name).toEqual(name)
  })

  test("Should be able to delete user", async () => {
    const deleteOptions = { soft: true }
    const { status } = (await user.delete(deleteOptions)) as User
    expect(status).toBe("deleted")

    const deleteResult = await user.delete()
    expect(deleteResult).toBe(true)
    const fetchedUser = await chat.getUser(user.id)
    expect(fetchedUser).toBeNull()
  })

  test("Should stream user updates and invoke the callback", async () => {
    let updatedUser
    const name = "Updated User"
    const callback = jest.fn((user) => (updatedUser = user))

    const stopUpdates = user.streamUpdates(callback)
    await user.update({ name })
    await sleep(150)

    expect(callback).toHaveBeenCalledTimes(1)
    expect(callback).toHaveBeenCalledWith(updatedUser)
    expect(updatedUser.name).toEqual(name)

    stopUpdates()
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
    await sleep(150)
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
})
