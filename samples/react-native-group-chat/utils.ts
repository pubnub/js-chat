import { Message, MixedTextTypedElement, TimetokenUtils, User } from "@pubnub/chat"
import { IMessage } from "react-native-gifted-chat"

export type EnhancedIMessage = IMessage & {
  linkedText: MixedTextTypedElement[]
}

export function mapPNMessageToGChatMessage(
  pnMessage: Message,
  user?: User & { thumbnail: string }
): EnhancedIMessage {
  return {
    _id: pnMessage.timetoken,
    text: pnMessage.text,
    linkedText: pnMessage.getLinkedText(),
    createdAt: TimetokenUtils.timetokenToDate(pnMessage.timetoken),
    user: {
      _id: user?.id || pnMessage.userId,
      name: user?.name || "Missing user name",
      avatar: user?.thumbnail,
    },
  }
}
