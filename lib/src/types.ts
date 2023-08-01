import PubNub, { ChannelMetadataObject, ObjectCustom, PublishParameters } from "pubnub"
import { User } from "./entities/user"
import { Message } from "./entities/message"

export type StatusTypeFields = {
  status?: string
  type?: string
}

export enum MessageType {
  TEXT = "text",
}

export enum MessageActionType {
  REACTIONS = "reactions",
  DELETED = "deleted",
  EDITED = "edited",
}

export type TextMessageContent = {
  type: MessageType.TEXT
  text: string
}

export type EventContent = {
  typing: {
    value: boolean
  }
  report: {
    text?: string
    reason: string
    reportedMessageTimetoken?: string
    reportedMessageChannelId?: string
    reportedUserId?: string
  }
  receipt: {
    messageTimetoken: string
  }
  mention: {
    messageTimetoken: string
    channel: string
  }
  custom: any
}

export type EventType = keyof EventContent

export type MessageActions = {
  [type: string]: {
    [value: string]: Array<{
      uuid: string
      actionTimetoken: string | number
    }>
  }
}

export type DeleteParameters = {
  soft?: boolean
}

export type MessageMentionedUsers = {
  [nameOccurrenceIndex: number]: {
    id: string
    name: string
  }
}

export type MessageDraftOptions = Omit<PublishParameters, "message" | "channel">

export type SendTextOptionParams = Omit<PublishParameters, "message" | "channel"> & {
  mentionedUsers?: MessageMentionedUsers
  textLinks?: TextLink[]
  quotedMessage?: Message
}

export type EnhancedMessageEvent = PubNub.MessageEvent & {
  userMetadata?: {
    [key: string]: any
  }
}

export type MessageDTOParams =
  | PubNub.FetchMessagesResponse["channels"]["channel"][0]
  | EnhancedMessageEvent

export type ThreadMessageDTOParams = MessageDTOParams & { parentChannelId: string }

export type MembershipResponse = Awaited<ReturnType<User["getMemberships"]>>

export type OptionalAllBut<T, K extends keyof T> = Partial<T> & Pick<T, K>

export type ChannelDTOParams = OptionalAllBut<ChannelMetadataObject<ObjectCustom>, "id"> &
  StatusTypeFields

export type ThreadChannelDTOParams = ChannelDTOParams & { parentChannelId: string }

export type MessageDraftConfig = {
  userSuggestionSource: "channel" | "global"
  isTypingIndicatorTriggered: boolean
  userLimit: number
}

export type TextLink = {
  startIndex: number
  endIndex: number
  link: string
}

export type GetLinkedTextParams = {
  mentionedUserRenderer: (userId: string, mentionedName: string) => any
  plainLinkRenderer: (link: string) => any
  textLinkRenderer: (text: string, link: string) => any
}

export declare class ErrorLoggerImplementation {
  setItem(key: string, value: string): void;
  getItem(key: string): string | null;
  getStorageObject(): Object
}

export enum ErrorTypes {
  CHAT_INIT = "chatInit",
  CHANNEL_HISTORY = "channelHistory",
  GET_CHANNEL = "getChannel"
}
