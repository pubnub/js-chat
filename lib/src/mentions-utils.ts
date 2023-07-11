import { MessageMentionedUsers, TextLink } from "./types"
import { Validator } from "./validator"

type GetLinkedTextParams = {
  mentionedUserRenderer: (userId: string, mentionedName: string) => any
  plainLinkRenderer: (link: string) => any
  textLinkRenderer: (text: string, link: string) => any
  text: string
  mentionedUsers: MessageMentionedUsers
  textLinks: TextLink[]
}

const range = (start: number, stop: number, step = 1) =>
  Array.from({ length: (stop - start) / step + 1 }, (_, i) => start + i * step)

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
    mentionedUserRenderer,
    mentionedUsers,
    plainLinkRenderer,
    textLinkRenderer,
    textLinks,
  }: GetLinkedTextParams) {
    let resultWithTextLinks = ""

    const textLinkRanges = textLinks.map((textLink) =>
      range(textLink.startIndex, textLink.endIndex)
    )
    const allIndices = textLinkRanges.flatMap((v) => v)
    const startIndices = textLinkRanges.map((linkRange) => linkRange[0])
    const endIndices = textLinkRanges.map((linkRange) => linkRange[linkRange.length - 1])

    text.split("").forEach((letter, i) => {
      if (startIndices.includes(i)) {
        const relevantIndex = startIndices.indexOf(i)
        const substring = text.substring(i, endIndices[relevantIndex])

        resultWithTextLinks += textLinkRenderer(substring, textLinks[relevantIndex].link)
        return
      }
      if (allIndices.filter((index) => !endIndices.includes(index)).includes(i)) {
        return
      }
      resultWithTextLinks += letter
    })

    let counter = 0
    let result = ""
    // multi word names
    let indicesToSkip: number[] = []
    const splitResultWithTextLinks = resultWithTextLinks.split(" ")

    splitResultWithTextLinks.forEach((word, index) => {
      if (!word.startsWith("@")) {
        if (indicesToSkip.includes(index)) {
          return
        }
        if (Validator.isUrl(word)) {
          const lastCharacter = word.slice(-1)
          if (["!", "?", ".", ","].includes(lastCharacter)) {
            result += `${plainLinkRenderer(word.slice(0, -1))}`.trimEnd()
            result += `${lastCharacter} `
          } else {
            result += `${plainLinkRenderer(word)} `
          }
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
          let possiblePunctuation = ""

          if (userNameWords.length > 1) {
            indicesToSkip = userNameWords.map((_, i) => index + i)
            const lastWord = splitResultWithTextLinks[indicesToSkip[indicesToSkip.length - 1]]
            const lastUserNameWord = userNameWords[userNameWords.length - 1]
            possiblePunctuation = lastWord.replace(lastUserNameWord, "")
          } else {
            possiblePunctuation = word.replace(userName, "")
          }
          possiblePunctuation = possiblePunctuation.replace("@", "")

          counter++
          result += `${mentionedUserRenderer(userId, userName)}`.trimEnd()
          result += `${possiblePunctuation} `
        }
      }
    })

    return result
  }
}
