import { Chat, User } from "../src"
import { createChatInstance, createRandomUser, sleep } from "./utils"
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
    const callback = jest.fn((user) => {
      return (updatedUser = user)
    })

    const stopUpdates = user.streamUpdates(callback)
    await user.update({ name })
    await sleep(150)

    expect(callback).toHaveBeenCalledWith(updatedUser)
    expect(updatedUser.name).toEqual(name)

    stopUpdates()
  })

  test("should report a user", async () => {
    const reportReason = "Inappropriate behavior"
    await user.report(reportReason)
    await sleep(150) // history calls have around 130ms of cache time

    const adminChannel =
      (await chat.getChannel(INTERNAL_ADMIN_CHANNEL)) ||
      (await chat.createChannel(INTERNAL_ADMIN_CHANNEL, { name: "admin channel" }))
    expect(adminChannel).toBeDefined()

    const adminChannelHistory = await adminChannel.getHistory({ count: 1 })
    const reportMessage = adminChannelHistory.messages[0]

    expect(reportMessage?.content.type).toBe("report")
    expect(reportMessage?.content.reportedUserId).toBe(user.id)
    expect(reportMessage?.content.reason).toBe(reportReason)
  })

  test("Should be able to create, fetch, and validate multiple users", async () => {
    const usersToCreate = []
    const numUsers = 5

    for (let i = 0; i < numUsers; i++) {
      const newUser = await createRandomUser()
      usersToCreate.push(newUser)
    }

    for (const createdUser of usersToCreate) {
      const fetchedUser = await chat.getUser(createdUser.id)

      expect(fetchedUser).toBeDefined()
      expect(fetchedUser.id).toBe(createdUser.id)
      expect(fetchedUser.name).toEqual(createdUser.name)
    }
  })

  test("Should fail to update a non-existent user", async () => {
    const nonExistentUserId = "nonexistentuserid"

    try {
      const nonExistentUser = await chat.getUser(nonExistentUserId)
      await nonExistentUser.update({})
      fail("Updating a non-existent user should fail")
    } catch (error) {
      expect(error.message).toContain("Cannot read properties of null (reading 'update')")
    }
  })

  test("Should fail to delete a non-existent user", async () => {
    const nonExistentUserId = "nonexistentuserid"

    try {
      const nonExistentUser = await chat.getUser(nonExistentUserId)
      await nonExistentUser.delete()
      fail("Deleting a non-existent user should fail")
    } catch (error) {
      expect(error.message).toContain("Cannot read properties of null (reading 'delete')")
    }
  })
})
