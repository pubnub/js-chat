import { Locator, Page } from "@playwright/test"

export class MessageListComponent {
  readonly page: Page
  readonly buttonLoadEarlierMessages: Locator
  readonly inputMessage: Locator
  readonly buttonSendMessage: Locator
  readonly buttonPinIconHead: Locator
  readonly wrapperMentionUserList: Locator
  readonly containerMentionsList: Locator
  readonly messageSent: Locator
  readonly messageQuoted: Locator
  readonly containerActions: Locator
  readonly buttonCopyMessageActions: Locator
  readonly buttonReplyInThreadActions: Locator
  readonly buttonQuoteMessageActions: Locator
  readonly buttonPinMessage: Locator
  readonly messagePinned: Locator

  constructor(page: Page) {
    this.page = page
    this.buttonLoadEarlierMessages = page.getByRole("button", { name: "Load earlier messages" })
    this.inputMessage = page.getByTestId("Type a message...")
    this.buttonSendMessage = page.getByTestId("GC_SEND_TOUCHABLE")
    this.wrapperMentionUserList = page
      .getByTestId("GC_WRAPPER")
      .locator("div")
      .filter({ hasText: /^test-user$/ })
      .nth(1)
    this.containerMentionsList = page
      .locator(
        "div:nth-child(2) > div > div > div > div > div > div > div > div:nth-child(2) > div:nth-child(2) > div > div > div > div > div > div > div:nth-child(2) > div > div > div"
      )
      .first()
    this.containerActions = page
      .locator("div")
      .filter({ hasText: /^ActionsCopy messageReply in threadQuote messagePin message$/ })
      .nth(1)
    this.buttonCopyMessageActions = page
      .locator("div")
      .filter({ hasText: /^Copy message$/ })
      .first()
    this.buttonReplyInThreadActions = page
      .locator("div")
      .filter({ hasText: /^Reply in thread$/ })
      .first()
    this.buttonQuoteMessageActions = page
      .locator("div")
      .filter({ hasText: /^Pin message$/ })
      .first()
    this.buttonPinMessage = page
      .locator("div")
      .filter({ hasText: /^Pin message$/ })
      .first()
    this.buttonPinIconHead = page.getByText("󰤱")
    this.messagePinned = page
      .locator(
        "div:nth-child(3) > div:nth-child(2) > div:nth-child(2) > div > div > div > div > div > div"
      )
      .first()
    this.messageSent = page.locator(
      "div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div > div > div > div > div > div > div > div > div > div > div > div > div > div:nth-child(2) > div > div > div > div > div"
    )
  }
}
