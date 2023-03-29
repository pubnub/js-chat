import { PublishParameters, ChannelMetadataObject, ObjectCustom } from "pubnub"

export type StatusTypeFields = {
  status?: string
  type?: string
}

export type SendTextOptionParams = Omit<PublishParameters, "message" | "channel">

export type ChannelEntity = ChannelMetadataObject<ObjectCustom>;
