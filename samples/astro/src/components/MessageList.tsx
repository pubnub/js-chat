import { useState, useEffect } from "react"
import { Channel, Message, ThreadChannel, ThreadMessage } from "@pubnub/chat"

export default function MessageList(props: {
  channel?: Channel | ThreadChannel
  rootMessage?: Message
  rootChannel?: Channel
  handleOpenThread?: (message: Message) => unknown
}) {
  const [channel, setChannel] = useState<undefined | Channel>(props.channel)
  const [membership, setMembership] = useState<undefined | Membership>()
  const [text, setText] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [editedMessage, setEditedMessage] = useState<Message>()
  const [unreadCount, setUnreadCount] = useState(0)

  async function handleTextInput(e) {
    const newText = e.target.value
    setText(newText)
    if (channel) {
      if (newText) await channel.startTyping()
      else await channel.stopTyping()
    }
  }

  async function handleSend() {
    if (editedMessage) {
      const edited = await editedMessage.editText(text)
      setMessages((ls) => ls.map((msg) => (msg.timetoken === edited.timetoken ? edited : msg)))
      setEditedMessage(null)
    } else if (props.rootMessage) {
      const { rootMessage, rootChannel } = props
      await rootChannel.sendText(text, { rootMessage })
      if (channel) return
      const thread = await rootMessage.getThread()
      setChannel(thread)
    } else {
      await props.channel.sendText(text)
    }
    setText("")
  }

  async function handleMarkRead(message: Message) {
    if (!membership) return
    await membership.setLastReadMessage(message)
  }

  async function handleEditMessage(message: Message) {
    setEditedMessage(message)
    setText(message.text)
  }

  async function handleDeleteMessage(message: Message, soft) {
    const deleted = await message.delete({ soft })
    if (deleted === true)
      setMessages((messages) => messages.filter((msg) => message.timetoken !== msg.timetoken))
    else setMessages((ls) => ls.map((msg) => (msg.timetoken === deleted.timetoken ? deleted : msg)))
  }

  async function handleToggleReaction(message, reaction) {
    const newMsg = await message.toggleReaction(reaction)
    setMessages((msgs) => msgs.map((msg) => (msg.timetoken === newMsg.timetoken ? newMsg : msg)))
  }

  async function getUnreadCount() {
    if (!membership) return
    const unreadCount = await membership.getUnreadMessagesCount()
    setUnreadCount(unreadCount)
  }

  async function setupMessages() {
    if (!channel) return
    const { messages } = await channel.getHistory()
    setMessages(messages)
    const membership = await channel.join((msg) => {
      setMessages((messages) => [...messages, msg])
      setUnreadCount((count) => count + 1)
    })
    setMembership(membership)
  }

  useEffect(() => {
    setMessages([])
    setEditedMessage(null)
    setupMessages()
  }, [channel])

  useEffect(() => {
    setChannel(props.channel)
  }, [props.channel])

  useEffect(() => {
    if (!messages.length) return
    return ThreadMessage.streamUpdatesOn(messages, setMessages)
  }, [messages])

  useEffect(() => {
    if (!membership) return
    getUnreadCount()
    return membership.streamUpdates(async (membership) => {
      setMembership(membership)
      getUnreadCount()
    })
  })

  return (
    <>
      <label htmlFor="sendText">
        {props.rootMessage ? `Responding to:  ${props.rootMessage.text}` : "Type a message"}
      </label>
      <div className="flex">
        <input type="text" name="sendText" value={text} onChange={handleTextInput} />
        <button className="ml-2 flex-none" onClick={handleSend}>
          {editedMessage ? "Update" : "Send"}
        </button>
      </div>
      <p className="my-3">Unread count: {unreadCount}</p>

      <ul>
        {messages.map((message) => (
          <li key={message.timetoken}>
            <div className="flex items-center">
              <span className="flex-1">
                {message.userId}: {message.text}
                {message.deleted ? "(soft deleted)" : ""}
              </span>
              <nav>
                <button
                  className={`py-0.5 px-2 ${
                    message.hasUserReaction("👍")
                      ? "bg-accent focus:bg-accent"
                      : "bg-transparent focus:bg-transparent"
                  }`}
                  onClick={() => handleToggleReaction(message, "👍")}
                >
                  👍
                </button>
                <button
                  className={`py-0.5 px-2 ml-2 ${
                    message.hasUserReaction("👎")
                      ? "bg-accent focus:bg-accent"
                      : "bg-transparent focus:bg-transparent"
                  }`}
                  onClick={() => handleToggleReaction(message, "👎")}
                >
                  👎
                </button>
                <button
                  className={`py-0.5 px-2 ml-2 ${
                    message.timetoken === membership?.lastReadMessageTimetoken
                      ? "bg-accent focus:bg-accent text-white"
                      : "bg-transparent focus:bg-transparent"
                  }`}
                  onClick={() => handleMarkRead(message)}
                >
                  R
                </button>
                {props.handleOpenThread ? (
                  <button
                    className="py-0.5 px-2 ml-2"
                    onClick={() => props.handleOpenThread(message)}
                  >
                    T
                  </button>
                ) : null}
                <button className="py-0.5 px-2 ml-2" onClick={() => handleEditMessage(message)}>
                  E
                </button>
                <button
                  className="py-0.5 px-2 ml-2"
                  onClick={() => handleDeleteMessage(message, true)}
                >
                  DS
                </button>
                <button
                  className="py-0.5 px-2 ml-2"
                  onClick={() => handleDeleteMessage(message, false)}
                >
                  DH
                </button>
              </nav>
            </div>
            <hr className="my-1" />
          </li>
        ))}
      </ul>
    </>
  )
}
