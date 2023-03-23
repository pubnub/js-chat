import { PublishParameters } from "pubnub";

export type SendTextOptionParams = Omit<PublishParameters, "message" | "channel">
