import {
  MessageMentionedUsers,
  MessageReferencedChannels,
  MixedTextTypedElement,
  TextLink,
  TextTypeElement,
} from "./types"
import { Validator } from "./validator"

type GetLinkedTextParams = {
  text: string
  mentionedUsers: MessageMentionedUsers
  textLinks: TextLink[]
  referencedChannels: MessageReferencedChannels
}

const range = (start: number, stop: number, step = 1) =>
  Array.from({ length: (stop - start) / step + 1 }, (_, i) => start + i * step)

export class MessageElementsUtils {
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

  static getChannelPhraseToLookFor(text: string) {
    const lastAtIndex = text.lastIndexOf("#")
    const charactersAfterHash = text.split("#").slice(-1)[0]

    if (lastAtIndex === -1 || charactersAfterHash.length < 3) {
      return null
    }

    const splitWords = charactersAfterHash.split(" ")

    if (splitWords.length > 2) {
      return null
    }

    return splitWords[0] + (splitWords[1] ? ` ${splitWords[1]}` : "")
  }

  static getMessageElements({
    text,
    mentionedUsers,
    textLinks,
    referencedChannels,
  }: GetLinkedTextParams) {
    let resultWithTextLinks = ""
    const indicesOfWordsWithTextLinks: {
      start: number
      end: number
      substring: string
      link: string
    }[] = []

    const textLinkRanges = textLinks.map((textLink) =>
      range(textLink.startIndex, textLink.endIndex)
    )
    const allIndices = textLinkRanges.flatMap((v) => v)
    const startIndices = textLinkRanges.map((linkRange) => linkRange[0])
    const endIndices = textLinkRanges.map((linkRange) => linkRange[linkRange.length - 1])
    let spacesSoFar = 0

    text.split("").forEach((letter, i) => {
      if (letter === " ") {
        spacesSoFar++
      }
      if (startIndices.includes(i)) {
        const relevantIndex = startIndices.indexOf(i)
        const substring = text.substring(i, endIndices[relevantIndex])

        resultWithTextLinks += substring

        indicesOfWordsWithTextLinks.push({
          start: spacesSoFar,
          end: spacesSoFar + substring.split(" ").length,
          link: textLinks[relevantIndex].link,
          substring,
        })
        return
      }
      if (allIndices.filter((index) => !endIndices.includes(index)).includes(i)) {
        return
      }
      resultWithTextLinks += letter
    })

    let counter = 0
    let channelCounter = 0
    // multi word user names
    let indicesToSkip: number[] = []
    // multi word channel names
    let channelIndicesToSkip: number[] = []

    const splitText = resultWithTextLinks.split(" ")

    const arrayOfTextElements: MixedTextTypedElement[] = []

    splitText.forEach((word, index) => {
      if (!word.startsWith("@") && !word.startsWith("#")) {
        if (indicesToSkip.includes(index) || channelIndicesToSkip.includes(index)) {
          return
        }

        const foundTextLink = indicesOfWordsWithTextLinks.find(
          (indexOfTextLink) => indexOfTextLink.start === index
        )

        if (foundTextLink) {
          const substring = splitText.slice(foundTextLink.start, foundTextLink.end).join(" ")
          const additionalPunctuation = substring.replace(foundTextLink.substring, "")

          arrayOfTextElements.push({
            type: "textLink",
            content: {
              link: foundTextLink.link,
              text: foundTextLink.substring,
            },
          })
          if (additionalPunctuation) {
            arrayOfTextElements.push({
              type: "text",
              content: {
                text: additionalPunctuation,
              },
            })
          }
          arrayOfTextElements.push({
            type: "text",
            content: {
              text: " ",
            },
          })
          indicesToSkip = substring.split(" ").map((_, i) => index + i)
          return
        }

        if (Validator.isUrl(word)) {
          const lastCharacter = word.slice(-1)
          if (["!", "?", ".", ","].includes(lastCharacter)) {
            arrayOfTextElements.push({
              type: "plainLink",
              content: {
                link: word.slice(0, -1),
              },
            })
            arrayOfTextElements.push({
              type: "text",
              content: {
                text: lastCharacter,
              },
            })
            arrayOfTextElements.push({
              type: "text",
              content: {
                text: " ",
              },
            })
          } else {
            arrayOfTextElements.push({
              type: "plainLink",
              content: {
                link: word,
              },
            })
            arrayOfTextElements.push({
              type: "text",
              content: {
                text: " ",
              },
            })
          }
          return
        }

        if (word) {
          arrayOfTextElements.push({
            type: "text",
            content: {
              text: word,
            },
          })
          arrayOfTextElements.push({
            type: "text",
            content: {
              text: " ",
            },
          })
        }
      } else if (word.startsWith("@")) {
        const mentionFound = Object.keys(mentionedUsers).indexOf(String(counter)) >= 0

        if (!mentionFound) {
          counter++
          arrayOfTextElements.push({
            type: "text",
            content: {
              text: word,
            },
          })
          arrayOfTextElements.push({
            type: "text",
            content: {
              text: " ",
            },
          })
        } else {
          const userId = mentionedUsers[counter].id
          const userName = mentionedUsers[counter].name
          const userNameWords = userName.split(" ")

          let additionalPunctuationCharacters = ""

          if (userNameWords.length > 1) {
            indicesToSkip = userNameWords.map((_, i) => index + i)
            additionalPunctuationCharacters = splitText[
              indicesToSkip[indicesToSkip.length - 1]
            ].replace(userNameWords[userNameWords.length - 1], "")
          } else {
            additionalPunctuationCharacters = word.replace("@", "").replace(userName, "")
          }
          if (additionalPunctuationCharacters) {
            additionalPunctuationCharacters = `${additionalPunctuationCharacters} `
          }
          if (additionalPunctuationCharacters === "") {
            additionalPunctuationCharacters = " "
          }

          counter++
          arrayOfTextElements.push({
            type: "mention",
            content: {
              name: userName,
              id: userId,
            },
          })
          arrayOfTextElements.push({
            type: "text",
            content: {
              text: additionalPunctuationCharacters,
            },
          })
        }
      } else {
        const channelReferenceFound =
          Object.keys(referencedChannels).indexOf(String(channelCounter)) >= 0

        if (!channelReferenceFound) {
          channelCounter++
          arrayOfTextElements.push({
            type: "text",
            content: {
              text: word,
            },
          })
          arrayOfTextElements.push({
            type: "text",
            content: {
              text: " ",
            },
          })
        } else {
          const userId = referencedChannels[channelCounter].id
          const channelName = referencedChannels[channelCounter].name
          const channelNameWords = channelName.split(" ")

          let additionalPunctuationCharacters = ""

          if (channelNameWords.length > 1) {
            channelIndicesToSkip = channelNameWords.map((_, i) => index + i)
            additionalPunctuationCharacters = splitText[
              channelIndicesToSkip[channelIndicesToSkip.length - 1]
            ].replace(channelNameWords[channelNameWords.length - 1], "")
          } else {
            additionalPunctuationCharacters = word.replace("#", "").replace(channelName, "")
          }
          if (additionalPunctuationCharacters) {
            additionalPunctuationCharacters = `${additionalPunctuationCharacters} `
          }
          if (additionalPunctuationCharacters === "") {
            additionalPunctuationCharacters = " "
          }

          channelCounter++
          arrayOfTextElements.push({
            type: "channelReference",
            content: {
              name: channelName,
              id: userId,
            },
          })
          arrayOfTextElements.push({
            type: "text",
            content: {
              text: additionalPunctuationCharacters,
            },
          })
        }
      }
    })
    if (arrayOfTextElements[arrayOfTextElements.length - 1].type === "text") {
      ;(
        arrayOfTextElements[arrayOfTextElements.length - 1] as TextTypeElement<"text">
      ).content.text = (
        arrayOfTextElements[arrayOfTextElements.length - 1] as TextTypeElement<"text">
      ).content.text.trim()
    }
    if (
      arrayOfTextElements[arrayOfTextElements.length - 1].type === "text" &&
      [" ", ""].includes(
        (arrayOfTextElements[arrayOfTextElements.length - 1] as TextTypeElement<"text">).content
          .text
      )
    ) {
      arrayOfTextElements.length = arrayOfTextElements.length - 1
    }

    return arrayOfTextElements.reduce((acc: MixedTextTypedElement[], curr) => {
      let previousObject = undefined

      if (acc && acc.length) {
        previousObject = acc[acc.length - 1]
      }
      if (curr.type === "text" && previousObject?.type === "text") {
        acc = acc.slice(0, -1)

        return [
          ...acc,
          {
            type: "text",
            content: {
              text: `${previousObject.content.text}${curr.content.text}`,
            },
          } as TextTypeElement<"text">,
        ]
      }

      return [...acc, curr]
    }, [])
  }
}
