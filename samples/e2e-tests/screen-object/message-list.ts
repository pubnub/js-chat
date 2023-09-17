import { expect, Locator, Page } from "@playwright/test"

export class MessageListComponent {
  readonly page: Page
  readonly containerMessageList: Locator
  readonly containerUserMessage: Locator

  constructor(page: Page) {
    this.page = page
    this.containerMessageList = page.getByTestId("message-list-container")
    this.containerUserMessage = page.getByTestId("message-list-container-user-message")
  }
}
