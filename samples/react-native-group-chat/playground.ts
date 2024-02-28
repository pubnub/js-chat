import { Chat, MessageDTOParams, MessageType, TextMessageContent } from "@pubnub/chat"

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
    publishKey: "pub-c-0457cb83-0786-43df-bc70-723b16a6e816",
    subscribeKey: "sub-c-e654122d-85b5-49a6-a3dd-8ebc93c882de",
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
      getMessageResponseBody: (messageParams: MessageDTOParams) => {
        return {
          text: messageParams.message.body.message.content.text,
          type: messageParams.message.messageType,
          files: messageParams.message.body.files,
        }
      },
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

  const disconnect = trashChannel.connect((stuff) => {
    console.log("stuff", stuff.text)
  })

  await trashChannel.sendText(`Hello Lukasz`)
  await trashChannel.sendText(`Hello Lukasz 2`)

  const historyObject = await trashChannel.getHistory()
  // await historyObject.messages[0].editText("Custom edited text")
  // await historyObject.messages[1].delete({ soft: true })
  historyObject.messages.forEach((m) => {
    console.log("m", m.content)
  })
  function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  await sleep(2000)
  disconnect()
}

runApp()
