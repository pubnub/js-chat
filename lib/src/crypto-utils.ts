import { Message } from "./entities/message"
import { TextMessageContent } from "./types"
import { Chat } from "./entities/chat"

export class CryptoUtils {
  static decrypt({
    chat,
    message,
    decryptor,
  }: {
    chat: Chat
    message: Message
    decryptor: (encryptedContent: string) => TextMessageContent
  }) {
    const decryptedContent = decryptor(message.content.text)

    return Message.fromDTO(chat, {
      timetoken: message.timetoken,
      message: decryptedContent,
      channel: message.channelId,
      publisher: message.userId,
      actions: message.actions || {},
      meta: message.meta,
      error: undefined,
    })
  }
}
