import React, { useEffect, useRef, useState } from "react"
import { Channel, Chat, Message, TimetokenUtils, User } from "@pubnub/chat"
import "./App.css"

const userData = {
  "support-agent": { name: "John (Support Agent)", custom: { initials: "SA", avatar: "#9fa7df" } },
  "supported-user": { name: "Mary Watson", custom: { initials: "MW", avatar: "#ffab91" } },
}

export default function App() {
  const [chat, setChat] = useState<Chat>()
  const [text, setText] = useState("")
  const [users, setUsers] = useState<User[]>([])
  const [channel, setChannel] = useState<Channel>()
  const [messages, setMessages] = useState<Message[]>([])
  const messageListRef = useRef<HTMLElement>(null)

  async function handleSend(event: React.SyntheticEvent) {
    event.preventDefault()
    if (!text || !channel) return
    await channel.sendText(text)
    setText("")
  }

  async function handleMessage(message: Message) {
    if (chat && !users.find((user) => user.id === message.userId)) {
      const user = await chat.getUser(message.userId)
      if (!user) return
      setUsers((users) => [...users, user])
    }
    setMessages((messages) => [...messages, message])
  }

  useEffect(() => {
    if (!messageListRef.current) return
    messageListRef.current.scrollTop = messageListRef.current.scrollHeight
  }, [messages])

  useEffect(() => {
    if (!channel) return
    return channel.connect(handleMessage)
  }, [channel])

  useEffect(() => {
    async function initalizeChat() {
      const userId = Math.random() < 0.5 ? "support-agent" : "supported-user"
      const channelId = "support-channel"
      const chat = await Chat.init({
        subscribeKey: "sub-c-2e5fa5c4-fd65-4ef8-9246-286dde521c20",
        publishKey: "pub-c-58c29876-cff9-4f15-bb16-6bd785739fe4",
        userId,
      })
      const user = await chat.currentUser.update(userData[userId])
      const channel =
        (await chat.getChannel(channelId)) ||
        (await chat.createChannel(channelId, { name: "Support Channel" }))
      setChat(chat)
      setUsers([user])
      setChannel(channel)
    }

    initalizeChat()
  }, [])

  if (!chat || !channel) return "Loading..."

  return (
    <main>
      <header>
        <h3>{channel.name}</h3>
        <h3>{chat.currentUser.name}</h3>
      </header>

      <section className="message-list" ref={messageListRef}>
        <ol>
          {messages.map((message) => {
            const user = users.find((user) => user.id === message.userId)
            return (
              <li key={message.timetoken}>
                <aside style={{ background: String(user?.custom?.avatar) }}>
                  {user?.custom?.initials}
                </aside>
                <article>
                  <h3>
                    {user?.name}
                    <time>
                      {TimetokenUtils.timetokenToDate(message.timetoken).toLocaleTimeString([], {
                        timeStyle: "short",
                      })}
                    </time>
                  </h3>
                  <p>{message.text}</p>
                </article>
              </li>
            )
          })}
        </ol>
      </section>

      <form className="message-input" onSubmit={handleSend}>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Send message"
        />
        <input type="submit" value="➔" onClick={handleSend} style={{ color: text && "#de2440" }} />
      </form>
    </main>
  )
}
