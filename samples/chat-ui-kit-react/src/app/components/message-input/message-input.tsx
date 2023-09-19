import React from "react"
import { Channel, Membership, MessageDraft } from "@pubnub/chat"
import { Button, MessageInput as ChatScopeMessageInput } from "@chatscope/chat-ui-kit-react"

type MessageInputProps = {
  isMember: boolean
  currentChannel: Channel
  messageDraft: MessageDraft
  onChangeInput: (text: string) => void
  onMessageSend: () => void
  onOpenFileDialog: () => void
  setCurrentChannelMembers: (members: Membership[]) => void
}

export function MessageInput({
  isMember,
  messageDraft,
  onMessageSend,
  onChangeInput,
  onOpenFileDialog,
  currentChannel,
  setCurrentChannelMembers,
}: MessageInputProps) {
  if (!isMember) {
    return (
      <div>
        <div>You are previewing this channel. Join it in order to write messages.</div>
        <Button
          border
          onClick={async () => {
            const joinData = await currentChannel?.join(() => null)
            joinData.disconnect()
            const channelMembers = await currentChannel.getMembers()
            setCurrentChannelMembers(channelMembers.members)
          }}
        >
          Click here to join
        </Button>
      </div>
    )
  }

  return (
    <ChatScopeMessageInput
      placeholder="Type message here"
      value={messageDraft?.value}
      onChange={onChangeInput}
      onSend={onMessageSend}
      onAttachClick={onOpenFileDialog}
    />
  )
}
