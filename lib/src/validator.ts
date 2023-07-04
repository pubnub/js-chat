const validProtocols = ["http://", "https://", "www."]

export class Validator {
  static isUrl(potentialUrl: string) {
    if (validProtocols.every((protocol) => potentialUrl.indexOf(protocol) !== 0)) {
      return false
    }
    const urlRegex =
      /(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})/gi

    if (
      potentialUrl.split(".").filter((word) => word !== "").length <
      (potentialUrl.startsWith("www.") ? 3 : 2)
    ) {
      return false
    }

    return urlRegex.test(potentialUrl.replaceAll("\n", ""))
  }
}
