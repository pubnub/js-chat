import { Chat } from "./chat";
import { User } from "./user";

export class MessageToSend {
  private chat: Chat
  public value: string = ""
  private previousValue: string = ""
  private mentionedUsers: {
    [nameOccurrenceIndex: number]: User
  } = {}
  private historicallyMentionedUsers: {
    [nameOccurrenceIndex: number]: User
  } = {}

  constructor(chat: Chat) {
    this.chat = chat
  }

  private getWord = (pos: number) => {
    const n = this.value.substring(pos).match(/^[a-zA-Z0-9-_@]+/)
    const p = this.value.substring(0, pos).match(/[a-zA-Z0-9-_@]+$/)
    // if you really only want the word if you click at start or between
    // but not at end instead use if (!n) return
    if(!p && !n) return ''
    return <string>(p || '') + (n || '')
  }

  onChange(text: string) {
    this.previousValue = this.value
    this.value = text

    let previousMentions = this.previousValue.split(" ").filter(word => word.startsWith("@"))
    let currentMentions = this.value.split(" ").filter(word => word.startsWith("@"))
    let differentMentionPosition = -1

    const differentMentions = currentMentions.filter((m, i) => {
      const isStringDifferent = previousMentions.indexOf(m) === -1

      if (isStringDifferent) {
        differentMentionPosition = i
      }

      return previousMentions.indexOf(m) === -1
    });

    this.mentionedUsers = currentMentions.reduce((acc, curr) => {
      const previousMentionIndex = previousMentions.indexOf(curr)
      const currentMentionIndex = currentMentions.indexOf(curr)

      if (!this.historicallyMentionedUsers[previousMentionIndex]) {
        return acc
      }

      if (previousMentionIndex !== currentMentionIndex) {
        return {
          ...acc,
          [currentMentionIndex]: this.historicallyMentionedUsers[previousMentionIndex],
        }
      }

      return {
        ...acc,
        [previousMentionIndex !== currentMentionIndex ? currentMentionIndex : previousMentionIndex]: this.historicallyMentionedUsers[previousMentionIndex] || null,
      }
    }, {})

    if (differentMentionPosition !== -1) {
      delete this.mentionedUsers[differentMentionPosition]
    }

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
          counter++
          result += `${word} `
        } else {
          counter++
          result += `@${user.name} `
          this.mentionedUsers[mention.nameOccurrenceIndex] = user
          this.historicallyMentionedUsers[mention.nameOccurrenceIndex] = user
          isUserFound = true
        }
      }
    })

    if (!isUserFound) {
      throw "This user does not appear in the text"
    }

    this.value = result.trim()
  }

  getPayloadToSend() {
    let counter = 0;
    let result = ""

    this.value.split(" ").forEach((word) => {
      if (!word.startsWith("@")) {
        result += `${word} `
      } else {
        const mentionFound = Object.keys(this.mentionedUsers).indexOf(String(counter)) >= 0

        if (!mentionFound) {
          counter++
          result += `${word} `
        } else {
          const userId = this.mentionedUsers[counter].id
          counter++
          result += `<mentioned-user id="${userId}">${word}</mentioned-user> `
        }
      }
    })
    // console.log("this.mentionedUsers?", this.mentionedUsers)

    return {
      text: this.value,
      mentionedUserIds: Object.keys(this.mentionedUsers).reduce((acc, key) => ({ ...acc, [key]: this.mentionedUsers[Number(key)].id }), {}),
    }
  }

  getHighlightedMention(selectionStart: number) {
    const highlightedWord = this.getWord(selectionStart)

    if (!highlightedWord.startsWith("@")) {
      return null
    }

    const necessaryText = this.value.slice(0, selectionStart)

    // let counter = 0;

    const onlyWordsWithAt = necessaryText.split(" ").filter(word => word.startsWith("@"))

    if (this.mentionedUsers[onlyWordsWithAt.length - 1]) {
      return this.mentionedUsers[onlyWordsWithAt.length - 1]
    } else {
      return null
    }

    // necessaryText.split(" ").forEach((word, index) => {
    //   if (wo) {
    //     const mentionFound = Object.keys(this.mentionedUsers).indexOf(String(counter)) >= 0
    //
    //     if (!mentionFound) {
    //       counter++
    //     } else {
    //
    //
    //       const userId = this.mentionedUsers[counter].id
    //       counter++
    //     }
    //   }
    // })
  }
}
