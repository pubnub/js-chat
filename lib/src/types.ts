import PubNub, {
  ChannelMetadataObject,
  ObjectCustom,
  PublishParameters,
  SendFileParameters,
} from "pubnub"
import { User } from "./entities/user"
import { Message } from "./entities/message"
import { Event } from "./entities/event"
import { Chat } from "./entities/chat"

export type ChannelType = "direct" | "group" | "public" | "unknown"

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
  files?: { name: string; id: string; url: string; type?: string }[]
}

type TypingEventParams = {
  type: "typing"
  channel: string
}
type ReportEventParams = {
  type: "report"
  channel: string
}
type ReceiptEventParams = {
  type: "receipt"
  channel: string
}
type MentionEventParams = {
  type: "mention"
  user: string
}
type InviteEventParams = {
  type: "invite"
  channel: string
}
type ModerationEventParams = {
  type: "moderation"
  channel: string
}
type CustomEventParams = {
  type: "custom"
  method: "signal" | "publish"
  channel: string
}

export type EventParams = {
  typing: TypingEventParams
  report: ReportEventParams
  receipt: ReceiptEventParams
  mention: MentionEventParams
  invite: InviteEventParams
  custom: CustomEventParams
  moderation: ModerationEventParams
}

type TypingEventPayload = {
  value: boolean
}
type ReportEventPayload = {
  text?: string
  reason: string
  reportedMessageTimetoken?: string
  reportedMessageChannelId?: string
  reportedUserId?: string
}
type ReceiptEventPayload = {
  messageTimetoken: string
}
type MentionEventPayload = {
  messageTimetoken: string
  channel: string
}
type InviteEventPayload = {
  channelType: ChannelType | "unknown"
  channelId: string
}
type ModerationEventPayload = {
  channelId: string
  restriction: "muted" | "banned" | "lifted"
  reason?: string
}
type CustomEventPayload = any

export type EventPayloads = {
  typing: TypingEventPayload
  report: ReportEventPayload
  receipt: ReceiptEventPayload
  mention: MentionEventPayload
  invite: InviteEventPayload
  moderation: ModerationEventPayload
  custom: CustomEventPayload
}

export type EmitEventParams =
  | (TypingEventParams & { payload: TypingEventPayload })
  | (ReportEventParams & { payload: ReportEventPayload })
  | (ReceiptEventParams & { payload: ReceiptEventPayload })
  | (MentionEventParams & { payload: MentionEventPayload })
  | (InviteEventParams & { payload: InviteEventPayload })
  | (CustomEventParams & { payload: CustomEventPayload })
  | (ModerationEventParams & { payload: ModerationEventPayload })

export type EventType =
  | "typing"
  | "report"
  | "receipt"
  | "mention"
  | "invite"
  | "custom"
  | "moderation"
export type GenericEventParams<T extends keyof EventParams> = EventParams[T]

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

export type MessageReferencedChannels = {
  [nameOccurrenceIndex: number]: {
    id: string
    name: string
  }
}

export type MessageDraftOptions = Omit<PublishParameters, "message" | "channel">

export type SendTextOptionParams = Omit<PublishParameters, "message" | "channel"> & {
  mentionedUsers?: MessageMentionedUsers
  referencedChannels?: MessageReferencedChannels
  textLinks?: TextLink[]
  quotedMessage?: Message
  files?: FileList | File[] | SendFileParameters["file"][]
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

export type ChannelDTOParams = OptionalAllBut<ChannelMetadataObject<ObjectCustom>, "id"> & {
  status?: string | null
  type?: ChannelType | null | string
}

export type ThreadChannelDTOParams = ChannelDTOParams & {
  parentChannelId: string
  parentMessage: Message
}

export type MessageDraftConfig = {
  userSuggestionSource: "channel" | "global"
  isTypingIndicatorTriggered: boolean
  userLimit: number
  channelLimit: number
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

export type PayloadForTextTypes = {
  text: {
    text: string
  }
  mention: {
    name: string
    id: string
  }
  plainLink: {
    link: string
  }
  textLink: {
    text: string
    link: string
  }
  channelReference: {
    name: string
    id: string
  }
}

export type TextTypes = keyof PayloadForTextTypes

export type TextTypeElement<T extends TextTypes> = { type: T; content: PayloadForTextTypes[T] }

export type MixedTextTypedElement =
  | TextTypeElement<"text">
  | TextTypeElement<"mention">
  | TextTypeElement<"plainLink">
  | TextTypeElement<"textLink">
  | TextTypeElement<"channelReference">

export type ErrorLoggerSetParams = {
  key: string
  error: unknown
  thrownFunctionArguments: IArguments
}

export declare class ErrorLoggerImplementation {
  setItem(key: string, params: ErrorLoggerSetParams): void
  getStorageObject(): Record<string, unknown>
}

export type ChannelMentionData = {
  event: Event<"mention">
  channelId: string
  message: Message
  userId: string
}

export type ThreadMentionData = {
  event: Event<"mention">
  parentChannelId: string
  threadChannelId: string
  message: Message
  userId: string
}

export type UserMentionData = ChannelMentionData | ThreadMentionData
