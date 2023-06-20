import { Chat } from "./chat";
import { User } from "./user";

declare global {
  interface Array<T> {
    findLastIndex(
      predicate: (value: T, index: number, obj: T[]) => unknown,
      thisArg?: any
    ): number
  }
}

export class MessageToSend {
  private chat: Chat
  public value: string = ""
  private previousValue: string = ""
  private mentionedUsers: {
    [nameOccurrenceIndex: number]: User
  } = {}

  constructor(chat: Chat) {
    this.chat = chat
  }

  onChange(text: string) {
    this.previousValue = this.value
    this.value = text

    let previousWordsStartingWithAt = this.previousValue.split(" ").filter(word => word.startsWith("@"))
    let currentWordsStartingWithAt = this.value.split(" ").filter(word => word.startsWith("@"))
    let differentMentionPosition = -1

    const differentMentions = currentWordsStartingWithAt.filter((m, i) => {
      const isStringDifferent = previousWordsStartingWithAt.indexOf(m) === -1

      if (isStringDifferent) {
        differentMentionPosition = i
      }

      return previousWordsStartingWithAt.indexOf(m) === -1
    });

    Object.keys(this.mentionedUsers).forEach((key) => {
      const mentionedUserName = this.mentionedUsers[Number(key)]?.name

      if (mentionedUserName && !currentWordsStartingWithAt[Number(key)]) {
        delete this.mentionedUsers[Number(key)]
      }
    })

    const differentMention = differentMentions.length ? {
      name: differentMentions[0],
      nameOccurrenceIndex: differentMentionPosition,
    } : null

    return {
      differentMention,
    }
  }

  addMentionedUser(user: User, mention: { name: string, nameOccurrenceIndex: number }) {
    let counter = 0;
    let result = ""
    let isUserFound = false

    this.value.split(" ").forEach(word => {
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

  getPayloadToSend() {
    return {
      text: this.value,
      mentionedUsers: Object.keys(this.mentionedUsers).reduce((acc, key) => ({ ...acc, [key]: { id: this.mentionedUsers[Number(key)].id, name: this.mentionedUsers[Number(key)].name } }), {}),
    }
  }

  getHighlightedMention(selectionStart: number) {
    const necessaryText = this.value.slice(0, selectionStart - 1)

    const necessaryTextSplitBySpace = necessaryText.split(" ")

    const onlyWordsWithAt = necessaryTextSplitBySpace.filter(word => word.startsWith("@"))

    const lastMentionedUserInTextIndex = necessaryTextSplitBySpace.findLastIndex(word => word.startsWith("@"))

    const lastMentionedUserInText = necessaryTextSplitBySpace.slice(lastMentionedUserInTextIndex, necessaryTextSplitBySpace.length)

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
