import { atom } from "nanostores"
import { persistentAtom } from "@nanostores/persistent"

export const userIdAtom = persistentAtom("pnUserId", undefined)
export const authTokenAtom = persistentAtom("pnAuthToken", undefined)
export const chatAtom = atom<PubNub>(undefined)
