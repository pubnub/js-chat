import * as React from "react"
import { Chat, User, Membership, Channel } from "@pubnub/chat"

type ChatContextParams = {
  loading: boolean
  setLoading: (state: boolean) => void
  chat: null | Chat
  setChat: (chat: Chat | null) => void
  currentChannel?: Channel | null
  setCurrentChannel: (channel: Channel | null) => void
  currentChannelMembers: Membership[]
  users: User[]
  setUsers: (users: User[]) => void
  getUser: (userId: string) => User | null
  getInterlocutor: (channel: Channel) => User | null
  memberships: Membership[]
  setMemberships: (memberships: Membership[]) => void
}

export const ChatContext = React.createContext<ChatContextParams>({
  loading: false,
  setLoading: () => null,
  chat: null as Chat | null,
  setChat: () => null,
  currentChannel: undefined,
  setCurrentChannel: () => null,
  currentChannelMembers: [],
  users: [],
  setUsers: () => null,
  getUser: () => null,
  getInterlocutor: () => null,
  memberships: [],
  setMemberships: () => null,
})
