import PubNub, {
  ChannelMetadataObject,
  ObjectCustom,
  PublishParameters,
  SendFileParameters,
} from "pubnub"
import { User } from "./entities/user"
import { Message } from "./entities/message"
import { Event } from "./entities/event"
import { Channel } from "./entities/channel"
import { ThreadChannel } from "./entities/thread-channel"

export type ChannelType = "direct" | "group" | "public"

export enum MessageType {
  TEXT = "text",
  DELTA = "delta",
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

export type DeltaMessageContent = {
  type: MessageType.DELTA
  delta: any
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
  status?: string
  type?: ChannelType
}

export type ThreadChannelDTOParams = ChannelDTOParams & { parentChannelId: string }

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

export type UserMentionData =
  | {
      event: Event<"mention">
      channel: Channel
      message: Message
      user: User
    }
  | {
      event: Event<"mention">
      threadChannel: ThreadChannel
      parentChannel: Channel
      message: Message
      user: User
    }
