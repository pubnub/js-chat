import { SendFileParameters } from "pubnub"
import { Chat } from "./chat"
import { User } from "./user"
import { Channel } from "./channel"
import { MessageDraftConfig, MessageDraftOptions, TextLink } from "../types"
import { Validator } from "../validator"
import { MessageElementsUtils } from "../message-elements-utils"
import { Message } from "./message"

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
  private referencedChannels: {
    [channelOccurrenceIndex: number]: Channel
  } = {}
  /** @internal */
  private textLinks: TextLink[] = []
  public quotedMessage: Message | undefined = undefined
  readonly config: MessageDraftConfig
  files?: FileList | File[] | SendFileParameters["file"][] = undefined

  /** @internal */
  constructor(chat: Chat, channel: Channel, config?: Partial<MessageDraftConfig>) {
    this.chat = chat
    this.channel = channel
    this.config = {
      userSuggestionSource: "channel",
      isTypingIndicatorTriggered: true,
      userLimit: 10,
      channelLimit: 10,
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

  /** @internal */
  private getUserOrChannelReference({
    splitSymbol,
    referencesObject,
  }: {
    splitSymbol: "@" | "#"
    referencesObject: { [occuranceIndex: number]: User | Channel }
  }) {
    let copiedObject = { ...referencesObject }
    const previousWordsStartingWithSymbol = this.previousValue
      .split(" ")
      .filter((word) => word.startsWith(splitSymbol))
    const currentWordsStartingWithSymbol = this.value
      .split(" ")
      .filter((word) => word.startsWith(splitSymbol))

    let differentReferencePosition = -1
    let differentReference = null

    for (let i = 0; i < currentWordsStartingWithSymbol.length; i++) {
      if (currentWordsStartingWithSymbol[i] !== previousWordsStartingWithSymbol[i]) {
        differentReference = currentWordsStartingWithSymbol[i]
        differentReferencePosition = i
        break
      }
    }

    if (previousWordsStartingWithSymbol.length > currentWordsStartingWithSymbol.length) {
      // a mention was removed
      const firstRemovalIndex = previousWordsStartingWithSymbol.findIndex(
        (e, i) => !currentWordsStartingWithSymbol.includes(e)
      )
      const lastRemovalIndex = previousWordsStartingWithSymbol.findLastIndex(
        (e, i) => !currentWordsStartingWithSymbol.includes(e)
      )

      if (lastRemovalIndex !== -1) {
        let reindexedReferences = { ...copiedObject }

        Object.keys(copiedObject).forEach((key) => {
          if (Number(key) >= firstRemovalIndex && Number(key) <= lastRemovalIndex) {
            delete reindexedReferences[Number(key)]
          }
          if (Number(key) > lastRemovalIndex) {
            delete reindexedReferences[Number(key)]
            reindexedReferences = {
              ...reindexedReferences,
              [Number(key) - lastRemovalIndex + firstRemovalIndex - 1]: copiedObject[Number(key)],
            }
          }
        })

        copiedObject = reindexedReferences
      }
    }

    Object.keys(copiedObject).forEach((key) => {
      const referencedName = copiedObject[Number(key)]?.name

      if (referencedName && !currentWordsStartingWithSymbol[Number(key)]) {
        delete copiedObject[Number(key)]
      }

      const splitSymbolRegex =
        splitSymbol === "@"
          ? /(^|\s)@([^\s@]+(?:\s+[^\s@]+)*)/g
          : /(^|\s)#([^\s#]+(?:\s+[^\s#]+)*)/g

      const splitMentionsByAt = (this.value.match(splitSymbolRegex) || []).map((match) =>
        match.trim().substring(1)
      )

      if (referencedName && !splitMentionsByAt[Number(key)]?.startsWith(referencedName)) {
        delete copiedObject[Number(key)]
      }
    })

    return {
      referencesObject: copiedObject,
      differentReference,
      differentReferencePosition,
    }
  }

  /** @internal */
  private async parseTextToGetSuggestedUser() {
    const { differentReference, differentReferencePosition, referencesObject } =
      this.getUserOrChannelReference({
        splitSymbol: "@",
        referencesObject: this.mentionedUsers,
      })

    this.mentionedUsers = referencesObject as { [nameOccurance: number]: User }

    if (!differentReference) {
      return {
        nameOccurrenceIndex: -1,
        suggestedUsers: [],
      }
    }

    let suggestedUsers

    if (this.config.userSuggestionSource === "channel") {
      suggestedUsers = (
        await this.channel.getUserSuggestions(differentReference, {
          limit: this.config.userLimit,
        })
      ).map((membership) => membership.user)
    } else {
      suggestedUsers = await this.chat.getUserSuggestions(differentReference, {
        limit: this.config.userLimit,
      })
    }

    return {
      nameOccurrenceIndex: differentReferencePosition,
      suggestedUsers,
    }
  }

  /** @internal */
  private async parseTextToGetSuggestedChannels() {
    const { differentReference, differentReferencePosition, referencesObject } =
      this.getUserOrChannelReference({
        splitSymbol: "#",
        referencesObject: this.referencedChannels,
      })

    this.referencedChannels = referencesObject as { [nameOccurance: number]: Channel }

    if (!differentReference) {
      return {
        channelOccurrenceIndex: -1,
        suggestedChannels: [],
      }
    }

    const suggestedChannels = await this.chat.getChannelSuggestions(differentReference, {
      limit: this.config.channelLimit,
    })

    return {
      channelOccurrenceIndex: differentReferencePosition,
      suggestedChannels,
    }
  }

  async onChange(text: string) {
    this.previousValue = this.value
    this.value = text

    if (this.config.isTypingIndicatorTriggered) {
      this.value ? this.channel.startTyping() : this.channel.stopTyping()
    }

    this.reindexTextLinks()

    return {
      users: await this.parseTextToGetSuggestedUser(),
      channels: await this.parseTextToGetSuggestedChannels(),
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
          const lastCharacter = word.slice(-1)
          result += `@${user.name}`
          if (["!", "?", ".", ","].includes(lastCharacter)) {
            result += `${lastCharacter} `
          } else {
            result += " "
          }

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

  addReferencedChannel(channel: Channel, channelNameOccurrenceIndex: number) {
    let counter = 0
    let result = ""
    let isChannelFound = false

    this.value.split(" ").forEach((word) => {
      if (!word.startsWith("#")) {
        result += `${word} `
      } else {
        if (counter !== channelNameOccurrenceIndex) {
          result += `${word} `
        } else {
          const lastCharacter = word.slice(-1)
          result += `#${channel.name}`
          if (["!", "?", ".", ","].includes(lastCharacter)) {
            result += `${lastCharacter} `
          } else {
            result += " "
          }
          this.referencedChannels[channelNameOccurrenceIndex] = channel
          isChannelFound = true
        }
        counter++
      }
    })

    if (!isChannelFound) {
      throw "This channel does not appear in the text"
    }

    this.value = result.trim()
  }

  removeReferencedChannel(channelNameOccurrenceIndex: number) {
    if (this.referencedChannels[channelNameOccurrenceIndex]) {
      delete this.referencedChannels[channelNameOccurrenceIndex]
      return
    }

    console.warn("This is noop. There is no channel reference occurrence at this index.")
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

  /** @internal */
  private transformReferencedChannelsToSend() {
    return Object.keys(this.referencedChannels).reduce(
      (acc, key) => ({
        ...acc,
        [key]: {
          id: this.referencedChannels[Number(key)].id,
          name: this.referencedChannels[Number(key)].name,
        },
      }),
      {}
    )
  }

  async send(params: MessageDraftOptions = {}) {
    return this.channel.sendText(this.value, {
      ...params,
      mentionedUsers: this.transformMentionedUsersToSend(),
      referencedChannels: this.transformReferencedChannelsToSend(),
      textLinks: this.textLinks,
      quotedMessage: this.quotedMessage,
      files: this.files,
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

    this.onChange(this.value.slice(0, positionInInput) + text + this.value.slice(positionInInput))
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

  getMessagePreview() {
    return MessageElementsUtils.getMessageElements({
      text: this.value,
      textLinks: this.textLinks,
      mentionedUsers: this.transformMentionedUsersToSend(),
      referencedChannels: this.transformReferencedChannelsToSend(),
    })
  }

  addQuote(message: Message) {
    if (message.channelId !== this.channel.id) {
      throw "You cannot quote messages from other channels"
    }

    this.quotedMessage = message
  }

  removeQuote() {
    this.quotedMessage = undefined
  }
}
