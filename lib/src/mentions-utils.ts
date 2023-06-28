import { MessageMentionedUsers } from "./types"

export class MentionsUtils {
  static getPhraseToLookFor(text: string) {
    const lastAtIndex = text.lastIndexOf("@")
    const charactersAfterAt = text.split("@").slice(-1)[0]

    if (lastAtIndex === -1 || charactersAfterAt.length < 3) {
      return null
    }

    const splitWords = charactersAfterAt.split(" ")

    if (splitWords.length > 2) {
      return null
    }

    return splitWords[0] + (splitWords[1] ? ` ${splitWords[1]}` : "")
  }

  static getLinkedText({
    text,
    userCallback,
    mentionedUsers,
  }: {
    text: string
    userCallback: (userId: string, mentionedName: string) => any
    mentionedUsers: MessageMentionedUsers
  }) {
    if (!mentionedUsers || !Object.keys(mentionedUsers).length) {
      return text
    }

    let counter = 0
    let result = ""
    // multi word names
    let indicesToSkip: number[] = []

    text.split(" ").forEach((word, index) => {
      if (!word.startsWith("@")) {
        if (indicesToSkip.includes(index)) {
          return
        }

        result += `${word} `
      } else {
        const mentionFound = Object.keys(mentionedUsers).indexOf(String(counter)) >= 0

        if (!mentionFound) {
          counter++
          result += `${word} `
        } else {
          const userId = mentionedUsers[counter].id
          const userName = mentionedUsers[counter].name
          const userNameWords = userName.split(" ")

          if (userNameWords.length > 1) {
            indicesToSkip = userNameWords.map((_, i) => index + i)
          }

          counter++
          result += `${userCallback(userId, userName)} `
        }
      }
    })

    return result
  }
}
