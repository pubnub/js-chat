import { MessageActionType, MessageDTOParams, MessageType, TextMessageContent } from "./types"

export function defaultGetMessagePublishBody(messageBody: TextMessageContent) {
  return {
    type: messageBody.type,
    text: messageBody.text,
    files: messageBody.files,
  }
}

export function defaultGetMessageResponseBody(messageParams: MessageDTOParams) {
  if (typeof messageParams.message === "string") {
    return {
      type: MessageType.TEXT,
      text: messageParams.message,
      files: [],
    }
  }
  if (
    "type" in messageParams.message &&
    "text" in messageParams.message &&
    "files" in messageParams.message
  ) {
    return {
      type: MessageType.TEXT,
      text: typeof messageParams.message.text === "string" ? messageParams.message.text : "UNKNOWN",
      files: Array.isArray(messageParams.message.files) ? messageParams.message.files : [],
    }
  }
  return {
    type: MessageType.TEXT,
    text: "UNKNOWN",
    files: [],
  }
}

export const defaultEditActionName = MessageActionType.EDITED
export const defaultDeleteActionName = MessageActionType.DELETED
