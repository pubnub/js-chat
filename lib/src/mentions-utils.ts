import { MessageMentionedUsers, MixedTextTypedElement, TextLink, TextTypeElement } from "./types"
import { Validator } from "./validator"

type GetLinkedTextParams = {
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

  static getLinkedText({ text, mentionedUsers, textLinks }: GetLinkedTextParams) {
    let resultWithTextLinks = ""
    const indicesOfWordsWithTextLinks: { start: number; end: number; link: string }[] = []

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

        resultWithTextLinks += ` ${substring} `

        indicesOfWordsWithTextLinks.push({
          start: spacesSoFar + 1,
          end: spacesSoFar + substring.split(" ").length + 1,
          link: textLinks[relevantIndex].link,
        })
        spacesSoFar += 2
        return
      }
      if (allIndices.filter((index) => !endIndices.includes(index)).includes(i)) {
        return
      }
      resultWithTextLinks += letter
    })

    let counter = 0
    // multi word names
    let indicesToSkip: number[] = []

    const splitText = resultWithTextLinks.split(" ")

    const arrayOfTextElements: MixedTextTypedElement[] = []

    splitText.forEach((word, index) => {
      if (!word.startsWith("@")) {
        if (indicesToSkip.includes(index)) {
          return
        }

        const foundTextLink = indicesOfWordsWithTextLinks.find(
          (indexOfTextLink) => indexOfTextLink.start === index
        )

        if (foundTextLink) {
          const substring = splitText.slice(foundTextLink.start, foundTextLink.end).join(" ")

          arrayOfTextElements.push({
            type: "textLink",
            content: {
              link: foundTextLink.link,
              text: substring,
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
          } else {
            arrayOfTextElements.push({
              type: "plainLink",
              content: {
                link: word,
              },
            })
          }
          return
        }

        arrayOfTextElements.push({
          type: "text",
          content: {
            text: word,
          },
        })
      } else {
        const mentionFound = Object.keys(mentionedUsers).indexOf(String(counter)) >= 0

        if (!mentionFound) {
          counter++
          arrayOfTextElements.push({
            type: "text",
            content: {
              text: word,
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
      }
    })

    return arrayOfTextElements.reduce((acc: MixedTextTypedElement[], curr, currentIndex) => {
      let previousObject = undefined

      if (acc && acc.length) {
        previousObject = acc[acc.length - 1]
      }

      if (curr.type === "text" && previousObject?.type === "text") {
        acc = acc.slice(0, -1)
        const optionalPunctuation = ["mention", "plainLink"].includes(
          arrayOfTextElements[currentIndex + 1]?.type
        )
          ? " "
          : ""

        return [
          ...acc,
          {
            type: "text",
            content: {
              text: `${previousObject.content.text} ${curr.content.text}${optionalPunctuation}`,
            },
          } as TextTypeElement<"text">,
        ]
      }

      return [...acc, curr]
    }, [])
  }
}
