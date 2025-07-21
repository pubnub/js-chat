import { Locator, Page } from "@playwright/test"

export class ChannelListComponent {
  readonly page: Page
  readonly containerChannelList: Locator
  readonly inputSearchChannelList: Locator
  readonly headerUser: Locator
  readonly sectionUnread: Locator
  readonly sectionPublicChannels: Locator
  readonly sectionGroups: Locator
  readonly sectionDirectMessages: Locator
  readonly iconChat: Locator
  readonly iconFooterHome: Locator
  readonly iconFooterMentions: Locator
  readonly iconFooterProfile: Locator

  constructor(page: Page) {
    this.page = page
    this.containerChannelList = page.locator(
      '//*[@id="root"]/div/div[2]/div/div/div/div/div/div[1]/div/div[2]/div[2]/div/div/div/div[1]/div/div[1]/div[1]/div/div/div/div/div/div[1]/div/div[2]/div[2]/div/div/div/div[1]/div[1]'
    )
    this.inputSearchChannelList = page.getByPlaceholder("Search")
    this.headerUser = page
      .locator(
        "div:nth-child(2) > div > div > div > div:nth-child(2) > div > div > .css-view-175oi2r"
      )
      .first()
    this.sectionUnread = page
      .locator("div")
      .filter({ hasText: /^UNREAD󰇘󰅃$/ })
      .first()
    this.sectionPublicChannels = page
      .locator("div")
      .filter({ hasText: /^PUBLIC CHANNELS󰅃$/ })
      .first()
    this.sectionGroups = page
      .locator("div")
      .filter({ hasText: /^GROUPS󰅃$/ })
      .first()
    this.sectionDirectMessages = page
      .locator("div")
      .filter({ hasText: /^DIRECT MESSAGES󰅃$/ })
      .first()
    this.iconChat = page.locator("div").filter({ hasText: /^$/ }).first()
    this.iconFooterHome = page.getByRole("link", { name: "󰚡 󰚡 Home" })
    this.iconFooterMentions = page.getByRole("link", { name: "  Mentions" })
    this.iconFooterProfile = page.getByRole("link", { name: "  Mentions" })
  }
}
