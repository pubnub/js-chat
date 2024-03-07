import { GrantTokenPermissions } from "pubnub"
import type { Chat } from "./entities/chat"

export class AccessManager {
  chat: Chat

  constructor(chat: Chat) {
    this.chat = chat
  }

  canI({
    permission,
    resourceType,
    resourceName,
  }: {
    permission: keyof GrantTokenPermissions
    resourceName: string
    resourceType: "channels" | "uuids"
  }) {
    const authKey = this.chat.config.authKey
    // we assume PAM is not enabled
    if (!authKey) {
      return true
    }

    const parsedToken = this.chat.sdk.parseToken(authKey)
    const resourcePermission = parsedToken.resources?.[resourceType]?.[resourceName]?.[permission]
    if (typeof resourcePermission === "boolean") {
      return resourcePermission
    }
    const resourcePatterns = parsedToken.patterns?.[resourceType] || {}
    const resourcePatternsKeys = Object.keys(resourcePatterns)
    for (const pattern of resourcePatternsKeys) {
      const regexp = new RegExp(pattern)
      const matches = regexp.test(resourceName)
      if (matches) {
        return resourcePatterns[pattern][permission] || false
      }
    }

    return false
  }
}
