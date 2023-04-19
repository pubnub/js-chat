import { PublishParameters } from "pubnub"

export type StatusTypeFields = {
  status?: string
  type?: string
}

export type DeleteOptions = {
  soft?: boolean
}

export type SendTextOptionParams = Omit<PublishParameters, "message" | "channel">
