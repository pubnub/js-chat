import { expect, Locator, Page } from "@playwright/test"

export class ChannelListComponent {
  readonly page: Page
  readonly containerChannelList: Locator

  constructor(page: Page) {
    this.page = page
    this.containerChannelList = page.getByTestId("channel-list-container")
  }
}
