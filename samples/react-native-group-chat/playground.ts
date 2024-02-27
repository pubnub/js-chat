import { Chat, MessageType, TextMessageContent } from "@pubnub/chat"

type CustomMessageBody = {
  body: {
    message: {
      content: {
        text: string
      }
    }
    files: TextMessageContent["files"]
  }
  messageType: MessageType.TEXT
}

async function runApp() {
  const chat = await Chat.init({
    publishKey: "pub",
    subscribeKey: "sub",
    userId: "myFirstUser",
    customPayloads: {
      getMessagePublishBody: ({ type, text, files }): CustomMessageBody => {
        return {
          body: {
            message: {
              content: {
                text,
              },
            },
            files,
          },
          messageType: type,
        }
      },
      getMessageResponseBody: (messageBody: CustomMessageBody) => {
        return {
          text: messageBody.body.message.content.text,
          type: messageBody.messageType,
          files: messageBody.body.files,
        }
      },
      // editMessage: (m) => {
      //   return Promise.resolve(m)
      // },
      editMessageActionName: "updated",
      deleteMessageActionName: "removed",
    },
  })

  const trashChannel =
    (await chat.getChannel("trash-channel2")) ||
    (
      await chat.createGroupConversation({
        channelId: "trash-channel2",
        users: [chat.currentUser],
        channelData: { name: "trash trash trash" },
      })
    ).channel

  // await trashChannel.sendText(`Some other text, ${Math.random()}`)

  const historyObject = await trashChannel.getHistory()
  // await historyObject.messages[0].editText("Custom edited text")
  // await historyObject.messages[1].delete({ soft: true })
  historyObject.messages.forEach((m) => {
    console.log("m", m.text)
  })
}

runApp()
