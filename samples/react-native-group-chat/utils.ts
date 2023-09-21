import { Message, TimetokenUtils, User } from "@pubnub/chat"
import { IMessage } from "react-native-gifted-chat"

export type EnhancedIMessage = IMessage & {
  originalPnMessage: Message
}

export function mapPNMessageToGChatMessage(
  pnMessage: Message,
  user?: User & { thumbnail: string }
): EnhancedIMessage {
  return {
    _id: pnMessage.timetoken,
    text: pnMessage.text,
    originalPnMessage: pnMessage,
    createdAt: TimetokenUtils.timetokenToDate(pnMessage.timetoken),
    user: {
      _id: user?.id || pnMessage.userId,
      name: user?.name || "Missing user name",
      avatar: user?.thumbnail,
    },
  }
}
