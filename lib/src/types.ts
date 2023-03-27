import { PublishParameters, ChannelMetadataObject, ObjectCustom } from "pubnub";

export type SendTextOptionParams = Omit<PublishParameters, "message" | "channel">

export type ChannelEntity = ChannelMetadataObject<ObjectCustom>;
