import React, { useCallback, useEffect, useRef, useState, useCallback } from "react"
import * as Quill from "quill"
import "quill/dist/quill.snow.css"
import "quill-mention"
import { Channel, Chat, Message, MixedTextTypedElement, TimetokenUtils, User } from "@pubnub/chat"
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
  const [file, setFile] = useState<FileList>(null)
  const messageListRef = useRef<HTMLElement>(null)

  const [q, setQ] = useState()

  async function handleSend(event: React.SyntheticEvent) {
    event.preventDefault()
    if (!channel) return

    if (file.length) {
      const response = await chat?.sdk.sendFile({
        channel: channel?.id,
        file,
        storeInHistory: false,
      })
      const { id, name, timetoken } = response
      const url = await chat?.sdk.getFileUrl({ channel: channel.id, id, name })
      console.log("file upload re: ", response)
      console.log("file upload url: ", url)
    } else {
      const delta = q?.getContents()
      await channel?.sendDelta(delta.ops)
      // await chat.sdk.publish({ channel: channel.id, message: { type: "text", delta: delta.ops } })
      q.setContents([{ insert: "\n" }])
    }
  }

  // ?TODO: check if these links still work
  // http://ps16.pndsn.com/v1/files/sub-c-2e5fa5c4-fd65-4ef8-9246-286dde521c20/channels/support-channel/files/b92d71fa-8162-46c5-bfc9-812a145eb1dc/72_Digital-Nomads_Can-1.pdf?uuid=support-agent&pnsdk=PubNub-JS-Web%2F7.2.2
  // https://files-eu-central-1.pndsn.com/sub-c-2e5fa5c4-fd65-4ef8-9246-286dde521c20/z0F2VJgBTHPoSRnQ7f1p4ainzv_zCWAOhT5QiQqYay4/b92d71fa-8162-46c5-bfc9-812a145eb1dc/72_Digital-Nomads_Can-1.pdf?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAY7AU6GQDV5LCPVEX%2F20230731%2Feu-central-1%2Fs3%2Faws4_request&X-Amz-Date=20230731T130000Z&X-Amz-Expires=3900&X-Amz-SignedHeaders=host&X-Amz-Signature=1eb5a36e7543a4e5c5389c78e1dacf10fcab7cfb42b60f9c9ec3a3e0b720e1fd
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

  const renderMessagePart = useCallback((messagePart: MixedTextTypedElement) => {
    if (messagePart.type === "text") {
      return messagePart.content.text
    }
    if (messagePart.type === "plainLink") {
      return <a href={messagePart.content.link}>{messagePart.content.link}</a>
    }
    if (messagePart.type === "textLink") {
      return <a href={messagePart.content.link}>{messagePart.content.text}</a>
    }
    if (messagePart.type === "mention") {
      return <a href={`https://pubnub.com/${messagePart.content.id}`}>{messagePart.content.name}</a>
    }

    return ""
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
        <div className="wrapper" style={{ flexGrow: 1 }}>
          <div id="editor" ref={inputRef} />
        </div>
        <input
          type="submit"
          value="➔"
          onClick={handleSend}
          // style={{ color: text && "#de2440" }}
        />
        <input
          type="file"
          onChange={(ev) => {
            const files = ev.target.files
            console.log("currently picked files: ", files)
            setFile(files)
          }}
          multiple={true}
        />
        <input
          type="button"
          onClick={async () => {
            const { messages } = await channel.getHistory()
            console.log("Hsitory is: ", messages)
          }}
          value="History"
        />
      </form>
    </main>
  )
}
