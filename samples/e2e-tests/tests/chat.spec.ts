import { expect, test } from "@playwright/test"
import { getRandomString, getRandomTestUserMention } from "./helpers"

import { LoginPageComponent } from "../screen-object/login-page"
import { ChannelListComponent } from "../screen-object/channel-list"
import { NewChatPageComponent } from "../screen-object/newchat-page"
import { MessageListComponent } from "../screen-object/message-list"

test.describe("Chat smoke tests.", () => {
  test("chat setting functionality smoke test CSK-322. Should create group chat rename it and leave chat.", async ({
    page,
  }) => {
    const randomMessage = getRandomString(10)
    const randomChatName = getRandomString(5)
    const loginPageComponent = new LoginPageComponent(page)
    const channelListComponent = new ChannelListComponent(page)
    const newChatPageComponent = new NewChatPageComponent(page)
    const messageListComponent = new MessageListComponent(page)

    await page.goto("http://localhost:19006")

    await expect(loginPageComponent.inputUserId).toBeVisible()

    await loginPageComponent.buttonLogin.tap()
    await channelListComponent.iconChat.tap()
    await newChatPageComponent.buttonGroupChat.tap()
    await newChatPageComponent.inputGroupName.fill(randomMessage)
    await newChatPageComponent.groupMemberTwo.tap()
    await newChatPageComponent.groupMemberOne.tap()
    await newChatPageComponent.groupMemberThree.tap()
    await newChatPageComponent.buttonCreateGroup.tap()
    await messageListComponent.inputMessage.fill(randomMessage)
    await messageListComponent.buttonSendMessage.tap()

    await expect(messageListComponent.messageSent).toContainText(randomMessage)

    await newChatPageComponent.iconHeadGroupChat.tap()
    await newChatPageComponent.buttonChangeNameGroup.tap()

    await expect(newChatPageComponent.popupChangeChatName).toBeVisible()

    await newChatPageComponent.inputChangeChatName.fill(randomChatName)
    await newChatPageComponent.buttonSaveChatName.tap()

    await expect(newChatPageComponent.groupName).toContainText(randomChatName)

    await newChatPageComponent.buttonLeaveConversationGroup.tap()

    await expect(channelListComponent.containerChannelList).not.toContainText(randomChatName)
  })
  test("WIP people interface functionality smoke test CSK-321", async ({ page }) => {
    const randomMention = getRandomTestUserMention()
    const loginPageComponent = new LoginPageComponent(page)
    const channelListComponent = new ChannelListComponent(page)
    const newChatPageComponent = new NewChatPageComponent(page)
    const messageListComponent = new MessageListComponent(page)

    await page.goto("http://localhost:19006")
    await expect(loginPageComponent.inputUserId).toBeVisible()
    await loginPageComponent.buttonLogin.click()

    await expect(channelListComponent.containerChannelList).toBeVisible()
    await expect(channelListComponent.headerUser).toBeVisible()
    await expect(channelListComponent.inputSearchChannelList).toBeVisible()
    await expect(channelListComponent.sectionUnread).toBeVisible()
    await expect(channelListComponent.sectionPublicChannels).toBeVisible()
    await expect(channelListComponent.sectionGroups).toBeVisible()
    await expect(channelListComponent.iconChat).toBeVisible()
    await expect(channelListComponent.iconFooterHome).toBeVisible()
    await expect(channelListComponent.iconFooterMentions).toBeVisible()
    await expect(channelListComponent.iconFooterProfile).toBeVisible()

    await channelListComponent.iconChat.click()

    await expect(newChatPageComponent.headerNewChat).toBeVisible()
    await expect(newChatPageComponent.inputSearchNewChatPage).toBeVisible()
    await expect(newChatPageComponent.buttonGroupChat).toBeVisible()
    await expect(channelListComponent.iconFooterHome).toBeVisible()
    await expect(channelListComponent.iconFooterMentions).toBeVisible()
    await expect(channelListComponent.iconFooterProfile).toBeVisible()

    await newChatPageComponent.sectionUserDirectChat.click()
    await expect(messageListComponent.buttonLoadEarlierMessages).toBeVisible()

    await messageListComponent.inputMessage.fill("@test-user")
    await messageListComponent.wrapperMentionUserList.click()
    await messageListComponent.inputMessage.fill(randomMention)
    await messageListComponent.buttonSendMessage.click()
    await channelListComponent.iconFooterMentions.click()
  })
  test("WIP notifications functionality smoke test CSK-323", async ({ page }) => {
    const randomMention = getRandomTestUserMention()
    const loginPageComponent = new LoginPageComponent(page)
    const channelListComponent = new ChannelListComponent(page)
    const newChatPageComponent = new NewChatPageComponent(page)
    const messageListComponent = new MessageListComponent(page)

    await page.goto("http://localhost:19006")
    await expect(loginPageComponent.inputUserId).toBeVisible()
    await loginPageComponent.buttonLogin.click()

    await expect(channelListComponent.containerChannelList).toBeVisible()
    await expect(channelListComponent.headerUser).toBeVisible()
    await expect(channelListComponent.inputSearchChannelList).toBeVisible()
    await expect(channelListComponent.sectionUnread).toBeVisible()
    await expect(channelListComponent.sectionPublicChannels).toBeVisible()
    await expect(channelListComponent.sectionGroups).toBeVisible()
    await expect(channelListComponent.iconChat).toBeVisible()
    await expect(channelListComponent.iconFooterHome).toBeVisible()
    await expect(channelListComponent.iconFooterMentions).toBeVisible()
    await expect(channelListComponent.iconFooterProfile).toBeVisible()

    await channelListComponent.iconChat.click()

    await expect(newChatPageComponent.headerNewChat).toBeVisible()
    await expect(newChatPageComponent.inputSearchNewChatPage).toBeVisible()
    await expect(newChatPageComponent.buttonGroupChat).toBeVisible()
    await expect(channelListComponent.iconFooterHome).toBeVisible()
    await expect(channelListComponent.iconFooterMentions).toBeVisible()
    await expect(channelListComponent.iconFooterProfile).toBeVisible()

    await newChatPageComponent.sectionUserDirectChat.click()
    await expect(messageListComponent.buttonLoadEarlierMessages).toBeVisible()

    await messageListComponent.inputMessage.fill("@test-user")
    await messageListComponent.wrapperMentionUserList.click()
    await messageListComponent.inputMessage.fill(randomMention)
    await messageListComponent.buttonSendMessage.click()
    await channelListComponent.iconFooterMentions.click()
  })
})
