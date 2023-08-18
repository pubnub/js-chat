import React from "react"
import styles from "./autosuggestion-box.module.css"
import { User } from "@pubnub/chat"

type AutosuggestionBoxProps = {
  users: User[]
  toggleUserToNotify: (user: User) => void
}

export const AutosuggestionBox = ({ users, toggleUserToNotify }: AutosuggestionBoxProps) => {
  if (!users.length) {
    return null
  }

  return (
    <div className={styles["autosuggestion-box-container"]}>
      <ul className={styles["autosuggestion-box-container__list-container"]}>
        {users.map((user) => (
          <li key={user.id} onClick={() => toggleUserToNotify(user)}>
            {user.name}
          </li>
        ))}
      </ul>
    </div>
  )
}
