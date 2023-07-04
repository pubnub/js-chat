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
  /** @internal */
  private channel: Channel
  public value = ""
  /** @internal */
  private previousValue = ""
  /** @internal */
  private mentionedUsers: {
    [nameOccurrenceIndex: number]: User
  } = {}
  readonly config: MessageDraftConfig

  /** @internal */
  constructor(chat: Chat, channel: Channel, config?: Partial<MessageDraftConfig>) {
    this.chat = chat
    this.channel = channel
    this.config = {
      userSuggestionSource: "channel",
      isTypingIndicatorTriggered: true,
      userLimit: 10,
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

      return isStringDifferent
    })

    if (previousWordsStartingWithAt.length > currentWordsStartingWithAt.length) {
      // a mention was removed
      const firstRemovalIndex = previousWordsStartingWithAt.findIndex(
        (e, i) => !currentWordsStartingWithAt.includes(e)
      )
      const lastRemovalIndex = previousWordsStartingWithAt.findLastIndex(
        (e, i) => !currentWordsStartingWithAt.includes(e)
      )

      if (lastRemovalIndex !== -1) {
        let reindexedMentionedUsers = { ...this.mentionedUsers }

        Object.keys(this.mentionedUsers).forEach((key) => {
          if (Number(key) >= firstRemovalIndex && Number(key) <= lastRemovalIndex) {
            delete reindexedMentionedUsers[Number(key)]
          }
          if (Number(key) > lastRemovalIndex) {
            delete reindexedMentionedUsers[Number(key)]
            reindexedMentionedUsers = {
              ...reindexedMentionedUsers,
              [Number(key) - lastRemovalIndex + firstRemovalIndex - 1]:
                this.mentionedUsers[Number(key)],
            }
          }
        })

        this.mentionedUsers = reindexedMentionedUsers
      }
    }

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
      suggestedUsers = (
        await this.channel.getUserSuggestions(differentMentions[0], {
          limit: this.config.userLimit,
        })
      ).map((membership) => membership.user)
    } else {
      suggestedUsers = await this.chat.getUserSuggestions(differentMentions[0], {
        limit: this.config.userLimit,
      })
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
      return {
        mentionedUser: null,
        nameOccurrenceIndex: -1,
      }
    }

    if (lastMentionedUserInText.length <= lastMentionedUser.name.split(" ").length) {
      return {
        mentionedUser: lastMentionedUser,
        nameOccurrenceIndex: onlyWordsWithAt.length - 1,
      }
    }

    return {
      mentionedUser: null,
      nameOccurrenceIndex: -1,
    }
  }
}
