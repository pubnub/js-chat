import { useState, useRef, useEffect } from "react"
import { useStore } from "@nanostores/react"
import { chatAtom } from "../store"
import { extractErrorMessage } from "./helpers"
import { Channel, Message, ThreadChannel } from "@pubnub/chat"
import MessageList from "./MessageList"

const defaultGetAllState = {
  channels: [],
  total: 0,
  page: { next: undefined, prev: undefined },
}

export default function () {
  const chat = useStore(chatAtom)
  const [createForm, setCreateForm] = useState({ id: "", name: "" })
  const [updateForm, setUpdateForm] = useState({
    id: "",
    name: "",
    description: "",
    status: "",
    type: "",
  })
  const [presence, setPresence] = useState<string[]>([])
  const [channel, setChannel] = useState<Channel>()
  const [respondingToMessage, setRespondingToMessage] = useState<Message>()
  const [threadChannel, setThreadChannel] = useState<ThreadChannel>()
  const [allChannels, setAllChannels] = useState<Channel[]>([])
  const getAllRef = useRef(defaultGetAllState)
  const [input, setInput] = useState("")
  const [typingUserIds, setTypingUserIds] = useState<string[]>([])
  const [error, setError] = useState("")

  async function handleCreate() {
    try {
      const channel = await chat.createChannel(createForm.id, { name: createForm.name })
      setCreateForm({ id: "", name: "" })
      setChannel(channel)
    } catch (e: any) {
      setError(extractErrorMessage(e))
      console.error(e)
    }
  }

  async function handleUpdate() {
    try {
      const { name, description, status, type } = updateForm
      const channel = await chat.updateChannel(updateForm.id, { name, description, status, type })
      setUpdateForm({ id: "", name: "", description: "", status: "", type: "" })
      setChannel(channel)
    } catch (e: any) {
      setError(extractErrorMessage(e))
      console.error(e)
    }
  }

  async function handleGet() {
    try {
      const channel = await chat.getChannel(input)
      console.log("Received channel: ", channel)
      setUpdateForm({ ...channel })
      setChannel(channel)
      if (channel.type !== "public") channel?.getTyping((userIds) => setTypingUserIds(userIds))
    } catch (e: any) {
      setError(extractErrorMessage(e))
      console.error(e)
    }
  }

  async function handleGetAll() {
    try {
      do {
        const { channels, page, total } = await chat.getChannels({
          limit: 2,
          page: getAllRef.current.page,
        })
        getAllRef.current = {
          channels: [...getAllRef.current.channels, ...channels],
          page,
          total,
        }
      } while (getAllRef.current.channels.length < getAllRef.current.total)
      setAllChannels(getAllRef.current.channels)
    } catch (e: any) {
      setError(extractErrorMessage(e))
      console.error(e)
    }
  }

  async function handleHardDelete() {
    try {
      if (!channel) return
      await channel.delete()
      setUpdateForm({ id: "", name: "", description: "", status: "" })
      setChannel(undefined)
    } catch (e: any) {
      setError(extractErrorMessage(e))
      console.error(e)
    }
  }

  async function handleSoftDelete() {
    try {
      if (!channel) return
      await channel.delete({ soft: true })
      setUpdateForm({ id: "", name: "", description: "", status: "" })
      setChannel(undefined)
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

  async function handleOpenThread(message: Message) {
    setRespondingToMessage(message)
    if (message.threadRootId) {
      const channel = await message.getThread()
      setThreadChannel(channel)
    } else {
      setThreadChannel(null)
    }
  }

  useEffect(() => {
    if (!allChannels.length) return
    return Channel.streamUpdatesOn(allChannels, setAllChannels)
  }, [allChannels])

  return (
    <>
      {error ? <p className="error my-4">{error}</p> : null}

      <div className="grid lg:grid-cols-2 gap-8 mt-6">
        <section>
          <h3>Get all channels</h3>
          <button className="mb-4" onClick={handleGetAll}>
            Get all channels
          </button>
          {allChannels.length ? (
            <div>
              <p>
                <b>Total count: </b>
                {allChannels.length}
              </p>
              <p>
                <b>Existing Channels: </b>
                {allChannels.map((c) => (
                  <li key={c.id}>
                    {c.id}: {c.name}
                  </li>
                ))}
              </p>
            </div>
          ) : null}
        </section>

        <section>
          <h3>Create channel</h3>
          <label htmlFor="getChannel">Channel ID</label>
          <input
            type="text"
            name="getChannel"
            value={createForm.id}
            onChange={(e) => setCreateForm((f) => ({ ...f, id: e.target.value }))}
          />
          <label htmlFor="getChannel">Name</label>
          <input
            type="text"
            name="getChannel"
            value={createForm.name}
            onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
          />
          <button className="float-right mt-3" onClick={handleCreate}>
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
          <button className="float-right mt-3" onClick={handleGet}>
            Get channel
          </button>
        </section>

        {channel ? (
          <section>
            <h3>Update channel</h3>
            <label htmlFor="update-id">Channel ID</label>
            <input
              type="text"
              name="update-id"
              value={updateForm.id}
              onChange={(e) => setUpdateForm((f) => ({ ...f, id: e.target.value }))}
            />
            <label htmlFor="update-name">Name</label>
            <input
              type="text"
              name="update-name"
              value={updateForm.name}
              onChange={(e) => setUpdateForm((f) => ({ ...f, name: e.target.value }))}
            />
            <label htmlFor="update-desc">Description</label>
            <input
              type="text"
              name="update-desc"
              value={updateForm.description}
              onChange={(e) => setUpdateForm((f) => ({ ...f, description: e.target.value }))}
            />
            <label htmlFor="update-status">Status</label>
            <input
              type="text"
              name="update-status"
              value={updateForm.status}
              onChange={(e) => setUpdateForm((f) => ({ ...f, status: e.target.value }))}
            />
            <label htmlFor="update-status">Type</label>
            <select
              name="update-type"
              value={updateForm.type}
              onChange={(e) => setUpdateForm((f) => ({ ...f, type: e.target.value }))}
            >
              <option value="">-- SELECT --</option>
              <option value="direct">Direct</option>
              <option value="group">Group</option>
              <option value="public">Public</option>
            </select>
            <nav className="float-right mt-3">
              <button className="mr-2" onClick={handleHardDelete}>
                Hard delete channel
              </button>
              <button className="mr-2" onClick={handleSoftDelete}>
                Soft delete channel
              </button>
              <button onClick={handleUpdate}>Update channel</button>
            </nav>
          </section>
        ) : null}
      </div>

      {channel ? (
        <>
          <div className="grid lg:grid-cols-2 gap-8 mt-10">
            <section>
              <h3>Typing indicators</h3>
              <p>
                <b>Currently typing user ids: </b>
                {typingUserIds.join(", ")}
              </p>
            </section>

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

          <h3 className="mt-10">Text messages</h3>
          <div className="grid lg:grid-cols-2 gap-8">
            <section>
              <MessageList channel={channel} handleOpenThread={handleOpenThread} />
            </section>

            {respondingToMessage ? (
              <section>
                <MessageList
                  channel={threadChannel}
                  rootMessage={respondingToMessage}
                  rootChannel={channel}
                />
              </section>
            ) : null}
          </div>
        </>
      ) : (
        <p className="mt-6">Get a channel to unlock additional features</p>
      )}
    </>
  )
}
