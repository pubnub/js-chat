import { Locator, Page } from "@playwright/test"

export class NewChatPageComponent {
  readonly page: Page
  readonly headerNewChat: Locator
  readonly buttonGroupChat: Locator
  readonly sectionUserDirectChat: Locator
  readonly inputSearchNewChatPage: Locator
  readonly inputGroupName: Locator
  readonly groupMemberOne: Locator
  readonly groupMemberTwo: Locator
  readonly groupMemberThree: Locator
  readonly buttonCreateGroup: Locator
  readonly buttonCancelCreateGroup: Locator
  readonly buttonChangeNameGroup: Locator
  readonly buttonLeaveConversationGroup: Locator
  readonly iconHeadGroupChat: Locator
  readonly popupChangeChatName: Locator
  readonly inputChangeChatName: Locator
  readonly buttonSaveChatName: Locator
  readonly groupName: locator

  constructor(page: Page) {
    this.page = page
    this.headerNewChat = page.getByRole("heading", { name: "New chat" })
    this.buttonGroupChat = page
      .locator("div")
      .filter({ hasText: /^Create group chat$/ })
      .first()
    this.sectionUserDirectChat = page
      .locator("div")
      .filter({ hasText: /^Lukasz$/ })
      .nth(1)
    this.inputSearchNewChatPage = page.getByRole("textbox", { name: "Search" })
    this.inputGroupName = page.getByRole("textbox").nth(1)
    this.groupMemberOne = page
      .locator(
        "div:nth-child(2) > div > div > div > div > div > div:nth-child(9) > div > div > div > div > div"
      )
      .first()
    this.groupMemberTwo = page
      .locator("div:nth-child(9) > div > div:nth-child(4) > div > div > div")
      .first()
    this.groupMemberThree = page
      .locator("div:nth-child(9) > div > div:nth-child(6) > div > div > div")
      .first()
    this.buttonCreateGroup = page
      .locator("div")
      .filter({ hasText: /^Create$/ })
      .first()
    this.buttonCancelCreateGroup = page
      .locator("div")
      .filter({ hasText: /^Cancel$/ })
      .first()
    this.buttonChangeNameGroup = page
      .locator(
        "div:nth-child(3) > div:nth-child(2) > div:nth-child(2) > div > div > div > div > div > div > div:nth-child(2) > div:nth-child(2)"
      )
      .first()
    this.buttonLeaveConversationGroup = page
      .locator("div")
      .filter({ hasText: /^Leave conversation$/ })
      .first()
    this.iconHeadGroupChat = page.locator(
      "div:nth-child(2) > div > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div"
    )
    this.popupChangeChatName = page
      .locator("div")
      .filter({ hasText: /^Change chat nameNameSaveCancel$/ })
      .nth(1)
    this.inputChangeChatName = page.getByRole("textbox")
    this.buttonSaveChatName = page
      .locator("div")
      .filter({ hasText: /^Save$/ })
      .first()
    this.groupName = page.locator(
      '//*[@id="root"]/div/div[2]/div/div/div/div/div/div[1]/div/div[2]/div[2]/div/div/div/div[1]/div/div[1]/div[1]/div/div/div/div/div/div[1]/div[3]/div[2]/div[2]/div/div/div/div[1]/div/div/div[2]/div[1]/div[2]'
    )
  }
}
