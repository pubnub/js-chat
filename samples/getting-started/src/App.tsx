import React, { useCallback, useEffect, useRef, useState } from "react"
import * as Quill from "quill"
import "quill/dist/quill.snow.css"
import "quill-mention"
import { Channel, Chat, Message, TimetokenUtils, User } from "@pubnub/chat"
import "./App.css"

const userData = {
  "support-agent": { name: "John (Support Agent)", custom: { initials: "SA", avatar: "#9fa7df" } },
  "supported-user": { name: "Mary Watson", custom: { initials: "MW", avatar: "#ffab91" } },
}

export default function App() {
  const [chat, setChat] = useState<Chat>()
  const [users, setUsers] = useState<User[]>([])
  const [channel, setChannel] = useState<Channel>()
  const [messages, setMessages] = useState<Message[]>([])
  const [files, setFiles] = useState<FileList>(null)
  const [q, setQ] = useState()
  const messageListRef = useRef<HTMLElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleSend(event: React.SyntheticEvent) {
    event.preventDefault()
    if (!channel) return

    // q?.insertEmbed(10, "image", "https://www.pubnub.com/pubnub_logo.svg")
    const delta = q?.getContents()
    console.log("Sending delta: ", delta)
    await channel?.sendDelta(delta.ops, { files })
    q.setContents([{ insert: "\n" }])
    setFiles(null)
    fileInputRef.current.value = null
  }

  async function handleMessage(message: Message) {
    console.log("received a message: ", message)
    if (chat && !users.find((user) => user.id === message.userId)) {
      const user = await chat.getUser(message.userId)
      if (user) setUsers((users) => [...users, user])
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

  const inputRef = useCallback(
    (node) => {
      if (!node || q) return
      const quill = new Quill(node, {
        theme: "snow",
        modules: {
          toolbar: [
            [{ size: ["small", false, "large", "huge"] }, { header: [false, 1, 2, 3] }],
            ["link", "image"],
            ["bold", "italic", "underline", "strike"],
            [{ list: "ordered" }, { list: "bullet" }],
            [{ color: [] }, { background: [] }],
            ["clean"],
          ],
          mention: {
            allowedChars: /^[A-Za-z\sÅÄÖåäö]*$/,
            mentionDenotationChars: ["@", "#"],
            source: async function (searchTerm, renderList) {
              const suggestions = await chat?.getUserSuggestions(`@${searchTerm}`)
              const users = suggestions?.map((u) => {
                u.value = u.name
                return u
              })
              renderList(users)
            },
          },
        },
      })
      setQ(quill)
    },
    [q, chat]
  )

  function renderContent(message: Message) {
    if (message.text) return <p>{message.text}</p>
    else {
      const tempCont = document.createElement("div")
      const quill = new Quill(tempCont, { theme: "snow", modules: { toolbar: false } })
      quill.setContents(message.content.delta)
      return (
        <div className="ql-editor" dangerouslySetInnerHTML={{ __html: quill.root.innerHTML }} />
      )
    }
  }

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

  if (!chat || !channel) return <p>Loading...</p>

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
                  {renderContent(message)}
                  {/* <p>
                    {message
                      .getLinkedText()
                      .map((messagePart: MixedTextTypedElement, i: number) => (
                        <span key={String(i)}>{renderMessagePart(messagePart)}</span>
                      ))}
                  </p> */}
                </article>
              </li>
            )
          })}
        </ol>
      </section>

      <form className="message-input" onSubmit={handleSend}>
        <div id="editor" ref={inputRef} />

        <div className="message-input-actions">
          <input
            type="file"
            onChange={(ev) => {
              const files = ev.target.files
              console.log("currently picked files: ", files)
              setFiles(files)
            }}
            multiple={true}
            ref={fileInputRef}
          />

          <input
            type="submit"
            value="➔"
            onClick={handleSend}
            // style={{ color: text && "#de2440" }}
          />
        </div>
        {/* <input
          type="button"
          onClick={async () => {
            const { messages } = await channel.getHistory()
            console.log("Hsitory is: ", messages)
          }}
          value="History"
        /> */}
      </form>
    </main>
  )
}
