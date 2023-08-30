import { expect, Locator, Page } from "@playwright/test"

export class MessageInputComponent {
  readonly page: Page
  readonly containerMessageInput: Locator
  readonly buttonSendMessage: Locator

  constructor(page: Page) {
    this.page = page
    this.containerMessageInput = page.getByTestId("message-input-container")
    this.buttonSendMessage = page.getByTestId("message-input-send-button")
  }
}
