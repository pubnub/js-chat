import { PublishParameters } from "pubnub"

export type StatusTypeFields = {
  status?: string
  type?: string
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

export type SendTextOptionParams = Omit<PublishParameters, "message" | "channel">
