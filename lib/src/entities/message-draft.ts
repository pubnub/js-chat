import { Chat } from "./chat"
import { User } from "./user"
import { Channel } from "./channel"
import { GetLinkedTextParams, MessageDraftConfig, SendTextOptionParams, TextLink } from "../types"
import { Validator } from "../validator"
import { MentionsUtils } from "../mentions-utils"

declare global {
  interface Array<T> {
    findLastIndex(predicate: (value: T, index: number, obj: T[]) => unknown, thisArg?: any): number
  }
}

type AddLinkedTextParams = {
  text: string
  link: string
  positionInInput: number
}

const range = (start: number, stop: number, step = 1) =>
  Array.from({ length: (stop - start) / step + 1 }, (_, i) => start + i * step)

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
  /** @internal */
  private textLinks: TextLink[] = []
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

  /** @internal */
  private reindexTextLinks() {
    if (this.value.startsWith(this.previousValue)) {
      // a user keeps adding text to the end; nothing to reindex
      return
    }
    if (this.value === this.previousValue) {
      // nothing changed so there is nothing to reindex
      return
    }
    const lengthDifference = Math.abs(this.previousValue.length - this.value.length)

    let newLinks = [...this.textLinks]
    let indicesToFilterOut: number[] = []

    // cut from the end
    if (this.previousValue.startsWith(this.value)) {
      const differenceStartsAtIndex = this.value.length

      newLinks.forEach((textLink, i) => {
        if (textLink.endIndex < differenceStartsAtIndex) {
          return
        }
        // this word was cut
        if (textLink.startIndex >= differenceStartsAtIndex) {
          indicesToFilterOut.push(i)
          return
        }
        // second part of this word was cut
        if (textLink.startIndex < differenceStartsAtIndex) {
          newLinks[i].endIndex = this.value.length
        }
      })

      newLinks = newLinks.filter((link, linkIndex) => !indicesToFilterOut.includes(linkIndex))
      this.textLinks = newLinks
    }

    // a user cut text from the beginning
    else if (this.previousValue.endsWith(this.value)) {
      newLinks = [...this.textLinks]
      indicesToFilterOut = []
      const differenceEndsAtIndex = lengthDifference

      newLinks.forEach((textLink, i) => {
        // this word is intact
        if (textLink.startIndex >= differenceEndsAtIndex) {
          newLinks[i].startIndex -= lengthDifference
          newLinks[i].endIndex -= lengthDifference
          return
        }
        // this word was cut
        if (textLink.endIndex <= differenceEndsAtIndex) {
          indicesToFilterOut.push(i)
          return
        }
        // first part of this word was cut
        if (textLink.startIndex < differenceEndsAtIndex) {
          newLinks[i].startIndex = 0
          newLinks[i].endIndex -= lengthDifference
        }
      })
      newLinks = newLinks.filter((link, linkIndex) => !indicesToFilterOut.includes(linkIndex))
      this.textLinks = newLinks
    }

    // a user cut from the middle of the text
    else if (this.previousValue.length > this.value.length) {
      newLinks = [...this.textLinks]
      indicesToFilterOut = []
      let differenceStartsAtIndex = -1
      let differenceEndsAtIndex = -1

      this.previousValue.split("").forEach((letter, index) => {
        if (this.value[index] !== this.previousValue[index] && differenceStartsAtIndex === -1) {
          differenceStartsAtIndex = index
        }
        if (
          this.value[this.value.length - 1 - index] !==
            this.previousValue[this.previousValue.length - 1 - index] &&
          differenceEndsAtIndex === -1
        ) {
          differenceEndsAtIndex = this.previousValue.length - index
        }
      })

      newLinks.forEach((textLink, i) => {
        // this word was cut
        if (
          differenceStartsAtIndex <= textLink.startIndex &&
          differenceEndsAtIndex >= textLink.endIndex
        ) {
          indicesToFilterOut.push(i)
          return
        }
        // the middle part of this word was cut
        if (
          differenceStartsAtIndex > textLink.startIndex &&
          differenceEndsAtIndex < textLink.endIndex
        ) {
          newLinks[i].endIndex -= lengthDifference
          return
        }
        // second part of this word was cut
        if (
          differenceStartsAtIndex >= textLink.startIndex &&
          differenceEndsAtIndex >= textLink.endIndex &&
          differenceStartsAtIndex < textLink.endIndex
        ) {
          newLinks[i].endIndex = differenceStartsAtIndex
          return
        }
        // first part of this word was cut
        if (
          differenceEndsAtIndex > textLink.startIndex &&
          differenceStartsAtIndex <= textLink.startIndex
        ) {
          newLinks[i].endIndex -= lengthDifference
          newLinks[i].startIndex = differenceStartsAtIndex
          return
        }
        // this word is intact
        if (differenceEndsAtIndex < textLink.endIndex) {
          newLinks[i].startIndex -= lengthDifference
          newLinks[i].endIndex -= lengthDifference
          return
        }
      })

      newLinks = newLinks.filter((link, linkIndex) => !indicesToFilterOut.includes(linkIndex))
      this.textLinks = newLinks
    }
    // a user keeps adding text to the beginning
    else if (this.value.endsWith(this.previousValue)) {
      newLinks = [...this.textLinks]
      indicesToFilterOut = []

      newLinks.forEach((newLink, i) => {
        newLinks[i].endIndex += lengthDifference
        newLinks[i].startIndex += lengthDifference
      })

      this.textLinks = newLinks
    }
    // a user keeps adding text in the middle
    else if (this.value.length > this.previousValue.length) {
      newLinks = [...this.textLinks]
      indicesToFilterOut = []
      let differenceStartsAtIndex = -1
      let differenceEndsAtIndex = -1

      this.previousValue.split("").forEach((letter, index) => {
        if (this.value[index] !== this.previousValue[index] && differenceStartsAtIndex === -1) {
          differenceStartsAtIndex = index
        }
        if (
          this.value[this.value.length - 1 - index] !==
            this.previousValue[this.previousValue.length - 1 - index] &&
          differenceEndsAtIndex === -1
        ) {
          differenceEndsAtIndex = this.previousValue.length - index
        }
      })

      newLinks.forEach((textLink, i) => {
        // text was added before this link
        if (differenceEndsAtIndex <= textLink.startIndex) {
          newLinks[i].startIndex += lengthDifference
          newLinks[i].endIndex += lengthDifference
          return
        }
        // text was added in the middle of the link
        if (
          differenceStartsAtIndex > textLink.startIndex &&
          differenceEndsAtIndex < textLink.endIndex
        ) {
          newLinks[i].endIndex += lengthDifference
          return
        }
        if (
          differenceStartsAtIndex <= textLink.startIndex &&
          differenceEndsAtIndex >= textLink.endIndex
        ) {
          indicesToFilterOut.push(i)
          return
        }
      })
      newLinks = newLinks.filter((link, linkIndex) => !indicesToFilterOut.includes(linkIndex))
      this.textLinks = newLinks
    }
  }

  async onChange(text: string) {
    this.previousValue = this.value
    this.value = text

    if (this.config.isTypingIndicatorTriggered) {
      this.value ? this.channel.startTyping() : this.channel.stopTyping()
    }

    this.reindexTextLinks()

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

  /** @internal */
  private transformMentionedUsersToSend() {
    return Object.keys(this.mentionedUsers).reduce(
      (acc, key) => ({
        ...acc,
        [key]: {
          id: this.mentionedUsers[Number(key)].id,
          name: this.mentionedUsers[Number(key)].name,
        },
      }),
      {}
    )
  }

  async send(params: Omit<SendTextOptionParams, "mentionedUsers"> = {}) {
    return this.channel.sendText(this.value, {
      ...params,
      mentionedUsers: this.transformMentionedUsersToSend(),
      textLinks: this.textLinks,
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

  addLinkedText(params: AddLinkedTextParams) {
    const { text, link, positionInInput } = params

    if (!Validator.isUrl(link)) {
      throw "You need to insert a URL"
    }

    const linkRanges = this.textLinks.flatMap((textLink) =>
      range(textLink.startIndex, textLink.endIndex)
    )
    if (linkRanges.includes(positionInInput)) {
      throw "You cannot insert a link inside another link"
    }

    this.value = this.value.slice(0, positionInInput) + text + this.value.slice(positionInInput)
    this.textLinks.push({
      startIndex: positionInInput,
      endIndex: positionInInput + text.length,
      link,
    })
  }

  removeLinkedText(positionInInput: number) {
    if (Number.isNaN(positionInInput)) {
      throw "You need to insert a number"
    }

    const relevantTextLinkIndex = this.textLinks.findIndex((textLink) =>
      range(textLink.startIndex, textLink.endIndex).includes(positionInInput)
    )

    if (relevantTextLinkIndex === -1) {
      console.warn("This operation is noop. There is no link at this position.")
      return
    }
    this.textLinks = this.textLinks.filter((_, i) => i !== relevantTextLinkIndex)
  }

  getMessagePreview(params?: Partial<GetLinkedTextParams>) {
    let { mentionedUserRenderer, plainLinkRenderer, textLinkRenderer } = params || {}

    mentionedUserRenderer ||= function (userId, mentionedName) {
      return `<a href="https://pubnub.com/${userId}">@${mentionedName}</a> `
    }

    plainLinkRenderer ||= function (link) {
      const linkWithProtocol = link.startsWith("www.") ? `https://${link}` : link

      return `<a href="${linkWithProtocol}">${link}</a> `
    }

    textLinkRenderer ||= function (text, link) {
      const linkWithProtocol = link.startsWith("www.") ? `https://${link}` : link

      return `<a href="${linkWithProtocol}">${text}</a>`
    }

    return MentionsUtils.getLinkedText({
      text: this.value,
      textLinks: this.textLinks,
      mentionedUsers: this.transformMentionedUsersToSend(),
      mentionedUserRenderer,
      plainLinkRenderer,
      textLinkRenderer,
    })
  }
}
