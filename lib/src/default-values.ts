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
  return messageParams.message
}

export const defaultEditActionName = MessageActionType.EDITED
export const defaultDeleteActionName = MessageActionType.DELETED

export const defaultReactionsName = MessageActionType.REACTIONS
