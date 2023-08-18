import React from "react"
import { Event, User } from "@pubnub/chat"
import styles from "./mention-popup.module.css"
import { Button } from "@chatscope/chat-ui-kit-react"

type MentionPopupProps = {
  mentionEventData: Event<"mention"> | null
  userWhoMentioned: User
  setMentionEventData: (value: null) => void
}

export function MentionPopup({
  mentionEventData,
  userWhoMentioned,
  setMentionEventData,
}: MentionPopupProps) {
  if (!mentionEventData) {
    return null
  }

  return (
    <div className={styles["mention-popup-container"]}>
      <div>
        You were mentioned at {mentionEventData.payload.channel} by{" "}
        {userWhoMentioned?.name || mentionEventData.userId}
      </div>
      <Button border onClick={() => setMentionEventData(null)}>
        Close
      </Button>
    </div>
  )
}
