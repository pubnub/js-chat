import PubNub, { ChannelMetadataObject, ObjectCustom, PublishParameters } from "pubnub"
import { User } from "./entities/user"
import { Message } from "./entities/message"

export type StatusTypeFields = {
  status?: string
  type?: string
}

export enum MessageType {
  TEXT = "text",
  TYPING = "typing",
  REPORT = "report",
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

export type ReportMessageContent = {
  type: MessageType.REPORT
  text?: string
  reason: string
  reportedMessageTimetoken?: string
  reportedMessageChannelId?: string
  reportedUserId?: string
}

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

export type SendTextOptionParams = Omit<PublishParameters, "message" | "channel"> & {
  mentionedUsers?: MessageMentionedUsers
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
