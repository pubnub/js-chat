import { PublishParameters } from "pubnub"

export type StatusTypeFields = {
  status?: string
  type?: string
}

export type SendTextOptionParams = Omit<PublishParameters, "message" | "channel">
