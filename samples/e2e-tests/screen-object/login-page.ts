import { Locator, Page } from "@playwright/test"

export class LoginPageComponent {
  readonly page: Page
  readonly buttonLogin: Locator
  readonly inputUserId: Locator

  constructor(page: Page) {
    this.page = page
    this.buttonLogin = page
      .locator("div")
      .filter({ hasText: /^Log in$/ })
      .first()
    this.inputUserId = page.getByRole("textbox")
  }
}
