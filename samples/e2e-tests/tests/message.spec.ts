import { expect, test } from "@playwright/test"
import { getRandomTestUserMention, getRandomString } from "./helpers"

import { LoginPageComponent } from "../screen-object/login-page"
import { ChannelListComponent } from "../screen-object/channel-list"
import { NewChatPageComponent } from "../screen-object/newchat-page"
import { MessageListComponent } from "../screen-object/message-list"

test.describe("Message smoke tests.", () => {
  test("@mention functionality smoke test CSK-319", async ({ page }) => {
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

    await expect(messageListComponent.containerMentionsList).toBeVisible()
    await expect(messageListComponent.containerMentionsList).toContainText(randomMention)
  })
  test("pin message functionality smoke test CSK-317", async ({ page }) => {
    const randomMention = getRandomTestUserMention()
    const loginPageComponent = new LoginPageComponent(page)
    const channelListComponent = new ChannelListComponent(page)
    const newChatPageComponent = new NewChatPageComponent(page)
    const messageListComponent = new MessageListComponent(page)

    await page.goto("http://localhost:19006")

    await expect(loginPageComponent.inputUserId).toBeVisible()

    await loginPageComponent.buttonLogin.tap()

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

    await channelListComponent.iconChat.tap()

    await expect(newChatPageComponent.headerNewChat).toBeVisible()
    await expect(newChatPageComponent.inputSearchNewChatPage).toBeVisible()
    await expect(newChatPageComponent.buttonGroupChat).toBeVisible()
    await expect(channelListComponent.iconFooterHome).toBeVisible()
    await expect(channelListComponent.iconFooterMentions).toBeVisible()
    await expect(channelListComponent.iconFooterProfile).toBeVisible()

    await newChatPageComponent.sectionUserDirectChat.tap()

    await expect(messageListComponent.buttonLoadEarlierMessages).toBeVisible()

    await messageListComponent.inputMessage.fill("@test-user")
    await messageListComponent.wrapperMentionUserList.click()
    await messageListComponent.inputMessage.fill(randomMention)
    await messageListComponent.buttonSendMessage.tap()

    await expect(messageListComponent.messageSent).toBeVisible()

    await messageListComponent.messageSent.tap({ noWaitAfter: false })

    await expect(messageListComponent.containerActions).toBeVisible()

    await messageListComponent.buttonPinMessage.tap()

    await messageListComponent.buttonPinIconHead.tap()

    await expect(messageListComponent.messagePinned).toContainText(randomMention)
  })
  test("quote messages functionality smoke test CSK-318", async ({ page }) => {
    const randomMessage = getRandomString(10)
    const loginPageComponent = new LoginPageComponent(page)
    const channelListComponent = new ChannelListComponent(page)
    const newChatPageComponent = new NewChatPageComponent(page)
    const messageListComponent = new MessageListComponent(page)

    await page.goto("http://localhost:19006")

    await expect(loginPageComponent.inputUserId).toBeVisible()

    await loginPageComponent.buttonLogin.tap()

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

    await channelListComponent.iconChat.tap()

    await expect(newChatPageComponent.headerNewChat).toBeVisible()
    await expect(newChatPageComponent.inputSearchNewChatPage).toBeVisible()
    await expect(newChatPageComponent.buttonGroupChat).toBeVisible()
    await expect(channelListComponent.iconFooterHome).toBeVisible()
    await expect(channelListComponent.iconFooterMentions).toBeVisible()
    await expect(channelListComponent.iconFooterProfile).toBeVisible()

    await newChatPageComponent.sectionUserDirectChat.tap()

    await expect(messageListComponent.buttonLoadEarlierMessages).toBeVisible()

    await messageListComponent.inputMessage.fill(randomMessage)
    await messageListComponent.buttonSendMessage.tap()

    await expect(messageListComponent.messageSent).toBeVisible()

    await messageListComponent.messageSent.tap({ noWaitAfter: false })

    await expect(messageListComponent.containerActions).toBeVisible()

    await messageListComponent.buttonQuoteMessageActions.tap()

    await messageListComponent.inputMessage.fill(randomMessage)
    await messageListComponent.buttonSendMessage.tap()

    await expect(messageListComponent.messageQuoted).toContainText(randomMessage)
  })
  test("thread view functionality smoke test CSK-320", async ({ page }) => {
    const randomMessage = getRandomString(10)
    const loginPageComponent = new LoginPageComponent(page)
    const channelListComponent = new ChannelListComponent(page)
    const newChatPageComponent = new NewChatPageComponent(page)
    const messageListComponent = new MessageListComponent(page)

    await page.goto("http://localhost:19006")

    await expect(loginPageComponent.inputUserId).toBeVisible()

    await loginPageComponent.buttonLogin.tap()

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

    await channelListComponent.iconChat.tap()

    await expect(newChatPageComponent.headerNewChat).toBeVisible()
    await expect(newChatPageComponent.inputSearchNewChatPage).toBeVisible()
    await expect(newChatPageComponent.buttonGroupChat).toBeVisible()
    await expect(channelListComponent.iconFooterHome).toBeVisible()
    await expect(channelListComponent.iconFooterMentions).toBeVisible()
    await expect(channelListComponent.iconFooterProfile).toBeVisible()

    await newChatPageComponent.sectionUserDirectChat.tap()

    await expect(messageListComponent.buttonLoadEarlierMessages).toBeVisible()

    await messageListComponent.inputMessage.fill(randomMessage)
    await messageListComponent.buttonSendMessage.tap()

    await expect(messageListComponent.messageSent).toBeVisible()

    await messageListComponent.messageSent.tap({ noWaitAfter: false })

    await expect(messageListComponent.containerActions).toBeVisible()

    await messageListComponent.buttonReplyInThreadActions.tap()

    await messageListComponent.inputMessage.fill(randomMessage)
    await messageListComponent.buttonSendMessage.tap()

    await expect(messageListComponent.messageSent).toContainText(randomMessage)
  })
})
