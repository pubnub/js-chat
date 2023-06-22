import { Chat } from "./chat"
import { User } from "./user"
import { Channel } from "./channel"
import { SendTextOptionParams } from "../types"

declare global {
  interface Array<T> {
    findLastIndex(predicate: (value: T, index: number, obj: T[]) => unknown, thisArg?: any): number
  }
}

export class MessageDraft {
  private chat: Chat
  private channel: Channel
  public value = ""
  private previousValue = ""
  private mentionedUsers: {
    [nameOccurrenceIndex: number]: User
  } = {}

  constructor(chat: Chat, channel: Channel) {
    this.chat = chat
    this.channel = channel
  }

  onChange(text: string) {
    this.previousValue = this.value
    this.value = text

    const previousWordsStartingWithAt = this.previousValue
      .split(" ")
      .filter((word) => word.startsWith("@"))
    const currentWordsStartingWithAt = this.value.split(" ").filter((word) => word.startsWith("@"))
    let differentMentionPosition = -1

    const differentMentions = currentWordsStartingWithAt.filter((m, i) => {
      const isStringDifferent = previousWordsStartingWithAt.indexOf(m) === -1

      if (isStringDifferent) {
        differentMentionPosition = i
      }

      return previousWordsStartingWithAt.indexOf(m) === -1
    })

    Object.keys(this.mentionedUsers).forEach((key) => {
      const mentionedUserName = this.mentionedUsers[Number(key)]?.name

      if (mentionedUserName && !currentWordsStartingWithAt[Number(key)]) {
        delete this.mentionedUsers[Number(key)]
      }

      const splitMentionsByAt = (this.value.match(/(?<=^|\s)@[^@\s]+(?:\s+[^@\s]+)*/g) || []).map(
        (splitMention) => splitMention.substring(1)
      )

      if (mentionedUserName && !splitMentionsByAt[Number(key)]?.startsWith(mentionedUserName)) {
        delete this.mentionedUsers[Number(key)]
      }
    })

    const differentMention = differentMentions.length
      ? {
          name: differentMentions[0],
          nameOccurrenceIndex: differentMentionPosition,
        }
      : null

    return {
      differentMention,
    }
  }

  addMentionedUser(user: User, mention: { name: string; nameOccurrenceIndex: number }) {
    let counter = 0
    let result = ""
    let isUserFound = false

    this.value.split(" ").forEach((word) => {
      if (!word.startsWith("@")) {
        result += `${word} `
      } else {
        if (counter !== mention.nameOccurrenceIndex) {
          result += `${word} `
        } else {
          result += `@${user.name} `
          this.mentionedUsers[mention.nameOccurrenceIndex] = user
          isUserFound = true
        }
        counter++
      }
    })

    if (!isUserFound) {
      throw "This user does not appear in the text"
    }

    this.value = result.trim()
  }

  async send(params: Omit<SendTextOptionParams, "mentionedUsers"> = {}) {
    return this.channel.sendText(this.value, {
      ...params,
      mentionedUsers: Object.keys(this.mentionedUsers).reduce(
        (acc, key) => ({
          ...acc,
          [key]: {
            id: this.mentionedUsers[Number(key)].id,
            name: this.mentionedUsers[Number(key)].name,
          },
        }),
        {}
      ),
    })
  }

  getHighlightedMention(selectionStart: number) {
    const necessaryText = this.value.slice(0, selectionStart - 1)
    const necessaryTextSplitBySpace = necessaryText.split(" ")
    const onlyWordsWithAt = necessaryTextSplitBySpace.filter((word) => word.startsWith("@"))
    const lastMentionedUserInTextIndex = necessaryTextSplitBySpace.findLastIndex((word) =>
      word.startsWith("@")
    )
    const lastMentionedUserInText = necessaryTextSplitBySpace.slice(
      lastMentionedUserInTextIndex,
      necessaryTextSplitBySpace.length
    )
    const lastMentionedUser = this.mentionedUsers[onlyWordsWithAt.length - 1]

    if (!lastMentionedUser?.name) {
      return null
    }

    if (lastMentionedUserInText.length <= lastMentionedUser.name.split(" ").length) {
      return lastMentionedUser
    }

    return null
  }
}
