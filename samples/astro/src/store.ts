import { atom } from "nanostores"
import { persistentAtom } from "@nanostores/persistent"
import type { Chat } from "@pubnub/chat"

export const userIdAtom = persistentAtom("pnUserId", undefined)
export const authTokenAtom = persistentAtom("pnAuthToken", undefined)
export const chatAtom = atom<Chat>(undefined)
