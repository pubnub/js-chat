import React, { useCallback } from "react"
import { Avatar, Message as ChatScopeMessage } from "@chatscope/chat-ui-kit-react"
import { Message as PubNubMessageClass, MixedTextTypedElement, User } from "@pubnub/chat"
import styles from "./message.module.css"

type MessageProps = {
  message: PubNubMessageClass
  users: Map<string, User & { thumbnail: string }>
  presentUsers: string[]
  currentUser: User
  isThread: boolean
  setQuote: (msg: PubNubMessageClass) => void
  openThread: (msg: PubNubMessageClass) => void
  deleteMessage: (msg: PubNubMessageClass) => void
  renderThreadIcon: boolean
}

export function Message({
  message,
  users,
  presentUsers,
  currentUser,
  deleteMessage,
  openThread,
  isThread,
  setQuote,
  renderThreadIcon,
}: MessageProps) {
  const getUserStatus = useCallback(
    (userId: string) => {
      const isPresent = presentUsers.find((u) => u === userId)

      return isPresent ? "available" : "unavailable"
    },
    [presentUsers]
  )

  const renderMessagePart = useCallback((messagePart: MixedTextTypedElement) => {
    if (messagePart.type === "text") {
      return <span>{messagePart.content.text}</span>
    }
    if (messagePart.type === "plainLink") {
      return (
        <a className="any-link" href={messagePart.content.link}>
          {messagePart.content.link}
        </a>
      )
    }
    if (messagePart.type === "textLink") {
      return (
        <a className="any-link" href={messagePart.content.link}>
          {messagePart.content.text}
        </a>
      )
    }
    if (messagePart.type === "mention") {
      return (
        <a className={styles.anyLink} href={`https://pubnub.com/${messagePart.content.id}`}>
          @{messagePart.content.name}
        </a>
      )
    }

    return ""
  }, [])

  const renderFile = useCallback(
    (file: { name: string; id: string; url: string; type?: string }) => {
      if (file.type === "image/jpeg") {
        return <img src={file.url} className={styles["file-image"]} />
      }
      return null
    },
    []
  )

  return (
    <ChatScopeMessage
      model={{
        sender: message.userId,
        direction: "incoming",
        position: "single",
      }}
    >
      <ChatScopeMessage.Header sender={users.get(message.userId)?.name} />
      <Avatar
        src={users.get(message.userId)?.thumbnail}
        name={users.get(message.userId)?.name}
        status={getUserStatus(message.userId)}
      />
      <ChatScopeMessage.CustomContent className={styles["message-custom-content"]}>
        {!!message.quotedMessage && (
          <div className={styles["message-quote-box"]}>
            <div>{users.get(message.quotedMessage.userId)?.name} wrote: </div>
            <div>{message.quotedMessage.text}</div>
          </div>
        )}
        <div>{message.getLinkedText().map(renderMessagePart)}</div>
        <div>{message.files.map(renderFile)}</div>
        <div className={styles["icons-box"]}>
          <img
            src="quote-mark-icon-symbol-illustration-free-vector.jpeg"
            className={styles["quote-icon"]}
            onClick={() => setQuote(message)}
          />
          {renderThreadIcon && (
            <img
              src="thread-icon.png"
              className={styles["thread-icon"]}
              onClick={() => openThread(message)}
            />
          )}
          {message.userId === currentUser.id && (
            <img
              src="trash.png"
              className={styles["trash-icon"]}
              onClick={() => deleteMessage(message)}
            />
          )}
        </div>
      </ChatScopeMessage.CustomContent>
      {message.hasThread && !isThread && (
        <ChatScopeMessage.Footer
          className={styles["thread-messages-label"]}
          onClick={() => openThread(message)}
        >
          Show thread messages
        </ChatScopeMessage.Footer>
      )}
    </ChatScopeMessage>
  )
}
