const validProtocols = ["http://", "https://", "www."]

export class Validator {
  static isUrl(potentialUrl: string) {
    if (validProtocols.every(protocol => potentialUrl.indexOf(protocol) !== 0)) {
      return false
    }
    const httphttpsRegex = /^https?:\/\/[^\s/$.?#].[^\s]*$/;
    const wwwRegex = /^www\.[^\s/$.?#].[^\s]*$/;

    if (potentialUrl.split(".").filter(word => word !== "").length < (potentialUrl.startsWith("www.") ? 3 : 2)) {
      return false
    }

    return [httphttpsRegex, wwwRegex].some(regex => regex.test(potentialUrl))
  }
}
