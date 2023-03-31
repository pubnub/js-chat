import { PublishParameters } from "pubnub"

export type StatusTypeFields = {
  status?: string
  type?: string
}

export type SendTextOptionParams = Omit<PublishParameters, "message" | "channel">

export type Nullable<T> = {
  [P in keyof T]?: T[P] | null
}
