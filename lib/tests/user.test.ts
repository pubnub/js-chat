import { Chat, INTERNAL_MODERATION_PREFIX, User } from "../src"
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

  test("should update the user even if they're a member of a particular channel", async () => {
    let someUser = await chat.getUser("test-user-chatsdk0")
    if (!someUser) {
      someUser = await chat.createUser("test-user-chatsdk0", { name: "Chat SDK user 0" })
    }
    let someChannel = await chat.getChannel("some-public-channel")
    if (!someChannel) {
      someChannel = await chat.createPublicConversation({
        channelId: "some-public-channel",
        channelData: { name: "Public channel test" },
      })
    }
    await chat.sdk.objects.setChannelMembers({
      channel: someChannel.id,
      uuids: [someUser.id],
    })

    const stopUpdates = User.streamUpdatesOn([someUser], (updatedUsers) => {
      someUser = updatedUsers[0]
    })
    await someUser.update({ name: "update number 1" })
    await sleep(1000)
    expect(someUser.name).toBe("update number 1")
    await someUser.update({ name: "update number 2" })
    await sleep(1000)
    expect(someUser.name).toBe("update number 2")

    stopUpdates()
  })

  test("should update the user even if they're not a member of a particular channel", async () => {
    let someUser = await chat.getUser("test-user-chatsdk1")
    if (!someUser) {
      someUser = await chat.createUser("test-user-chatsdk1", { name: "Chat SDK user 1" })
    }
    let someChannel = await chat.getChannel("some-public-channel-2")
    if (!someChannel) {
      someChannel = await chat.createPublicConversation({
        channelId: "some-public-channel-2",
        channelData: { name: "Public channel test 2" },
      })
    }
    const { members } = await someChannel.getMembers()

    expect(members.length).toBe(0)
    const stopUpdates = User.streamUpdatesOn([someUser], (updatedUsers) => {
      someUser = updatedUsers[0]
    })
    await someUser.update({ name: "update number 1" })
    await sleep(1000)
    expect(someUser.name).toBe("update number 1")
    await someUser.update({ name: "update number 2" })
    await sleep(1000)
    expect(someUser.name).toBe("update number 2")

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

  test("Should apply filter to 'getMemberships'", async () => {
    jest.spyOn(chat.sdk.objects, "getMemberships")
    const commonParams = {
      include: {
        totalCount: true,
        customFields: true,
        channelFields: true,
        customChannelFields: true,
        channelTypeField: true,
        statusField: true,
        channelStatusField: true,
      },
      uuid: chat.currentUser.id,
    }

    await chat.currentUser.getMemberships({ filter: "channel.id like 'hello*'" })
    expect(chat.sdk.objects.getMemberships).toHaveBeenCalledWith({
      ...commonParams,
      filter: `!(channel.id LIKE '${INTERNAL_MODERATION_PREFIX}*') && (channel.id like 'hello*')`,
    })

    await chat.currentUser.getMemberships({ filter: "channel.name like '*test-channel'" })
    expect(chat.sdk.objects.getMemberships).toHaveBeenCalledWith({
      ...commonParams,
      filter: `!(channel.id LIKE '${INTERNAL_MODERATION_PREFIX}*') && (channel.name like '*test-channel')`,
    })

    await chat.currentUser.getMemberships()
    expect(chat.sdk.objects.getMemberships).toHaveBeenCalledWith({
      ...commonParams,
      filter: `!(channel.id LIKE '${INTERNAL_MODERATION_PREFIX}*')`,
    })

    const exampleResponse = {
      prev: undefined,
      status: 200,
      totalCount: 307,
      next: "MTAw",
      data: [
        {
          channel: {
            id: "0053d903-62d5-4f14-91cc-50aa90b1ab30",
            name: "0053d903-62d5-4f14-91cc-50aa90b1ab30",
            description: null,
            type: "group",
            status: null,
            custom: null,
            updated: "2024-02-28T13:04:28.210319Z",
            eTag: "41ba0b6a52df2cc52775a83674ad4ba1",
          },
          status: null,
          custom: null,
          updated: "2024-02-28T13:04:28.645304Z",
          eTag: "AZO/t53al7m8fw",
        },
        {
          channel: { id: "019b58bd-3592-4184-8bc9-ce4a3ea87b37" },
          status: null,
          custom: null,
          updated: "2024-02-29T09:06:21.629495Z",
          eTag: "AZO/t53al7m8fw",
        },
        {
          channel: { id: "0336a32b-3568-42ec-8664-48f05f479928" },
          status: null,
          custom: null,
          updated: "2024-05-21T12:12:51.439348Z",
          eTag: "AZO/t53al7m8fw",
        },
      ],
    }

    jest.spyOn(chat.sdk.objects, "getMemberships").mockImplementation(() => exampleResponse)

    const response = await chat.currentUser.getMemberships()
    expect(response).toEqual(
      expect.objectContaining({
        page: {
          prev: exampleResponse.prev,
          next: exampleResponse.next,
        },
        total: exampleResponse.totalCount,
        status: exampleResponse.status,
      })
    )
    expect(response.memberships.map((m) => m.channel.id)).toEqual(
      exampleResponse.data.map((m) => m.channel.id)
    )
  })
})
