import PubNub, { ChannelMetadataObject, ObjectCustom, PublishParameters } from "pubnub"
import { User } from "./entities/user"
import { Message } from "./entities/message"

export type StatusTypeFields = {
  status?: string
  type?: string
}

export enum MessageActionType {
  REACTIONS = "reactions",
  DELETED = "deleted",
  EDITED = "edited",
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

export type SendTextOptionParams = Omit<PublishParameters, "message" | "channel"> & {
  rootMessage?: Message
  mentionedUserIds?: {
    [nameOccurrenceIndex: number]: string
  }
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
