import { MessageActionType, MessageType, TextMessageContent } from "./types"
import { Message } from "./entities/message"

export function defaultGetMessagePublishBody(messageBody: TextMessageContent) {
  return {
    type: messageBody.type,
    text: messageBody.text,
    files: messageBody.files,
  }
}

export function defaultGetMessageResponseBody<MessageBody extends object = TextMessageContent>(
  messageBody: MessageBody
) {
  if ("type" in messageBody && "text" in messageBody && "files" in messageBody) {
    return {
      type: MessageType.TEXT,
      text: typeof messageBody.text === "string" ? messageBody.text : "UNKNOWN",
      files: Array.isArray(messageBody.files) ? messageBody.files : [],
    }
  }
  return {
    type: MessageType.TEXT,
    text: "UNKNOWN",
    files: [],
  }
}

export function defaultGetMessageDisplayContent(message: Message, editActionName: string) {
  const edits = message.actions?.[editActionName]
  if (!edits) return message.content.text || ""
  const flatEdits = Object.entries(edits).map(([k, v]) => ({ value: k, ...v[0] }))
  const lastEdit = flatEdits.reduce((a, b) => (a.actionTimetoken > b.actionTimetoken ? a : b))

  return lastEdit.value
}

export const defaultEditActionName = MessageActionType.EDITED
export const defaultDeleteActionName = MessageActionType.DELETED
