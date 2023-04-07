import { useState } from "react"
import { useStore } from "@nanostores/react"
import { chatAtom } from "../store"
import { extractErrorMessage } from "./helpers"
import { Channel } from "@pubnub/chat"

export default function () {
  const chat = useStore(chatAtom)
  const [createForm, setCreateForm] = useState({ id: "", name: "" })
  const [presence, setPresence] = useState<string[]>([])
  const [channel, setChannel] = useState<Channel>()
  const [input, setInput] = useState("")
  const [textInput, setTextInput] = useState("")
  const [typingUserIds, setTypingUserIds] = useState<string[]>([])
  const [error, setError] = useState("")

  async function handleCreateChannel() {
    try {
      const channel = await chat.createChannel(createForm.id, { name: createForm.name })
      setCreateForm({ id: "", name: "" })
      setChannel(channel)
    } catch (e: any) {
      setError(extractErrorMessage(e))
      console.error(e)
    }
  }

  async function handleGetChannel() {
    try {
      const channel = await chat.getChannel(input)
      channel?.getTyping((userIds) => setTypingUserIds(userIds))
      setChannel(channel)
    } catch (e: any) {
      setError(extractErrorMessage(e))
      console.error(e)
    }
  }

  async function handleGetPresence() {
    try {
      const ids = await channel?.whoIsPresent(input)
      setPresence(ids)
    } catch (e: any) {
      setError(extractErrorMessage(e))
      console.error(e)
    }
  }

  async function handleTextInput(e) {
    const newText = e.target.value
    setTextInput(newText)
    if (newText) await channel?.startTyping()
    else await channel?.stopTyping()
  }

  return (
    <>
      {error ? <p className="error my-4">{error}</p> : null}

      <div className="grid lg:grid-cols-2 gap-8 mt-6">
        <section>
          <h3>Create channel</h3>
          <label htmlFor="getChannel">Channel ID</label>
          <input
            type="text"
            name="getChannel"
            value={createForm.id}
            onChange={(e) => setCreateForm((f) => ({ ...f, id: e.target.value }))}
          />
          <label htmlFor="getChannel">Channel name</label>
          <input
            type="text"
            name="getChannel"
            value={createForm.name}
            onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
          />
          <button className="float-right mt-3" onClick={handleCreateChannel}>
            Create channel
          </button>
        </section>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 mt-6">
        <section>
          <h3>Get channel</h3>
          <label htmlFor="getChannel">Channel ID</label>
          <input
            type="text"
            name="getChannel"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button className="float-right mt-3" onClick={handleGetChannel}>
            Get channel
          </button>
        </section>
      </div>

      {channel ? (
        <>
          <div className="grid lg:grid-cols-2 gap-8 mt-6">
            <section>
              <h3>Channel presence</h3>
              <button className="mb-3" onClick={handleGetPresence}>
                Get channel presence
              </button>
              <p>
                <b>Channel presence: </b>
                {presence.join(", ")}
              </p>
            </section>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 mt-6">
            <section>
              <h3>Sending text messages</h3>
              <label htmlFor="sendText">Type a message</label>
              <input type="text" name="sendText" value={textInput} onChange={handleTextInput} />
            </section>

            <section>
              <h3>Typing indicators</h3>
              <p>
                <b>Currently typing user ids: </b>
                {typingUserIds.join(", ")}
              </p>
            </section>
          </div>
        </>
      ) : (
        <p>Get a channel to unlock additional features</p>
      )}
    </>
  )
}
