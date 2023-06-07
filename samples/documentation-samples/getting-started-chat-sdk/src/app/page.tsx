'use client';
import { useState, useEffect, createContext, useContext, ChangeEvent } from "react";
import Image from 'next/image';
import { Channel, Chat, Message, User } from "@pubnub/chat"
import './styles.scss'

const PubNubChatContext = createContext<{
  chat: Chat | null
  currentChannel: Channel | null
}>({
  chat: null,
  currentChannel: null,
});

export default function Home() {
  const [pubnubChat, setPubnubChat] = useState<Chat | null>(null)
  const [channel, setChannel] = useState<Channel | null>(null)

  useEffect(() => {
    async function initChat() {
      const chat = await Chat.init({
        publishKey: "pub-c-0457cb83-0786-43df-bc70-723b16a6e816",
        subscribeKey: "sub-c-e654122d-85b5-49a6-a3dd-8ebc93c882de",
        userId: Math.random() < 0.5 ? "test-user-1" : "test-user-2",
      })

      setPubnubChat(chat)

      const channel = await chat.getChannel("test-channel") || await chat.createChannel("test-channel", { name: "A test channel" })
      setChannel(channel)
    }

    initChat()
  }, [])

  if (!pubnubChat || !channel) {
    return (
      <div>
        Loading content...
      </div>
    )
  }

  return (
    <PubNubChatContext.Provider value={{
      chat: pubnubChat,
      currentChannel: channel,
    }}>
      <main className="main">
        <div className="main-subcontainer">
          <MessageList />
          <MessageInput />
        </div>
      </main>
    </PubNubChatContext.Provider>
  )
}

function MessageInput() {
  const { chat, currentChannel } = useContext(PubNubChatContext)
  const [inputText, setInputText] = useState("")
  const [loading, setLoading] = useState(false)

  function handleInputChange(event: ChangeEvent<HTMLTextAreaElement>) {
    setInputText(event.target.value)
  }

  async function handleSendClick() {
    if (!currentChannel) {
      return null
    }

    setLoading(true)
    const response = await currentChannel.sendText(inputText, {
      meta: { foo: "bar" },
    })
    setLoading(false)
    setInputText("")
  }

  return (
    <div
      className="pn-msg-input pn-msg-input--light"
    >
      <div className="pn-msg-input__wrapper">
        <textarea
          className="pn-msg-input__textarea"
          onChange={handleInputChange}
          placeholder="Write something in here..."
          rows={1}
          value={inputText}
        />
        <button
          className={`pn-msg-input__send ${isValidInputText(inputText) && "pn-msg-input__send--active"}`}
          disabled={loading}
          onClick={handleSendClick}
          title="Send"
        >
          <Image src="/airplane.svg" alt="" width={20} height={20} />
        </button>
      </div>
    </div>
  )
}

function MessageList() {
  const [messages, setMessages] = useState<Message[]>([])
  const { chat, currentChannel } = useContext(PubNubChatContext)

  useEffect(() => {
    let disconnectFunction = () => {}

    async function init() {
      if (!currentChannel) {
        return () => null
      }

      const historicalMessagesObject = await currentChannel.getHistory()
      setMessages(historicalMessagesObject.messages)
      disconnectFunction = currentChannel.connect(newMessage => {
        setMessages(currentMessages => [...currentMessages, newMessage])
      })
    }

    init()

    return () => {
      disconnectFunction()
    }
  }, [currentChannel])

  return (
    <section className="pn-msg-list pn-msg-list--light">
      <div className="pn-msg-list-scroller">
        <div className="pn-msg-list__spacer" />
        <ul>
          {messages.map(msg => (
            <li key={msg.timetoken}>
              <MessageItem {...msg} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

const getTime = (timestamp: number) => {
  const ts = String(timestamp);
  const date = new Date(parseInt(ts) / 10000);
  return date.toLocaleTimeString([], { timeStyle: "short" });
  /* toLocaleTimeString internally uses Intl API if available
   * Otherwise the options passed to it will be ignored (e.g. on Android devices) */
};

function MessageItem(props: Message) {
  const { chat } = useContext(PubNubChatContext)
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    if (!props.userId) {
      return
    }
    chat?.getUser(props.userId).then(u => setUser(u))
  }, [props.userId])

  const uuid = props.userId;

  const time = getTime(Number(props.timetoken));

  return (
    <div className="pn-msg" key={props.timetoken}>
      <>
        <div className="pn-msg__avatar" style={{ backgroundColor: getPredefinedColor(uuid) }}>
          {user?.profileUrl ? (
            <img src={user.profileUrl} alt="User avatar" />
          ) : (
            getNameInitials(user?.name || uuid)
          )}
        </div>

        <div className="pn-msg__main">
          <div className="pn-msg__content">
            <div className="pn-msg__title">
              <span className="pn-msg__author">{user?.name || uuid}</span>
              <span className="pn-msg__time">{time}</span>
            </div>
            <div className="pn-msg__bubble">{props.content.text}</div>
          </div>
        </div>
      </>
    </div>
  )
}

function getNameInitials(name: string): string {
  if (!name || !name.length) return "";
  const nameSplit = name.split(" ");
  const initials =
    nameSplit.length == 1 ? nameSplit[0].substring(0, 2) : nameSplit[0][0] + nameSplit[1][0];
  return initials.toUpperCase();
}

function getPredefinedColor(uuid: string): string {
  if (!uuid || !uuid.length) return;
  const colors = ["#80deea", "#9fa7df", "#aed581", "#ce93d8", "#ef9a9a", "#ffab91", "#ffe082"];
  const sum = uuid
    .split("")
    .map((c) => c.charCodeAt(0))
    .reduce((a, b) => a + b);
  return colors[sum % colors.length];
}

function isValidInputText(text: string) {
  return !!text.trim().length
}
