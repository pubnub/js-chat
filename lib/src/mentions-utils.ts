import { User } from "./entities/user";

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

  static areMentionedUsersInTextValid(text: string, mentionedUsers: User[]) {
    const mentionedUsersFromTheText = text.split(" ").filter(word => word.startsWith("@"))

    if (mentionedUsers.length !== mentionedUsersFromTheText.length) {
      return false
    }
  }

  static getLinkedText({ text, userCallback }: { text: string, userCallback: (userId: string, mentionedName: string) => any }) {
    const splitText = text.split(" ")
    let concatenatedText = ""
    let nextClosingTagIndex = 0

    for (let i = 0; i < splitText.length; i++) {
      const currentWord = splitText[i]

      if (currentWord.startsWith("<mentioned-user")) {
        nextClosingTagIndex = splitText.slice(i, splitText.length).findIndex(word => word.includes("</mentioned-user>"))

        const fullTag = splitText.slice(i, nextClosingTagIndex + i + 1).reduce((curr, acc) => curr + " " + acc, '').trim()

        const id = fullTag.replace("<mentioned-user", "").replace("</mentioned-user>", "").split('>@')[0].replace("id=", "").replaceAll('"', "").trim()

        concatenatedText += userCallback(id, fullTag.replace(/(<([^>]+)>)/gi, ""))
        i = nextClosingTagIndex + i
      } else {
        concatenatedText += `${currentWord} `
      }
    }

    return concatenatedText.trim()
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
