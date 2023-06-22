import { Chat } from "./chat"
import { User } from "./user"
import { Channel } from "./channel"
import { MessageDraftConfig, SendTextOptionParams } from "../types"

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
  readonly config: MessageDraftConfig

  constructor(chat: Chat, channel: Channel, config?: Partial<MessageDraftConfig>) {
    this.chat = chat
    this.channel = channel
    this.config = {
      userSuggestionSource: "channel",
      isTypingIndicatorTriggered: true,
      ...(config || {}),
    }
  }

  async onChange(text: string) {
    this.previousValue = this.value
    this.value = text

    if (this.config.isTypingIndicatorTriggered) {
      this.value ? this.channel.startTyping() : this.channel.stopTyping()
    }

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

    if (!differentMentions.length) {
      return {
        nameOccurrenceIndex: -1,
        suggestedUsers: [],
      }
    }

    let suggestedUsers

    if (this.config.userSuggestionSource === "channel") {
      suggestedUsers = (await this.channel.getUserSuggestions(differentMentions[0])).map(
        (membership) => membership.user
      )
    } else {
      suggestedUsers = await this.chat.getUserSuggestions(differentMentions[0])
    }

    return {
      nameOccurrenceIndex: differentMentionPosition,
      suggestedUsers,
    }
  }

  addMentionedUser(user: User, nameOccurrenceIndex: number) {
    let counter = 0
    let result = ""
    let isUserFound = false

    this.value.split(" ").forEach((word) => {
      if (!word.startsWith("@")) {
        result += `${word} `
      } else {
        if (counter !== nameOccurrenceIndex) {
          result += `${word} `
        } else {
          result += `@${user.name} `
          this.mentionedUsers[nameOccurrenceIndex] = user
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

  removeMentionedUser(nameOccurrenceIndex: number) {
    if (this.mentionedUsers[nameOccurrenceIndex]) {
      delete this.mentionedUsers[nameOccurrenceIndex]
      return
    }

    console.warn("This is noop. There is no mention occurrence at this index.")
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
