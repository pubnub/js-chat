import React, { Dispatch, FormEvent, SetStateAction, useCallback, useState } from "react"
import styles from "./create-channel-dialog.module.css"
import { Channel, Chat, User } from "@pubnub/chat"

type CreateChannelDialogProps = {
  isCreateNewChannelDialogOpen: boolean
  setIsCreateNewChannelDialogOpen: (value: boolean) => void
  setChannels: Dispatch<SetStateAction<Channel[]>>
  setChannelsThumbnails: (t: Map<string, string>) => void
  channelsThumbnails: Map<string, string>
  chat: Chat
}

export function CreateChannelDialog({
  chat,
  isCreateNewChannelDialogOpen,
  setChannels,
  setIsCreateNewChannelDialogOpen,
  setChannelsThumbnails,
  channelsThumbnails,
}: CreateChannelDialogProps) {
  const [channelCreationSuggestedUsers, setChannelCreationSuggestedUsers] = useState<User[]>([])
  const [channelCreationInvitedUsers, setChannelCreationInvitedUsers] = useState<User[]>([])
  const [channelCreationChannelName, setChannelCreationChannelName] = useState("")
  const [channelCreationChannelId, setChannelCreationChannelId] = useState("")
  const [channelCreationChannelType, setChannelCreationChannelType] = useState("")

  const createChannel = useCallback(
    async (event: FormEvent) => {
      event.preventDefault()
      if (!chat) {
        return
      }

      let newChannel: Channel | undefined
      if (channelCreationChannelType === "public") {
        if (!channelCreationChannelId || !channelCreationChannelName) {
          return
        }
        newChannel = await chat.createPublicConversation({
          channelId: channelCreationChannelId,
          channelData: { name: channelCreationChannelName },
        })
      } else if (channelCreationChannelType === "group") {
        if (!channelCreationChannelId || !channelCreationChannelName) {
          return
        }
        newChannel = (
          await chat.createGroupConversation({
            users: channelCreationInvitedUsers,
            channelId: channelCreationChannelId,
            channelData: { name: channelCreationChannelName },
          })
        ).channel
      } else if (channelCreationChannelType === "1:1") {
        if (!channelCreationInvitedUsers[0] || !channelCreationChannelName) {
          return
        }
        newChannel = (
          await chat.createDirectConversation({
            user: channelCreationInvitedUsers[0],
            channelData: { name: channelCreationChannelName },
          })
        ).channel
      }

      if (newChannel) {
        setChannelsThumbnails(
          channelsThumbnails.set(
            newChannel.id,
            `https://loremflickr.com/40/40?random=${newChannel.id}`
          )
        )
        setChannels((chns) => [newChannel as Channel, ...chns])
      }
      setIsCreateNewChannelDialogOpen(false)
    },
    [
      channelCreationChannelType,
      channelCreationChannelName,
      channelCreationInvitedUsers,
      channelCreationChannelId,
      chat,
    ]
  )

  if (!isCreateNewChannelDialogOpen) {
    return null
  }

  return (
    <div className={styles["create-new-conversation-popup-container"]}>
      <h1>Create a new channel</h1>
      <form onSubmit={createChannel}>
        <fieldset>
          <legend>Choose channel type</legend>

          <input
            type="radio"
            id="new-public-conversation"
            name="conversation-type"
            value="new-public-conversation"
            onChange={() => setChannelCreationChannelType("public")}
          />
          <label htmlFor="new-public-conversation">Public</label>
          <br />

          <input
            type="radio"
            id="new-group-conversation"
            name="conversation-type"
            value="new-group-conversation"
            onChange={() => setChannelCreationChannelType("group")}
          />
          <label htmlFor="new-group-conversation">Group</label>
          <br />

          <input
            type="radio"
            id="new-one-on-one-conversation"
            name="conversation-type"
            value="new-one-on-one-conversation"
            onChange={() => {
              setChannelCreationChannelType("1:1")
              if (channelCreationInvitedUsers.length) {
                setChannelCreationInvitedUsers((usrs) => [usrs[0]])
              }
            }}
          />
          <label htmlFor="new-one-on-one-conversation">1:1</label>
        </fieldset>
        <fieldset>
          <legend>Channel name</legend>
          <input
            type="text"
            id="channel-name"
            name="channel-name"
            value={channelCreationChannelName}
            onChange={(e) => setChannelCreationChannelName(e.target.value)}
          />
          <label htmlFor="channel-name">channel-name</label>
        </fieldset>
        {channelCreationChannelType !== "1:1" && (
          <fieldset>
            <legend>Channel id</legend>
            <input
              type="text"
              id="channel-id"
              name="channel-id"
              value={channelCreationChannelId}
              onChange={(e) => setChannelCreationChannelId(e.target.value)}
            />
            <label htmlFor="channel-id">channel-id</label>
          </fieldset>
        )}
        <fieldset>
          <legend>Who are you inviting to this channel?</legend>
          <input
            type="text"
            onChange={(e) => {
              chat?.getUserSuggestions(e.target.value).then((us) => {
                setChannelCreationSuggestedUsers(us)
              })
            }}
          />
          <select
            onChange={(e) => {
              if (channelCreationChannelType === "1:1") {
                setChannelCreationInvitedUsers([
                  channelCreationSuggestedUsers[Number(e.target.value)],
                ])
              } else {
                setChannelCreationInvitedUsers((currentlyInvitedUsers) => [
                  ...currentlyInvitedUsers,
                  channelCreationSuggestedUsers[Number(e.target.value)],
                ])
              }
            }}
          >
            {channelCreationSuggestedUsers.map((u, i) => {
              return (
                <option key={u.id} value={i}>
                  name: {u.name}, id: {u.id}
                </option>
              )
            })}
          </select>
          <div>Invited users:</div>
          <ul>
            {channelCreationInvitedUsers.map((u) => (
              <li key={u.id}>
                name: {u.name}, id: {u.id}
              </li>
            ))}
          </ul>
        </fieldset>
        <input type="submit" value="submit" />
      </form>
    </div>
  )
}
