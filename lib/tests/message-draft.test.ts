import { Channel, Chat } from "@pubnub/chat_internal"
import {
  createChatInstance,
  createRandomChannel,
  createRandomUser,
  renderMessagePart,
} from "./utils"
import { jest } from "@jest/globals"

describe("MessageDraft", function () {

  let chat: Chat
  let channel: Channel
  let messageDraft

  beforeAll(async () => {
    chat = await createChatInstance()
  })

  beforeEach(async () => {
    channel = await createRandomChannel()
    messageDraft = channel.createMessageDraft({ userSuggestionSource: "global" })
  })

  test("should mention 2 users", async () => {
    const [user1, user2] = await Promise.all([createRandomUser(), createRandomUser()])

    messageDraft.onChange("Hello @user1 and @user2")
    messageDraft.addMentionedUser(user1, 0)
    messageDraft.addMentionedUser(user2, 1)
    const messagePreview = messageDraft.getMessagePreview()

    expect(messagePreview.length).toBe(4)
    expect(messagePreview[0].type).toBe("text")
    expect(messagePreview[1].type).toBe("mention")
    expect(messagePreview[2].type).toBe("text")
    expect(messagePreview[3].type).toBe("mention")
    expect(messageDraft.value).toBe(`Hello @${user1.name} and @${user2.name}`)
    expect(messagePreview.map(renderMessagePart).join("")).toBe(
      `Hello @${user1.name} and @${user2.name}`
    )
    await Promise.all([user1.delete({ soft: false }), user2.delete({ soft: false })])
  })

  test("should mention 2 - 3 users next to each other", async () => {
    const [user1, user2, user3] = await Promise.all([
      createRandomUser(),
      createRandomUser(),
      createRandomUser(),
    ])

    messageDraft.onChange("Hello @user1 @user2 @user3")
    messageDraft.addMentionedUser(user1, 0)
    messageDraft.addMentionedUser(user2, 1)
    messageDraft.addMentionedUser(user3, 2)
    const messagePreview = messageDraft.getMessagePreview()

    expect(messagePreview.length).toBe(6)
    expect(messagePreview[0].type).toBe("text")
    expect(messagePreview[1].type).toBe("mention")
    expect(messagePreview[2].type).toBe("text")
    expect(messagePreview[3].type).toBe("mention")
    expect(messagePreview[4].type).toBe("text")
    expect(messagePreview[5].type).toBe("mention")
    expect(messagePreview.map(renderMessagePart).join("")).toBe(
      `Hello @${user1.name} @${user2.name} @${user3.name}`
    )
    expect(messageDraft.value).toBe(`Hello @${user1.name} @${user2.name} @${user3.name}`)
    await Promise.all([
      user1.delete({ soft: false }),
      user2.delete({ soft: false }),
      user3.delete({ soft: false }),
    ])
  })

  test("should mention 2 - 3 users with words between second and third", async () => {
    const [user1, user2, user3] = await Promise.all([
      createRandomUser(),
      createRandomUser(),
      createRandomUser(),
    ])

    messageDraft.onChange("Hello @user1 @user2 and @user3")
    messageDraft.addMentionedUser(user1, 0)
    messageDraft.addMentionedUser(user2, 1)
    messageDraft.addMentionedUser(user3, 2)
    const messagePreview = messageDraft.getMessagePreview()
    console.log(JSON.stringify(messagePreview))
    expect(messageDraft.value).toBe(`Hello @${user1.name} @${user2.name} and @${user3.name}`)
    expect(messagePreview.length).toBe(6)
    expect(messagePreview[0].type).toBe("text")
    expect(messagePreview[1].type).toBe("mention")
    expect(messagePreview[2].type).toBe("text")
    expect(messagePreview[3].type).toBe("mention")
    expect(messagePreview[4].type).toBe("text")
    expect(messagePreview[4].content.text).toBe(" and ")
    expect(messagePreview[5].type).toBe("mention")
    expect(messagePreview.map(renderMessagePart).join("")).toBe(
      `Hello @${user1.name} @${user2.name} and @${user3.name}`
    )
    expect(messageDraft.value).toBe(`Hello @${user1.name} @${user2.name} and @${user3.name}`)
    await Promise.all([
      user1.delete({ soft: false }),
      user2.delete({ soft: false }),
      user3.delete({ soft: false }),
    ])
  })

  test("should reference 2 channels", async () => {
    const [channel1, channel2] = await Promise.all([createRandomChannel(), createRandomChannel()])

    messageDraft.onChange("Hello #channel1 and #channl2")
    messageDraft.addReferencedChannel(channel1, 0)
    messageDraft.addReferencedChannel(channel2, 1)
    const messagePreview = messageDraft.getMessagePreview()

    expect(messagePreview.length).toBe(4)
    expect(messagePreview[0].type).toBe("text")
    expect(messagePreview[1].type).toBe("channelReference")
    expect(messagePreview[2].type).toBe("text")
    expect(messagePreview[3].type).toBe("channelReference")
    expect(messagePreview.map(renderMessagePart).join("")).toBe(
      `Hello #${channel1.name} and #${channel2.name}`
    )
    expect(messageDraft.value).toBe(`Hello #${channel1.name} and #${channel2.name}`)
    await Promise.all([channel1.delete({ soft: false }), channel2.delete({ soft: false })])
  })

  test("should reference 2 channels and 2 mentions", async () => {
    const [channel1, channel2] = await Promise.all([createRandomChannel(), createRandomChannel()])
    const [user1, user2] = await Promise.all([createRandomUser(), createRandomUser()])

    messageDraft.onChange("Hello #channel1 and @brad and #channel2 or @jasmine.")
    messageDraft.addReferencedChannel(channel1, 0)
    messageDraft.addReferencedChannel(channel2, 1)
    messageDraft.addMentionedUser(user1, 0)
    messageDraft.addMentionedUser(user2, 1)
    const messagePreview = messageDraft.getMessagePreview()

    expect(messagePreview.length).toBe(9)
    expect(messagePreview[0].type).toBe("text")
    expect(messagePreview[1].type).toBe("channelReference")
    expect(messagePreview[2].type).toBe("text")
    expect(messagePreview[3].type).toBe("mention")
    expect(messagePreview[4].type).toBe("text")
    expect(messagePreview[5].type).toBe("channelReference")
    expect(messagePreview[6].type).toBe("text")
    expect(messagePreview[7].type).toBe("mention")
    expect(messagePreview.map(renderMessagePart).join("")).toBe(
      `Hello #${channel1.name} and @${user1.name} and #${channel2.name} or @${user2.name}.`
    )
    expect(messageDraft.value).toBe(
      `Hello #${channel1.name} and @${user1.name} and #${channel2.name} or @${user2.name}.`
    )
    await Promise.all([channel1.delete({ soft: false }), channel2.delete({ soft: false })])
    await Promise.all([user1.delete({ soft: false }), user2.delete({ soft: false })])
  })

  test("should reference 2 channels and 2 mentions with commas", async () => {
    const [channel1, channel2] = await Promise.all([createRandomChannel(), createRandomChannel()])
    const [user1, user2] = await Promise.all([createRandomUser(), createRandomUser()])

    messageDraft.onChange("Hello #channel1, @brad, #channel2 or @jasmine")
    messageDraft.addReferencedChannel(channel1, 0)
    messageDraft.addReferencedChannel(channel2, 1)
    messageDraft.addMentionedUser(user1, 0)
    messageDraft.addMentionedUser(user2, 1)
    const messagePreview = messageDraft.getMessagePreview()

    expect(messagePreview.length).toBe(8)
    expect(messagePreview[0].type).toBe("text")
    expect(messagePreview[1].type).toBe("channelReference")
    expect(messagePreview[2].type).toBe("text")
    expect(messagePreview[3].type).toBe("mention")
    expect(messagePreview[4].type).toBe("text")
    expect(messagePreview[5].type).toBe("channelReference")
    expect(messagePreview[6].type).toBe("text")
    expect(messagePreview[7].type).toBe("mention")
    expect(messagePreview.map(renderMessagePart).join("")).toBe(
      `Hello #${channel1.name}, @${user1.name}, #${channel2.name} or @${user2.name}`
    )
    expect(messageDraft.value).toBe(
      `Hello #${channel1.name}, @${user1.name}, #${channel2.name} or @${user2.name}`
    )
    await Promise.all([channel1.delete({ soft: false }), channel2.delete({ soft: false })])
    await Promise.all([user1.delete({ soft: false }), user2.delete({ soft: false })])
  })

  test("should reference 2 channels and 2 mentions with commas - another variation", async () => {
    const [channel1, channel2, channel3] = await Promise.all([
      createRandomChannel(),
      createRandomChannel(),
      createRandomChannel(),
    ])
    const [user1, user2] = await Promise.all([createRandomUser(), createRandomUser()])

    messageDraft.onChange("Hello #channel1, @brad, #channel2, #some-random-channel, @jasmine")
    messageDraft.addReferencedChannel(channel1, 0)
    messageDraft.addReferencedChannel(channel2, 1)
    messageDraft.addReferencedChannel(channel2, 2)
    messageDraft.addMentionedUser(user1, 0)
    messageDraft.addMentionedUser(user2, 1)
    const messagePreview = messageDraft.getMessagePreview()

    expect(messagePreview.length).toBe(10)
    expect(messagePreview[0].type).toBe("text")
    expect(messagePreview[1].type).toBe("channelReference")
    expect(messagePreview[2].type).toBe("text")
    expect(messagePreview[3].type).toBe("mention")
    expect(messagePreview[4].type).toBe("text")
    expect(messagePreview[5].type).toBe("channelReference")
    expect(messagePreview[6].type).toBe("text")
    expect(messagePreview[7].type).toBe("channelReference")
    expect(messagePreview[8].type).toBe("text")
    expect(messagePreview[9].type).toBe("mention")
    expect(messagePreview.map(renderMessagePart).join("")).toBe(
      `Hello #${channel1.name}, @${user1.name}, #${channel2.name}, #${channel3.name}, @${user2.name}`
    )
    expect(messageDraft.value).toBe(
      `Hello #${channel1.name}, @${user1.name}, #${channel2.name}, #${channel3.name}, @${user2.name}`
    )
    await Promise.all([
      channel1.delete({ soft: false }),
      channel2.delete({ soft: false }),
      channel3.delete({ soft: false }),
    ])
    await Promise.all([user1.delete({ soft: false }), user2.delete({ soft: false })])
  })

  test("should add 2 text links and 2 plain links", async () => {
    messageDraft.onChange("Hello https://pubnub.com, https://google.com and ")
    messageDraft.addLinkedText({
      text: "pubnub",
      link: "https://pubnub.com",
      positionInInput: messageDraft.value.length,
    })
    messageDraft.onChange("Hello https://pubnub.com, https://google.com and pubnub, ")
    messageDraft.addLinkedText({
      text: "google",
      link: "https://google.com",
      positionInInput: messageDraft.value.length,
    })
    messageDraft.onChange("Hello https://pubnub.com, https://google.com and pubnub, google.")
    const messagePreview = messageDraft.getMessagePreview()

    expect(messagePreview.length).toBe(9)
    expect(messagePreview[0].type).toBe("text")
    expect(messagePreview[1].type).toBe("plainLink")
    expect(messagePreview[2].type).toBe("text")
    expect(messagePreview[3].type).toBe("plainLink")
    expect(messagePreview[4].type).toBe("text")
    expect(messagePreview[5].type).toBe("textLink")
    expect(messagePreview[6].type).toBe("text")
    expect(messagePreview[7].type).toBe("textLink")
    expect(messagePreview[8].type).toBe("text")
    expect(messagePreview.map(renderMessagePart).join("")).toBe(
      "Hello https://pubnub.com, https://google.com and pubnub, google."
    )
    expect(messageDraft.value).toBe(
      "Hello https://pubnub.com, https://google.com and pubnub, google."
    )
  })

  test("should mix every type of message part", async () => {
    const [channel1, channel2] = await Promise.all([createRandomChannel(), createRandomChannel()])
    const [user1, user2, user4, user5] = await Promise.all([
      createRandomUser(),
      createRandomUser(),
      createRandomUser(),
      createRandomUser(),
    ])
    messageDraft.onChange("Hello ")
    messageDraft.addLinkedText({
      text: "pubnub",
      link: "https://pubnub.com",
      positionInInput: messageDraft.value.length,
    })
    messageDraft.onChange("Hello pubnub at https://pubnub.com! Hello to ")
    messageDraft.addLinkedText({
      text: "google",
      link: "https://google.com",
      positionInInput: messageDraft.value.length,
    })
    messageDraft.onChange(
      "Hello pubnub at https://pubnub.com! Hello to google at https://google.com. Referencing #channel1, #channel2, #blankchannel, @user1, @user2, and mentioning @blankuser3 @user4 @user5"
    )
    messageDraft.addReferencedChannel(channel1, 0)
    messageDraft.addReferencedChannel(channel2, 1)
    messageDraft.addMentionedUser(user1, 0)
    messageDraft.addMentionedUser(user2, 1)
    messageDraft.addMentionedUser(user4, 3)
    messageDraft.addMentionedUser(user5, 4)
    const messagePreview = messageDraft.getMessagePreview()

    expect(messagePreview.length).toBe(20)
    expect(messagePreview[0].type).toBe("text")
    expect(messagePreview[1].type).toBe("textLink")
    expect(messagePreview[2].type).toBe("text")
    expect(messagePreview[3].type).toBe("plainLink")
    expect(messagePreview[4].type).toBe("text")
    expect(messagePreview[5].type).toBe("textLink")
    expect(messagePreview[6].type).toBe("text")
    expect(messagePreview[7].type).toBe("plainLink")
    expect(messagePreview[8].type).toBe("text")
    expect(messagePreview[9].type).toBe("channelReference")
    expect(messagePreview[10].type).toBe("text")
    expect(messagePreview[11].type).toBe("channelReference")
    expect(messagePreview[12].type).toBe("text")
    expect(messagePreview[13].type).toBe("mention")
    expect(messagePreview[14].type).toBe("text")
    expect(messagePreview[15].type).toBe("mention")
    expect(messagePreview[16].type).toBe("text")
    expect(messagePreview[17].type).toBe("mention")
    expect(messagePreview[18].type).toBe("text")
    expect(messagePreview[19].type).toBe("mention")
    expect(messagePreview.map(renderMessagePart).join("")).toBe(
      `Hello pubnub at https://pubnub.com! Hello to google at https://google.com. Referencing #${channel1.name}, #${channel2.name}, #blankchannel, @${user1.name}, @${user2.name}, and mentioning @blankuser3 @${user4.name} @${user5.name}`
    )
    expect(messageDraft.value).toBe(
      `Hello pubnub at https://pubnub.com! Hello to google at https://google.com. Referencing #${channel1.name}, #${channel2.name}, #blankchannel, @${user1.name}, @${user2.name}, and mentioning @blankuser3 @${user4.name} @${user5.name}`
    )
    await Promise.all([channel1.delete({ soft: false }), channel2.delete({ soft: false })])
    await Promise.all([
      user1.delete({ soft: false }),
      user2.delete({ soft: false }),
      user4.delete({ soft: false }),
    ])
  })

  test("should mix every type of message part - variant 2", async () => {
    const [channel1, channel2] = await Promise.all([createRandomChannel(), createRandomChannel()])
    const [user1, user2, user4, user5] = await Promise.all([
      createRandomUser(),
      createRandomUser(),
      createRandomUser(),
      createRandomUser(),
    ])
    messageDraft.onChange("Hello @user1 #channel1 ")
    messageDraft.addMentionedUser(user1, 0)
    messageDraft.addReferencedChannel(channel1, 0)
    messageDraft.onChange(`${messageDraft.value} `)
    messageDraft.addLinkedText({
      text: "pubnub",
      link: "https://pubnub.com",
      positionInInput: messageDraft.value.length,
    })
    messageDraft.onChange(`${messageDraft.value} at https://pubnub.com. `)
    messageDraft.addLinkedText({
      text: "google",
      link: "https://google.com",
      positionInInput: messageDraft.value.length,
    })
    messageDraft.onChange(
      `${messageDraft.value} at https://google.com, @user2 @blankuser3 #channel2, random text @user4, @user5.`
    )
    messageDraft.addReferencedChannel(channel2, 1)
    messageDraft.addMentionedUser(user2, 1)
    messageDraft.addMentionedUser(user4, 3)
    messageDraft.addMentionedUser(user5, 4)
    const messagePreview = messageDraft.getMessagePreview()

    expect(messagePreview.length).toBe(21)
    expect(messagePreview[0].type).toBe("text")
    expect(messagePreview[1].type).toBe("mention")
    expect(messagePreview[2].type).toBe("text")
    expect(messagePreview[3].type).toBe("channelReference")
    expect(messagePreview[4].type).toBe("text")
    expect(messagePreview[5].type).toBe("textLink")
    expect(messagePreview[6].type).toBe("text")
    expect(messagePreview[7].type).toBe("plainLink")
    expect(messagePreview[8].type).toBe("text")
    expect(messagePreview[9].type).toBe("textLink")
    expect(messagePreview[10].type).toBe("text")
    expect(messagePreview[11].type).toBe("plainLink")
    expect(messagePreview[12].type).toBe("text")
    expect(messagePreview[13].type).toBe("mention")
    expect(messagePreview[14].type).toBe("text")
    expect(messagePreview[15].type).toBe("channelReference")
    expect(messagePreview[16].type).toBe("text")
    expect(messagePreview[17].type).toBe("mention")
    expect(messagePreview[18].type).toBe("text")
    expect(messagePreview[19].type).toBe("mention")
    expect(messagePreview.map(renderMessagePart).join("")).toBe(
      `Hello @Test User #Test Channel pubnub at https://pubnub.com. google at https://google.com, @Test User @blankuser3 #Test Channel, random text @Test User, @Test User.`
    )
    expect(messageDraft.value).toBe(
      `Hello @Test User #Test Channel pubnub at https://pubnub.com. google at https://google.com, @Test User @blankuser3 #Test Channel, random text @Test User, @Test User.`
    )
    await Promise.all([channel1.delete({ soft: false }), channel2.delete({ soft: false })])
    await Promise.all([
      user1.delete({ soft: false }),
      user2.delete({ soft: false }),
      user4.delete({ soft: false }),
    ])
  })

  test("should reference 3 channels and 3 mentions with no order", async () => {
    const [channel1, channel2, channel3] = await Promise.all([
      createRandomChannel(),
      createRandomChannel(),
      createRandomChannel(),
    ])
    const [user1, user2, user3] = await Promise.all([
      createRandomUser(),
      createRandomUser(),
      createRandomUser(),
    ])

    messageDraft.onChange(
      `Hello @real #real #fake @fake @real #fake #fake #real @real #fake #real @@@ @@@@ @ #fake #fake`
    )
    messageDraft.addReferencedChannel(channel1, 0)
    messageDraft.addReferencedChannel(channel2, 4)
    messageDraft.addReferencedChannel(channel3, 6)
    messageDraft.addMentionedUser(user1, 0)
    messageDraft.addMentionedUser(user2, 2)
    messageDraft.addMentionedUser(user3, 3)
    const messagePreview = messageDraft.getMessagePreview()

    expect(messagePreview.map(renderMessagePart).join("")).toBe(
      "Hello @Test User #Test Channel #fake @fake @Test User #fake #fake #Test Channel @Test User #fake #Test Channel @@@ @@@@ @ #fake #fake"
    )

    await Promise.all([
      channel1.delete({ soft: false }),
      channel2.delete({ soft: false }),
      channel3.delete({ soft: false }),
    ])
    await Promise.all([
      user1.delete({ soft: false }),
      user2.delete({ soft: false }),
      user3.delete({ soft: false }),
    ])
  })
})
