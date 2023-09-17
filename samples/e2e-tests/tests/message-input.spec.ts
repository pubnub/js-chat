import { expect, test } from "@playwright/test"

import { MessageInputComponent } from "../screen-object/message-input.component"
import { MessageListComponent } from "../screen-object/message-input.component"

test.describe("Message input smoke tests.", () => {
  test("Message input verify", async ({ page }) => {
    const messageInputComponent = new MessageInputComponent(page)

    await page.goto("http://localhost:5173/")
    await expect(messageInputComponent.containerMessageInput).toBeVisible()
  })

  test("Send a simple message", async ({ page }) => {
    const messageListComponent = new MessageListComponent(page)
    const messageInputComponent = new MessageInputComponent(page)

    await page.goto("http://localhost:5173/")
    await messageInputComponent.inputMessage.fill("What about now?")
    await messageInputComponent.buttonSendMessage.click()
    await expect(messageListComponent.containerUserMessage).toBeVisible()
  })
})
