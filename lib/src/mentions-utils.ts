import { User } from "./entities/user";
import { XmlParser } from "./xml-parser";

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

  static getLinkedText({ text, userCallback }: { text: string, userCallback: (userId: string, mentionedName: string) => any }) {
    const pattern = /(<mentioned-user[^>]+>[^<]+<\/mentioned-user>)|(\b\w+\b)/g;
    const matches = text.matchAll(pattern);

    const result = [...matches].map(match => match[0]);

    let finalResult = ""

    result.forEach(element => {
      if (element.startsWith("<")) {
        const xmlParser = new XmlParser()
        const data = xmlParser.parseFromString(element)

        finalResult += `${userCallback(data.attributes.id, data.value)}`
      } else {
        finalResult += `${element} `
      }
    })

    return finalResult
  }

  static parseTextToAddUsers(text: string, mentionedUsers: User[]) {
    const splitWords = text.split(" ")
    let isThisWordUsed = false
    let concatenatedWords = ""

    for (let i = 0; i < splitWords.length; i++) {
      if (!splitWords[i].startsWith("@")) {
        if (isThisWordUsed) {
          isThisWordUsed = false
          continue
        }

        concatenatedWords += `${splitWords[i]} `
        continue
      }
      mentionedUsers.forEach(mentionedUser => {
        const wordWithoutAt = splitWords[i].slice(1, splitWords[i].length)

        if (mentionedUser.name!.split(" ").length === 1) {

          if (mentionedUser.name === wordWithoutAt) {
            concatenatedWords += `<mentioned-user id="${mentionedUser.id}">@${wordWithoutAt}</mentioned-user> `
          }
        } else {
          const nextWord = splitWords[i + 1] ? splitWords[i + 1] : ""

          if (mentionedUser.name === wordWithoutAt + " " + nextWord) {
            isThisWordUsed = true
            concatenatedWords += `<mentioned-user id="${mentionedUser.id}">@${wordWithoutAt} ${nextWord}</mentioned-user> `
          }
        }
      })
    }

    return concatenatedWords
  }
}
